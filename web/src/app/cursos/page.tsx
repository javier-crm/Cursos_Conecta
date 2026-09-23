import { CourseCard } from "@/components/CourseCard";
import { getPublishedCourses } from "@/lib/catalog";

export const metadata = {
  title: "Cursos",
  description: "Próximos cursos en vivo: fechas, instructores y precios.",
};

export default async function Page() {
  const courses = await getPublishedCourses();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Próximos cursos</h1>
      <p className="mt-1 text-slate-600">Clases en vivo con cupo limitado. Aparta tu lugar.</p>
      {!courses.length ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-600">
          Muy pronto anunciaremos los próximos cursos. Crea tu cuenta para enterarte primero.
        </div>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <li key={course.id} className="contents">
              <CourseCard course={course} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
