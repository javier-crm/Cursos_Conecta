import Link from "next/link";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Mi panel" };

export default async function Page() {
  const { supabase, profile, role } = await requireUser("/panel");

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, course:courses(slug, title, live_sessions(starts_at))")
    .eq("status", "active");

  const firstName = profile?.full_name?.split(" ")[0];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Hola{firstName ? `, ${firstName}` : ""} 👋</h1>
      <p className="mt-1 text-slate-600">Aquí verás tus cursos, próximas clases, grabaciones y facturas.</p>

      {(role === "instructor" || role === "admin") && (
        <div className="mt-4 flex gap-3 text-sm">
          <Link href="/instructor" className="rounded-lg bg-slate-100 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-200">Panel de instructor</Link>
          {role === "admin" && (
            <Link href="/admin" className="rounded-lg bg-slate-100 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-200">Administración</Link>
          )}
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Mis cursos</h2>
        {!enrollments?.length ? (
          <div className="mt-3 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-600">
            Todavía no tienes cursos.{" "}
            <Link href="/cursos" className="font-medium text-indigo-600 hover:underline">Ver cursos disponibles</Link>
          </div>
        ) : (
          <ul className="mt-3 grid gap-4 sm:grid-cols-2">
            {enrollments.map((e) => {
              const course = Array.isArray(e.course) ? e.course[0] : e.course;
              return (
                <li key={e.id} className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="font-semibold text-slate-900">{course?.title}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
