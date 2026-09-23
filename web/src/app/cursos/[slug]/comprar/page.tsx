import { notFound } from "next/navigation";
import { formatPrice, getCourseBySlug } from "@/lib/catalog";
import { requireUser } from "@/lib/auth";
import { CheckoutForm } from "./CheckoutForm";

export const metadata = { title: "Completar inscripción" };

export default async function Page({ params }: PageProps<"/cursos/[slug]/comprar">) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  await requireUser(`/cursos/${slug}/comprar`);

  const replay = course.permanent_replay_price_cents
    ? formatPrice({ price_cents: course.permanent_replay_price_cents, currency: course.currency })
    : null;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Completar inscripción</h1>
        <p className="mt-2 text-slate-600">
          <span className="font-semibold">{course.title}</span>
          {" · "}
          <span className="font-semibold">{formatPrice(course)}</span>
        </p>
        <CheckoutForm slug={course.slug} priceLabel={formatPrice(course)} permanentReplayLabel={replay} />
      </div>
    </main>
  );
}
