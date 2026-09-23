import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/supabase/config";
import { ZoomButton } from "./ZoomButton";

export const metadata = { title: "Administración" };

const money = (cents: number) => `$${(cents / 100).toLocaleString("es-MX")}`;
const dateFmt = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Monterrey" });

export default async function Page() {
  await requireRole(["admin"], "/admin");

  if (!supabaseConfigured) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-bold text-slate-900">Administración</h1>
        <p className="mt-2 text-slate-600">Conecta Supabase para ver ventas y cursos.</p>
      </main>
    );
  }

  const admin = createAdminClient();
  const [{ data: courses }, { data: paidOrders }] = await Promise.all([
    admin
      .from("courses")
      .select(
        "id, title, status, price_cents, capacity, live_sessions(id, position, starts_at, live_session_access(session_id, recording_url))",
      )
      .order("created_at", { ascending: false }),
    admin
      .from("orders")
      .select("amount_cents, course_id, course:courses(title, instructor:instructors(display_name, commission_pct))")
      .eq("status", "paid"),
  ]);

  const totalCents = (paidOrders ?? []).reduce((sum, o) => sum + o.amount_cents, 0);

  // Resumen por instructor para el pago mensual
  const byInstructor = new Map<string, { gross: number; share: number }>();
  for (const order of paidOrders ?? []) {
    const course = Array.isArray(order.course) ? order.course[0] : order.course;
    const instructor = course && (Array.isArray(course.instructor) ? course.instructor[0] : course.instructor);
    if (!instructor) continue;
    const entry = byInstructor.get(instructor.display_name) ?? { gross: 0, share: 0 };
    entry.gross += order.amount_cents;
    entry.share += Math.round((order.amount_cents * Number(instructor.commission_pct)) / 100);
    byInstructor.set(instructor.display_name, entry);
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Administración</h1>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Ventas totales</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{money(totalCents)} MXN</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Órdenes pagadas</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{paidOrders?.length ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Cursos</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{courses?.length ?? 0}</p>
        </div>
      </section>

      {byInstructor.size > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">Pago a instructores (acumulado)</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Instructor</th>
                  <th className="px-4 py-2.5 font-medium">Ventas</th>
                  <th className="px-4 py-2.5 font-medium">Su parte</th>
                </tr>
              </thead>
              <tbody>
                {[...byInstructor.entries()].map(([name, { gross, share }]) => (
                  <tr key={name} className="border-t border-slate-100">
                    <td className="px-4 py-2.5 font-medium text-slate-900">{name}</td>
                    <td className="px-4 py-2.5 text-slate-600">{money(gross)}</td>
                    <td className="px-4 py-2.5 text-slate-900">{money(share)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Cursos y sesiones</h2>
        <ul className="mt-3 space-y-4">
          {(courses ?? []).map((course) => {
            const sessions = (course.live_sessions ?? []).sort((a, b) => a.position - b.position);
            return (
              <li key={course.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {course.title}{" "}
                      <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{course.status}</span>
                    </p>
                    <p className="text-sm text-slate-500">{money(course.price_cents)} · cupo {course.capacity ?? "ilimitado"}</p>
                  </div>
                  <ZoomButton courseId={course.id} />
                </div>
                <ul className="mt-3 space-y-1 text-sm text-slate-600">
                  {sessions.map((s) => {
                    const access = Array.isArray(s.live_session_access) ? s.live_session_access[0] : s.live_session_access;
                    return (
                      <li key={s.id} className="flex items-center gap-2">
                        <span>Sesión {s.position} · {dateFmt.format(new Date(s.starts_at))}</span>
                        {access ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            Zoom listo{access.recording_url ? " · grabación disponible" : ""}
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Sin reunión</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
