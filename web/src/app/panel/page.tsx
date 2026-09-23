import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ReviewForm } from "./ReviewForm";

export const metadata = { title: "Mi panel" };

const dateFmt = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Monterrey",
});

type SessionRow = {
  id: string;
  position: number;
  title: string | null;
  starts_at: string;
  duration_minutes: number;
};

type CourseRow = { id: string; slug: string; title: string; replay_hours: number; live_sessions: SessionRow[] };

type EnrollmentRow = {
  id: string;
  permanent_replay: boolean;
  course: CourseRow | CourseRow[] | null;
};

export default async function Page() {
  const { supabase, profile, role, user } = await requireUser("/panel");

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      "id, permanent_replay, course:courses(id, slug, title, replay_hours, live_sessions(id, position, title, starts_at, duration_minutes))",
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .returns<EnrollmentRow[]>();

  // Grabaciones y ligas de clase: la RLS solo devuelve filas de cursos donde estás inscrito
  const sessionIds = (enrollments ?? []).flatMap((e) => {
    const course = Array.isArray(e.course) ? e.course[0] : e.course;
    return course?.live_sessions.map((s) => s.id) ?? [];
  });
  const { data: accessRows } = sessionIds.length
    ? await supabase
        .from("live_session_access")
        .select("session_id, join_url, recording_url, recording_expires_at")
        .in("session_id", sessionIds)
    : { data: [] as { session_id: string; join_url: string | null; recording_url: string | null; recording_expires_at: string | null }[] };

  const accessBySession = new Map((accessRows ?? []).map((a) => [a.session_id, a]));

  // Cursos que este alumno ya calificó
  const { data: myReviews } = await supabase
    .from("reviews")
    .select("course_id")
    .eq("user_id", user.id);
  const reviewedCourses = new Set((myReviews ?? []).map((r) => r.course_id));

  const now = new Date();
  const firstName = profile?.full_name?.split(" ")[0];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Hola{firstName ? `, ${firstName}` : ""} 👋</h1>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link href="/panel/facturacion" className="rounded-lg bg-slate-100 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-200">Facturación</Link>
        {(role === "instructor" || role === "admin") && (
          <Link href="/instructor" className="rounded-lg bg-slate-100 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-200">Panel de instructor</Link>
        )}
        {role === "admin" && (
          <Link href="/admin" className="rounded-lg bg-slate-100 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-200">Administración</Link>
        )}
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Mis cursos</h2>
        {!enrollments?.length ? (
          <div className="mt-3 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-600">
            Todavía no tienes cursos.{" "}
            <Link href="/cursos" className="font-medium text-indigo-600 hover:underline">Ver cursos disponibles</Link>
          </div>
        ) : (
          <ul className="mt-3 space-y-5">
            {enrollments.map((enrollment) => {
              const course = Array.isArray(enrollment.course) ? enrollment.course[0] : enrollment.course;
              if (!course) return null;
              const sessions = [...course.live_sessions].sort((a, b) => a.position - b.position);
              const courseEnded =
                sessions.length > 0 &&
                sessions.every((s) => now > new Date(new Date(s.starts_at).getTime() + s.duration_minutes * 60_000));
              const firstSessionEnded =
                sessions.length > 0 &&
                now > new Date(new Date(sessions[0].starts_at).getTime() + sessions[0].duration_minutes * 60_000);
              const canReview = firstSessionEnded && !reviewedCourses.has(course.id);
              return (
                <li key={enrollment.id} className="rounded-xl border border-slate-200 bg-white p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-slate-900">{course.title}</h3>
                    <div className="flex items-center gap-2">
                      {enrollment.permanent_replay && (
                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                          Grabaciones permanentes
                        </span>
                      )}
                      {courseEnded && (
                        <Link
                          href={`/panel/constancia/${course.id}`}
                          className="rounded-full border border-indigo-200 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                        >
                          Descargar constancia
                        </Link>
                      )}
                    </div>
                  </div>
                  <ul className="mt-4 space-y-3">
                    {sessions.map((session) => {
                      const start = new Date(session.starts_at);
                      const end = new Date(start.getTime() + session.duration_minutes * 60_000);
                      const access = accessBySession.get(session.id);
                      // El botón aparece 15 min antes y durante la clase
                      const joinOpen = now >= new Date(start.getTime() - 15 * 60_000) && now <= end;
                      const recordingLive =
                        access?.recording_url &&
                        (enrollment.permanent_replay ||
                          !access.recording_expires_at ||
                          new Date(access.recording_expires_at) > now);
                      const recordingExpired =
                        access?.recording_url && !recordingLive;

                      return (
                        <li key={session.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {session.title ?? `Sesión ${session.position}`}
                            </p>
                            <p className="text-sm capitalize text-slate-500">{dateFmt.format(start)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {joinOpen && access?.join_url && (
                              <a
                                href={`/clase/${session.id}`}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                              >
                                Entrar a la clase
                              </a>
                            )}
                            {!joinOpen && now < start && (
                              <span className="text-sm text-slate-500">Próximamente</span>
                            )}
                            {recordingLive && (
                              <a
                                href={access!.recording_url!}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
                              >
                                Ver grabación
                                {!enrollment.permanent_replay && access!.recording_expires_at && (
                                  <span className="text-slate-400"> · disponible {course.replay_hours} h</span>
                                )}
                              </a>
                            )}
                            {recordingExpired && (
                              <span className="text-sm text-slate-400">Grabación expirada</span>
                            )}
                            {now > end && !access?.recording_url && (
                              <span className="text-sm text-slate-400">Grabación en proceso</span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  {canReview && <ReviewForm courseId={course.id} />}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
