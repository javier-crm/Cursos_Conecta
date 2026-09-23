import Link from "next/link";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Paquetes (admin)" };

const money = (cents: number) => `$${(cents / 100).toLocaleString("es-MX")}`;

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function createBundle(formData: FormData) {
  "use server";
  await requireRole(["admin"], "/admin/paquetes");
  const admin = createAdminClient();

  const title = String(formData.get("title") ?? "").trim();
  const price = Number(formData.get("price"));
  const courseIds = formData.getAll("course_ids").map(String);
  if (title.length < 3 || !(price > 0) || courseIds.length < 2) return;

  const { data: bundle } = await admin
    .from("bundles")
    .insert({
      slug: slugify(title),
      title,
      description: String(formData.get("description") ?? "").trim() || null,
      price_cents: Math.round(price * 100),
    })
    .select("id")
    .single();
  if (bundle) {
    await admin.from("bundle_courses").insert(courseIds.map((course_id) => ({ bundle_id: bundle.id, course_id })));
  }
  revalidatePath("/admin/paquetes");
}

async function toggleBundle(formData: FormData) {
  "use server";
  await requireRole(["admin"], "/admin/paquetes");
  const admin = createAdminClient();
  await admin
    .from("bundles")
    .update({ status: String(formData.get("status")) })
    .eq("id", String(formData.get("id")));
  revalidateTag("public-bundles", "max");
  revalidatePath("/admin/paquetes");
  revalidatePath("/paquetes");
}

export default async function Page() {
  await requireRole(["admin"], "/admin/paquetes");
  const admin = createAdminClient();

  const [{ data: bundles }, { data: courses }] = await Promise.all([
    admin
      .from("bundles")
      .select("id, title, price_cents, status, bundle_courses(course:courses(title))")
      .order("created_at", { ascending: false }),
    admin.from("courses").select("id, title, price_cents").neq("status", "archived").order("title"),
  ]);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <Link href="/admin" className="text-sm text-indigo-600 hover:underline">← Administración</Link>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Paquetes</h1>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Crear paquete</h2>
        <form action={createBundle} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Nombre</span>
              <input name="title" required placeholder="Los 3 cursos de septiembre" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Precio del paquete (MXN)</span>
              <input name="price" type="number" min={1} required className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Descripción (opcional)</span>
            <input name="description" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />
          </label>
          <fieldset>
            <legend className="mb-1 text-sm font-medium text-slate-700">Cursos incluidos (elige 2 o más)</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(courses ?? []).map((course) => (
                <label key={course.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <input type="checkbox" name="course_ids" value={course.id} />
                  {course.title} <span className="ml-auto text-slate-400">{money(course.price_cents)}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <button className="rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700">
            Crear paquete (queda como borrador)
          </button>
        </form>
      </section>

      <section className="mt-8 space-y-3">
        {(bundles ?? []).map((bundle) => (
          <div key={bundle.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5">
            <div>
              <p className="font-semibold text-slate-900">
                {bundle.title}
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{bundle.status}</span>
              </p>
              <p className="text-sm text-slate-500">
                {money(bundle.price_cents)} ·{" "}
                {bundle.bundle_courses
                  .map((bc) => {
                    const course = Array.isArray(bc.course) ? bc.course[0] : bc.course;
                    return course?.title;
                  })
                  .filter(Boolean)
                  .join(" + ")}
              </p>
            </div>
            <form action={toggleBundle}>
              <input type="hidden" name="id" value={bundle.id} />
              <input type="hidden" name="status" value={bundle.status === "published" ? "draft" : "published"} />
              <button className="rounded-lg border border-indigo-200 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50">
                {bundle.status === "published" ? "Ocultar" : "Publicar"}
              </button>
            </form>
          </div>
        ))}
      </section>
    </main>
  );
}
