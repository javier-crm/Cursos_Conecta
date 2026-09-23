import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Cursos" };

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  price_cents: number;
  currency: string;
  instructor: { display_name: string } | { display_name: string }[] | null;
  live_sessions: { starts_at: string }[];
};

const dateFmt = new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeStyle: "short" });

export default async function Page() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, slug, title, subtitle, price_cents, currency, instructor:instructors(display_name), live_sessions(starts_at)")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .returns<CourseRow[]>();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-900">Próximos cursos</h1>
      {!courses?.length ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-600">
          Muy pronto anunciaremos los próximos cursos. Crea tu cuenta para enterarte primero.
        </div>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => {
            const instructor = Array.isArray(c.instructor) ? c.instructor[0] : c.instructor;
            const firstSession = c.live_sessions
              .map((s) => new Date(s.starts_at))
              .sort((a, b) => a.getTime() - b.getTime())[0];
            return (
              <li key={c.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-slate-900">{c.title}</h2>
                {c.subtitle && <p className="mt-1 text-sm text-slate-600">{c.subtitle}</p>}
                {instructor && <p className="mt-2 text-sm text-slate-500">Imparte: {instructor.display_name}</p>}
                {firstSession && <p className="mt-1 text-sm text-slate-500">Inicia: {dateFmt.format(firstSession)}</p>}
                <p className="mt-4 text-xl font-bold text-slate-900">
                  ${(c.price_cents / 100).toLocaleString("es-MX")} <span className="text-sm font-normal text-slate-500">{c.currency}</span>
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
