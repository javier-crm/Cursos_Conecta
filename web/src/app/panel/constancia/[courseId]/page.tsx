import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Constancia" };

const dateFmt = new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "America/Monterrey" });

// Constancia imprimible (Archivo → Imprimir → Guardar como PDF).
export default async function Page({ params }: PageProps<"/panel/constancia/[courseId]">) {
  const { courseId } = await params;
  const { supabase, user, profile } = await requireUser(`/panel/constancia/${courseId}`);

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, course:courses(title, live_sessions(starts_at, duration_minutes), instructor:instructors(display_name))")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .eq("status", "active")
    .maybeSingle();
  if (!enrollment) notFound();

  const course = Array.isArray(enrollment.course) ? enrollment.course[0] : enrollment.course;
  if (!course) notFound();
  const instructor = Array.isArray(course.instructor) ? course.instructor[0] : course.instructor;

  // Solo disponible cuando la última sesión ya terminó
  const ends = (course.live_sessions ?? []).map(
    (s) => new Date(s.starts_at).getTime() + s.duration_minutes * 60_000,
  );
  const lastEnd = ends.length ? Math.max(...ends) : 0;
  const now = new Date().getTime();
  if (!lastEnd || now < lastEnd) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
          Tu constancia estará disponible cuando termine el curso.
        </p>
      </main>
    );
  }

  const totalMinutes = (course.live_sessions ?? []).reduce((sum, s) => sum + s.duration_minutes, 0);

  return (
    <main className="flex flex-1 items-center justify-center bg-slate-100 px-4 py-10 print:bg-white print:p-0">
      <div className="w-full max-w-2xl">
        <div className="mb-4 text-center print:hidden">
          <button className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white" data-print>
            Imprimir / guardar PDF
          </button>
          <script
            dangerouslySetInnerHTML={{
              __html: `document.querySelector('[data-print]').addEventListener('click',()=>window.print())`,
            }}
          />
        </div>
        <div className="rounded-2xl border-4 border-double border-indigo-200 bg-white p-12 text-center shadow-sm print:rounded-none print:border-8 print:shadow-none">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-600">Constancia de participación</p>
          <p className="mt-8 text-slate-500">Se otorga la presente a</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{profile?.full_name ?? "—"}</p>
          <p className="mt-6 text-slate-500">por haber participado en el curso en vivo</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{course.title}</p>
          <p className="mt-1 text-sm text-slate-500">
            con duración de {(totalMinutes / 60).toLocaleString("es-MX")} horas
            {instructor && <> · impartido por {instructor.display_name}</>}
          </p>
          <p className="mt-10 text-sm text-slate-400">{dateFmt.format(new Date(lastEnd))}</p>
          <p className="mt-8 border-t border-slate-200 pt-4 text-sm font-medium text-slate-600">Cursos en Vivo</p>
        </div>
      </div>
    </main>
  );
}
