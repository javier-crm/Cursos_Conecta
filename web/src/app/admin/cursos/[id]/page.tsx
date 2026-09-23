import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CourseForm } from "../../forms";
import { WaitlistNotifyButton } from "./WaitlistNotifyButton";

export const metadata = { title: "Editar curso" };

export default async function Page({ params }: PageProps<"/admin/cursos/[id]">) {
  await requireRole(["admin"], "/admin");
  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: course }, { data: instructors }, { count: waitingCount }] = await Promise.all([
    admin
      .from("courses")
      .select(
        "id, instructor_id, title, subtitle, description, price_cents, capacity, replay_hours, permanent_replay_price_cents, sales_close_at, video_url, status, live_sessions(position, title, starts_at, duration_minutes)",
      )
      .eq("id", id)
      .maybeSingle(),
    admin.from("instructors").select("id, display_name").order("display_name"),
    admin.from("waitlist").select("id", { count: "exact", head: true }).eq("course_id", id).is("notified_at", null),
  ]);
  if (!course) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Link href="/admin" className="text-sm text-indigo-600 hover:underline">← Administración</Link>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Editar curso</h1>
      {(waitingCount ?? 0) > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            <b>{waitingCount}</b> personas en lista de espera sin avisar. Si abriste más cupo o nueva fecha:
          </p>
          <WaitlistNotifyButton courseId={course.id} />
        </div>
      )}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <CourseForm course={{ ...course, sessions: course.live_sessions }} instructors={instructors ?? []} />
      </div>
    </main>
  );
}
