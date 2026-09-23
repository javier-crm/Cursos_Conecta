import Link from "next/link";
import { CourseCard } from "@/components/CourseCard";
import { Stars } from "@/components/Stars";
import { getPublishedCourses } from "@/lib/catalog";
import { getTopReviews } from "@/lib/reviews";
import { FAQS as ALL_FAQS } from "@/lib/faqs";

const STEPS = [
  { title: "Elige tu curso", text: "Dos clases en vivo de una hora, con cupo limitado y fecha definida." },
  { title: "Paga en línea", text: "Tarjeta, OXXO o meses sin intereses. Factura disponible si la necesitas." },
  { title: "Aprende en vivo", text: "Entra a la clase desde tu panel y pregunta directo al instructor." },
  { title: "Repasa la grabación", text: "Disponible 72 horas después de cada clase por si no pudiste asistir." },
];

const FAQS = ALL_FAQS.slice(1, 6);

export default async function Home() {
  const [allCourses, testimonials] = await Promise.all([getPublishedCourses(), getTopReviews(3)]);
  const courses = allCourses.slice(0, 3);
  const instructors = [...new Map(courses.map((c) => [c.instructor.slug, c.instructor])).values()];

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        {/* Fondos decorativos */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 h-96 w-[52rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-200/60 via-violet-200/50 to-fuchsia-200/40 blur-3xl" />
          <div className="absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-indigo-100/60 blur-3xl" />
          <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-violet-100/60 blur-3xl" />
        </div>
        <div className="relative mx-auto w-full max-w-6xl px-4 py-24 text-center">
          <p className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-indigo-200/70 bg-white/70 px-4 py-1.5 text-sm font-semibold text-indigo-700 shadow-sm backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            Clases en vivo · Cupo limitado
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
            Aprende en vivo con expertos, <span className="text-gradient">sin rodeos</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
            Cursos prácticos de dos sesiones en vivo. Si no puedes asistir, la grabación queda disponible 72 horas.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/cursos" className="btn-primary px-7 py-3.5">
              Ver próximos cursos
            </Link>
            <Link
              href="/registro"
              className="rounded-xl border border-slate-300 bg-white/80 px-7 py-3.5 font-semibold text-slate-700 backdrop-blur transition hover:border-slate-400 hover:bg-white"
            >
              Crear cuenta
            </Link>
          </div>
          <p className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <span>✓ Grabación por 72 h</span>
            <span>✓ Constancia incluida</span>
            <span>✓ Tarjeta, OXXO o MSI</span>
            <span>✓ Factura CFDI</span>
          </p>
        </div>
      </section>

      {/* Próximos cursos */}
      {courses.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 py-16">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Próximos cursos</h2>
            <Link href="/cursos" className="text-sm font-medium text-indigo-600 hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}

      {/* Cómo funciona */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-16">
          <h2 className="text-center text-2xl font-bold text-slate-900">¿Cómo funciona?</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="card p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-bold text-white shadow-md shadow-indigo-600/25">
                  {i + 1}
                </span>
                <h3 className="mt-3 font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Instructores */}
      {instructors.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 py-16">
          <h2 className="text-center text-2xl font-bold text-slate-900">Aprende de quien ya lo hace</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {instructors.map((ins) => (
              <div key={ins.slug} className="card card-hover p-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-xl font-bold text-white shadow-lg shadow-indigo-600/30">
                  {ins.display_name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                </div>
                <p className="mt-3 font-semibold text-slate-900">{ins.display_name}</p>
                {ins.topic && <p className="text-sm text-indigo-600">{ins.topic}</p>}
                {ins.bio && <p className="mt-2 text-sm text-slate-600">{ins.bio}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Testimonios */}
      {testimonials.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 py-16">
          <h2 className="text-center text-2xl font-bold text-slate-900">Lo que dicen nuestros alumnos</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {testimonials.map((review) => {
              const course = Array.isArray(review.course) ? review.course[0] : review.course;
              return (
                <figure key={review.id} className="card p-6">
                  <Stars rating={review.rating} />
                  <blockquote className="mt-3 text-sm leading-relaxed text-slate-600">“{review.comment}”</blockquote>
                  <figcaption className="mt-3 text-sm">
                    <span className="font-medium text-slate-900">{review.author_name}</span>
                    {course && <span className="text-slate-500"> · {course.title}</span>}
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-3xl px-4 py-16">
          <h2 className="text-center text-2xl font-bold text-slate-900">Preguntas frecuentes</h2>
          <p className="mt-2 text-center text-sm">
            <Link href="/preguntas-frecuentes" className="text-indigo-600 hover:underline">Ver todas las preguntas →</Link>
          </p>
          <div className="mt-8 space-y-3">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group card p-5">
                <summary className="cursor-pointer list-none font-semibold text-slate-900 marker:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {faq.q}
                    <span aria-hidden className="text-slate-400 transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-6 py-14 text-center text-white shadow-2xl shadow-indigo-600/30">
          <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-40 w-96 -translate-x-1/2 rounded-full bg-white/15 blur-3xl" />
          <h2 className="relative text-2xl font-bold sm:text-3xl">Tu próximo curso empieza pronto</h2>
          <p className="relative mx-auto mt-2 max-w-md text-indigo-100">
            Los lugares son limitados y se agotan. Aparta el tuyo hoy.
          </p>
          <Link
            href="/cursos"
            className="relative mt-7 inline-block rounded-xl bg-white px-7 py-3.5 font-bold text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            Ver cursos disponibles
          </Link>
        </div>
      </section>
    </main>
  );
}
