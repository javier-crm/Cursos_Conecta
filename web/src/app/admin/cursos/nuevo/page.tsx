import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CourseForm } from "../../forms";

export const metadata = { title: "Nuevo curso" };

export default async function Page() {
  await requireRole(["admin"], "/admin/cursos/nuevo");
  const admin = createAdminClient();
  const { data: instructors } = await admin
    .from("instructors")
    .select("id, display_name")
    .eq("active", true)
    .order("display_name");

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Link href="/admin" className="text-sm text-indigo-600 hover:underline">← Administración</Link>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Nuevo curso</h1>
      {!instructors?.length ? (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-700">
          Primero <Link href="/admin/instructores" className="font-medium underline">agrega un instructor</Link>.
        </p>
      ) : (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <CourseForm instructors={instructors} />
        </div>
      )}
    </main>
  );
}
