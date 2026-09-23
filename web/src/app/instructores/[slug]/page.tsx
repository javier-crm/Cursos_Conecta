import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicInstructor } from "@/lib/instructors";

export async function generateMetadata({ params }: PageProps<"/instructores/[slug]">) {
  const { slug } = await params;
  const instructor = await getPublicInstructor(slug);
  if (!instructor) return { title: "Conferencista" };
  return {
    title: instructor.display_name,
    description: instructor.headline ?? instructor.bio?.slice(0, 160),
    openGraph: instructor.photo_url ? { images: [instructor.photo_url] } : undefined,
  };
}

const money = (cents: number, currency: string) => `$${(cents / 100).toLocaleString("es-MX")} ${currency}`;

export default async function Page({ params }: PageProps<"/instructores/[slug]">) {
  const { slug } = await params;
  const instructor = await getPublicInstructor(slug);
  if (!instructor) notFound();

  const credentials = (instructor.credentials ?? "")
    .split("\n")
    .map((line) => line.trim().replace(/^[-•·]\s*/, ""))
    .filter(Boolean);

  return (
    <main className="flex-1">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-4 py-12 text-center sm:flex-row sm:text-left">
          {instructor.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={instructor.photo_url}
              alt={instructor.display_name}
              className="h-32 w-32 shrink-0 rounded-full object-cover shadow-md"
            />
          ) : (
            <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-4xl font-bold text-white">
              {instructor.display_name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">{instructor.topic}</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">{instructor.display_name}</h1>
            {instructor.headline && <p className="mt-1 text-lg text-slate-600">{instructor.headline}</p>}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-4xl gap-10 px-4 py-10 md:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          {instructor.bio && (
            <div>
              <h2 className="text-xl font-bold text-slate-900">Acerca de</h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-slate-700">{instructor.bio}</p>
            </div>
          )}

          <div>
            <h2 className="text-xl font-bold text-slate-900">Sus cursos</h2>
            {!instructor.courses.length ? (
              <p className="mt-2 text-slate-600">Próximamente anunciará nuevas fechas.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {instructor.courses.map((course) => (
                  <li key={course.slug}>
                    <Link
                      href={`/cursos/${course.slug}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-sm"
                    >
                      <span>
                        <span className="font-semibold text-slate-900">{course.title}</span>
                        {course.subtitle && <span className="block text-sm text-slate-600">{course.subtitle}</span>}
                      </span>
                      <span className="font-bold text-indigo-700">{money(course.price_cents, course.currency)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {credentials.length > 0 && (
          <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-900">Credenciales</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {credentials.map((credential) => (
                <li key={credential} className="flex gap-2">
                  <span aria-hidden className="text-indigo-600">✓</span> {credential}
                </li>
              ))}
            </ul>
          </aside>
        )}
      </section>
    </main>
  );
}
