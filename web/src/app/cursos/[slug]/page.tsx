import Link from "next/link";
import { notFound } from "next/navigation";
import { Stars } from "@/components/Stars";
import { getCourseRating } from "@/lib/reviews";
import { couponLabel, discountedCents, getFeaturedCouponFor, toEmbedUrl } from "@/lib/promos";
import { WaitlistForm } from "./WaitlistForm";
import {
  formatPrice,
  formatSessionDate,
  getCourseBySlug,
  seatsLeft,
} from "@/lib/catalog";

export async function generateMetadata({ params }: PageProps<"/cursos/[slug]">) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return { title: "Curso no encontrado" };
  return {
    title: course.title,
    description: course.subtitle ?? course.description?.slice(0, 160),
    openGraph: {
      title: course.title,
      description: course.subtitle ?? undefined,
      ...(course.cover_url ? { images: [course.cover_url] } : {}),
    },
  };
}

const INCLUDES = (replayHours: number) => [
  "Sesiones en vivo de 1 hora con espacio para preguntas",
  `Grabación disponible ${replayHours} horas después de cada sesión`,
  "Material descargable de cada sesión",
  "Constancia de participación al terminar",
  "Factura (CFDI) si la necesitas",
];

export default async function Page({ params }: PageProps<"/cursos/[slug]">) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const [rating, coupon] = await Promise.all([getCourseRating(course.id), getFeaturedCouponFor(course.id)]);
  const videoEmbed = toEmbedUrl(course.video_url);
  const left = seatsLeft(course);
  const soldOut = left === 0;
  const salesClosed =
    course.sales_close_at != null && new Date(course.sales_close_at) < new Date();
  const canBuy = !soldOut && !salesClosed;

  return (
    <main className="flex-1">
      {rating.count > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Course",
              name: course.title,
              description: course.subtitle ?? undefined,
              provider: { "@type": "Organization", name: "Cursos en Vivo" },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: rating.average.toFixed(1),
                reviewCount: rating.count,
              },
            }),
          }}
        />
      )}
      {/* Encabezado */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            {course.instructor.topic ?? "Curso en vivo"}
          </p>
          <h1 className="mt-2 max-w-3xl text-3xl font-bold text-slate-900 sm:text-4xl">{course.title}</h1>
          {course.subtitle && <p className="mt-2 max-w-2xl text-lg text-slate-600">{course.subtitle}</p>}
          <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>
              Imparte <span className="font-medium text-slate-700">{course.instructor.display_name}</span>
              {" · "}{course.sessions.length} sesiones en vivo
            </span>
            {rating.count > 0 && (
              <span className="flex items-center gap-1.5">
                <Stars rating={rating.average} />
                <span className="font-medium text-slate-700">{rating.average.toFixed(1)}</span>
                <span>({rating.count} {rating.count === 1 ? "reseña" : "reseñas"})</span>
              </span>
            )}
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1fr_360px]">
        {/* Columna principal */}
        <div className="space-y-10">
          {videoEmbed && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-black">
              <iframe
                src={videoEmbed}
                title={`Video de presentación: ${course.title}`}
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {course.description && (
            <div>
              <h2 className="text-xl font-bold text-slate-900">¿De qué trata?</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-700">{course.description}</p>
            </div>
          )}

          <div>
            <h2 className="text-xl font-bold text-slate-900">Fechas y horarios</h2>
            <ol className="mt-3 space-y-3">
              {course.sessions.map((s) => (
                <li key={s.position} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                    {s.position}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{s.title ?? `Sesión ${s.position}`}</p>
                    <p className="text-sm capitalize text-slate-600">
                      {formatSessionDate.format(new Date(s.starts_at))} · {s.duration_minutes} min (hora de Monterrey)
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-2 text-sm text-slate-500">
              ¿No puedes en vivo? La grabación queda disponible {course.replay_hours} horas después de cada sesión.
            </p>
          </div>

          {rating.count > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900">Lo que dicen los alumnos</h2>
              <ul className="mt-3 space-y-3">
                {rating.reviews.filter((r) => r.comment).slice(0, 5).map((review) => (
                  <li key={review.id} className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between gap-3">
                      <Stars rating={review.rating} />
                      <span className="text-sm text-slate-500">{review.author_name}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">“{review.comment}”</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h2 className="text-xl font-bold text-slate-900">Tu instructor</h2>
            <div className="mt-3 flex gap-4 rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">
                {course.instructor.display_name
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{course.instructor.display_name}</p>
                {course.instructor.topic && <p className="text-sm text-indigo-600">{course.instructor.topic}</p>}
                {course.instructor.bio && <p className="mt-2 text-sm leading-relaxed text-slate-600">{course.instructor.bio}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Tarjeta de compra */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {coupon && canBuy ? (
              <>
                <p className="text-3xl font-bold text-slate-900">
                  {formatPrice({ price_cents: discountedCents(coupon, course.price_cents), currency: course.currency })}
                  <span className="ml-2 align-middle text-lg font-normal text-slate-400 line-through">
                    {formatPrice(course)}
                  </span>
                </p>
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
                  🏷️ Usa el cupón <span className="font-mono">{coupon.code}</span> al pagar: {couponLabel(coupon)}
                  {coupon.expires_at && (
                    <span className="block font-normal">
                      Válido hasta el{" "}
                      {new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", timeZone: "America/Monterrey" }).format(new Date(coupon.expires_at))}
                    </span>
                  )}
                </p>
              </>
            ) : (
              <p className="text-3xl font-bold text-slate-900">{formatPrice(course)}</p>
            )}
            <p className="mt-1 text-sm text-slate-500">Pago único · tarjeta, OXXO o meses sin intereses</p>

            {left != null && !soldOut && left <= 10 && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
                Quedan {left} lugares
              </p>
            )}

            {canBuy ? (
              <Link
                href={`/cursos/${course.slug}/comprar`}
                className="mt-5 block rounded-lg bg-indigo-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-indigo-700"
              >
                Inscribirme
              </Link>
            ) : (
              <>
                <div className="mt-5 rounded-lg bg-slate-100 px-4 py-3 text-center font-semibold text-slate-500">
                  {soldOut ? "Cupo agotado" : "Ventas cerradas"}
                </div>
                <WaitlistForm courseId={course.id} />
              </>
            )}

            <ul className="mt-6 space-y-2.5 text-sm text-slate-600">
              {INCLUDES(course.replay_hours).map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden className="text-indigo-600">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}
