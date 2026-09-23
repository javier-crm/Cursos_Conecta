import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/supabase/config";
import { AnnounceForm } from "./AnnounceForm";

export const metadata = { title: "Panel de instructor" };

const money = (cents: number) => `$${(cents / 100).toLocaleString("es-MX")}`;
const dateFmt = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Monterrey",
});

export default async function Page() {
  const { user } = await requireRole(["instructor", "admin"], "/instructor");

  if (!supabaseConfigured) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-bold text-slate-900">Panel de instructor</h1>
        <p className="mt-2 text-slate-600">Conecta Supabase para ver tus cursos.</p>
      </main>
    );
  }

  const admin = createAdminClient();
  const { data: instructor } = await admin
    .from("instructors")
    .select("id, display_name, commission_pct")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!instructor) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-bold text-slate-900">Panel de instructor</h1>
        <p className="mt-2 text-slate-600">
          Tu cuenta aún no está ligada a un perfil de instructor. Pídele al administrador que la vincule.
        </p>
      </main>
    );
  }

  const { data: courses } = await admin
    .from("courses")
    .select(
      "id, title, status, price_cents, capacity, live_sessions(id, position, title, starts_at), enrollments(id, status, user_id), orders(status, amount_cents)",
    )
    .eq("instructor_id", instructor.id)
    .order("created_at", { ascending: false });

  // Total vendido y su parte
  let grossCents = 0;
  for (const course of courses ?? []) {
    for (const order of course.orders ?? []) if (order.status === "paid") grossCents += order.amount_cents;
  }
  const shareCents = Math.round((grossCents * Number(instructor.commission_pct)) / 100);

  // Nombres de alumnos (solo de sus cursos)
  const studentIds = [...new Set((courses ?? []).flatMap((c) => (c.enrollments ?? []).filter((e) => e.status === "active").map((e) => e.user_id)))];
  const { data: profiles } = studentIds.length
    ? await admin.from("profiles").select("id, full_name, phone").in("id", studentIds)
    : { data: [] as { id: string; full_name: string | null; phone: string | null }[] };
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Hola, {instructor.display_name}</h1>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Ventas de tus cursos</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{money(grossCents)} MXN</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Tu parte ({instructor.commission_pct}%)</p>
          <p className="mt-1 text-2xl font-bold text-indigo-700">{money(shareCents)} MXN</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Alumnos activos</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{studentIds.length}</p>
        </div>
      </section>

      <section className="mt-8 space-y-5">
        {(courses ?? []).map((course) => {
          const active = (course.enrollments ?? []).filter((e) => e.status === "active");
          const sessions = [...(course.live_sessions ?? [])].sort((a, b) => a.position - b.position);
          return (
            <div key={course.id} className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold text-slate-900">
                  {course.title}
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{course.status}</span>
                </h2>
                <p className="text-sm text-slate-500">
                  {active.length}{course.capacity ? ` / ${course.capacity}` : ""} inscritos · {money(course.price_cents)}
                </p>
              </div>

              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                {sessions.map((s) => (
                  <li key={s.id}>
                    {s.title ?? `Sesión ${s.position}`} · {dateFmt.format(new Date(s.starts_at))}
                  </li>
                ))}
              </ul>

              {active.length > 0 && <AnnounceForm courseId={course.id} />}

              {active.length > 0 && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-indigo-600 hover:underline">
                    Ver lista de alumnos ({active.length})
                  </summary>
                  <ul className="mt-2 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
                    {active.map((e) => {
                      const profile = nameById.get(e.user_id);
                      return (
                        <li key={e.id} className="rounded bg-slate-50 px-3 py-1.5">
                          {profile?.full_name ?? "Alumno"}
                          {profile?.phone && <span className="text-slate-400"> · {profile.phone}</span>}
                        </li>
                      );
                    })}
                  </ul>
                </details>
              )}
            </div>
          );
        })}
        {!courses?.length && (
          <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-600">
            Aún no tienes cursos asignados. El administrador los crea desde <Link href="/admin" className="text-indigo-600 hover:underline">Administración</Link>.
          </p>
        )}
      </section>
    </main>
  );
}
