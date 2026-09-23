import { notFound } from "next/navigation";
import { formatPrice, getCourseBySlug } from "@/lib/catalog";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Completar inscripción" };

// Marcador de la fase de pagos (semanas 4–5): aquí se creará la sesión de
// Stripe Checkout. Por ahora exige login y muestra el resumen de compra.
export default async function Page({ params }: PageProps<"/cursos/[slug]/comprar">) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  await requireUser(`/cursos/${slug}/comprar`);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Casi listo</h1>
        <p className="mt-2 text-slate-600">
          Estás por inscribirte a <span className="font-semibold">{course.title}</span> por{" "}
          <span className="font-semibold">{formatPrice(course)}</span>.
        </p>
        <p className="mt-4 rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
          El pago en línea se activa en la siguiente fase (Stripe). Esta página se convertirá en el checkout.
        </p>
      </div>
    </main>
  );
}
