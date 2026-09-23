import Link from "next/link";
import { getPublicInstructors } from "@/lib/instructors";

export const metadata = {
  title: "Conferencistas",
  description: "Conoce a los expertos que imparten nuestros cursos en vivo.",
};

export default async function Page() {
  const instructors = await getPublicInstructors();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Nuestros conferencistas</h1>
      <p className="mt-1 max-w-xl text-slate-600">
        Profesionales en activo que enseñan lo que practican todos los días.
      </p>
      {!instructors.length ? (
        <p className="mt-6 rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-600">
          Muy pronto presentaremos al equipo.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {instructors.map((instructor) => (
            <Link
              key={instructor.id}
              href={`/instructores/${instructor.slug}`}
              className="group rounded-xl border border-slate-200 bg-white p-6 text-center transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
            >
              {instructor.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={instructor.photo_url}
                  alt={instructor.display_name}
                  className="mx-auto h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-indigo-600 text-2xl font-bold text-white">
                  {instructor.display_name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                </div>
              )}
              <h2 className="mt-4 font-semibold text-slate-900 group-hover:text-indigo-700">{instructor.display_name}</h2>
              <p className="text-sm text-indigo-600">{instructor.headline ?? instructor.topic}</p>
              {instructor.bio && <p className="mt-2 line-clamp-3 text-sm text-slate-600">{instructor.bio}</p>}
              <p className="mt-3 text-sm font-medium text-slate-500">
                {instructor.courses.length === 1 ? "1 curso disponible" : `${instructor.courses.length} cursos disponibles`}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
