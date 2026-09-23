import Link from "next/link";
import {
  firstSessionDate,
  formatPrice,
  formatSessionDate,
  seatsLeft,
  type CatalogCourse,
} from "@/lib/catalog";

export function CourseCard({ course }: { course: CatalogCourse }) {
  const start = firstSessionDate(course);
  const left = seatsLeft(course);
  const soldOut = left === 0;

  return (
    <Link
      href={`/cursos/${course.slug}`}
      className="group flex flex-col rounded-xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
          {course.instructor.topic ?? "Curso en vivo"}
        </span>
        {soldOut ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">Agotado</span>
        ) : (
          left != null && left <= 10 && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
              Últimos {left} lugares
            </span>
          )
        )}
      </div>
      <h3 className="mt-3 text-lg font-semibold text-slate-900 group-hover:text-indigo-700">{course.title}</h3>
      {course.subtitle && <p className="mt-1 text-sm text-slate-600">{course.subtitle}</p>}
      <div className="mt-4 space-y-1 text-sm text-slate-500">
        <p>Imparte: {course.instructor.display_name}</p>
        {start && <p className="capitalize">{formatSessionDate.format(start)}</p>}
        <p>{course.sessions.length} sesiones en vivo · grabación por {course.replay_hours} h</p>
      </div>
      <p className="mt-4 flex-1" />
      <p className="text-xl font-bold text-slate-900">{formatPrice(course)}</p>
    </Link>
  );
}
