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
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-indigo-600">
            Clases en vivo · Cupo limitado
          </p>
          <h1 className="mx-auto max-w-2xl text-4xl font-bold text-slate-900 sm:text-5xl">
            Aprende en vivo con expertos, sin rodeos
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
            Cursos prácticos de dos sesiones en vivo. Si no puedes asistir, la grabación queda disponible 72 horas.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/cursos" className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700">
              Ver próximos cursos
            </Link>
            <Link href="/registro" className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50">
              Crear cuenta
            </Link>
          </div>
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
              <li key={step.title} className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
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
              <div key={ins.slug} className="rounded-xl border border-slate-200 bg-white p-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-xl font-bold text-white">
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
                <figure key={review.id} className="rounded-xl border border-slate-200 bg-white p-6">
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
              <details key={faq.q} className="group rounded-xl border border-slate-200 bg-slate-50 p-5">
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
        <div className="rounded-2xl bg-indigo-600 px-6 py-12 text-center text-white">
          <h2 className="text-2xl font-bold sm:text-3xl">Tu próximo curso empieza pronto</h2>
          <p className="mx-auto mt-2 max-w-md text-indigo-100">
            Los lugares son limitados y se agotan. Aparta el tuyo hoy.
          </p>
          <Link
            href="/cursos"
            className="mt-6 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            Ver cursos disponibles
          </Link>
        </div>
      </section>
    </main>
  );
}
