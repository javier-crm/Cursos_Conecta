import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { InstructorForm } from "../forms";

export const metadata = { title: "Instructores" };

export default async function Page() {
  await requireRole(["admin"], "/admin/instructores");
  const admin = createAdminClient();
  const { data: instructors } = await admin
    .from("instructors")
    .select("id, display_name, topic, bio, commission_pct, active, profile_id")
    .order("display_name");

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <Link href="/admin" className="text-sm text-indigo-600 hover:underline">← Administración</Link>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Instructores</h1>

      <section className="mt-6 space-y-4">
        {(instructors ?? []).map((instructor) => (
          <details key={instructor.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <span>
                <span className="font-semibold text-slate-900">{instructor.display_name}</span>
                {instructor.topic && <span className="ml-2 text-sm text-slate-500">{instructor.topic}</span>}
              </span>
              <span className="flex items-center gap-2 text-sm">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{instructor.commission_pct}%</span>
                {!instructor.active && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">Inactivo</span>}
                {!instructor.profile_id && (
                  <span className="rounded-full bg-slate-50 px-2.5 py-1 text-slate-400" title="Aún no tiene cuenta ligada">sin cuenta</span>
                )}
              </span>
            </summary>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <InstructorForm instructor={instructor} />
            </div>
          </details>
        ))}
      </section>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Agregar instructor</h2>
        <div className="mt-4">
          <InstructorForm />
        </div>
      </section>

      <p className="mt-4 text-sm text-slate-500">
        Para que un instructor entre a su panel: pídele crear su cuenta en el sitio y luego lígala desde Supabase
        (tabla <code>instructors.profile_id</code> + rol <code>instructor</code> en <code>profiles</code>).
      </p>
    </main>
  );
}
