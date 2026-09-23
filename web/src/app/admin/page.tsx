import { requireRole } from "@/lib/auth";

export const metadata = { title: "Administración" };

export default async function Page() {
  await requireRole(["admin"], "/admin");
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Administración</h1>
      <p className="mt-1 text-slate-600">Ventas, instructores, cursos, cupones y pagos a instructores (semana 7–8).</p>
    </main>
  );
}
