import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CourseForm } from "../../forms";

export const metadata = { title: "Editar curso" };

export default async function Page({ params }: PageProps<"/admin/cursos/[id]">) {
  await requireRole(["admin"], "/admin");
  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: course }, { data: instructors }] = await Promise.all([
    admin
      .from("courses")
      .select(
        "id, instructor_id, title, subtitle, description, price_cents, capacity, replay_hours, permanent_replay_price_cents, sales_close_at, status, live_sessions(position, title, starts_at, duration_minutes)",
      )
      .eq("id", id)
      .maybeSingle(),
    admin.from("instructors").select("id, display_name").order("display_name"),
  ]);
  if (!course) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Link href="/admin" className="text-sm text-indigo-600 hover:underline">← Administración</Link>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Editar curso</h1>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <CourseForm course={{ ...course, sessions: course.live_sessions }} instructors={instructors ?? []} />
      </div>
    </main>
  );
}
