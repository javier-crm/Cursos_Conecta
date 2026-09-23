import { requireRole } from "@/lib/auth";

export const metadata = { title: "Panel de instructor" };

export default async function Page() {
  await requireRole(["instructor", "admin"], "/instructor");
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Panel de instructor</h1>
      <p className="mt-1 text-slate-600">Tus cursos, alumnos inscritos, próximas sesiones y ventas (semana 7–8).</p>
    </main>
  );
}
