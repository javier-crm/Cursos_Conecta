"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type CrudState = { error?: string; message?: string } | undefined;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/* ---------- Instructores ---------- */

export async function saveInstructor(_: CrudState, formData: FormData): Promise<CrudState> {
  await requireRole(["admin"], "/admin/instructores");
  const admin = createAdminClient();

  const id = String(formData.get("id") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();
  if (displayName.length < 3) return { error: "Escribe el nombre del instructor." };

  const commission = Number(formData.get("commission_pct"));
  if (!(commission >= 0 && commission <= 100)) return { error: "La comisión debe estar entre 0 y 100." };

  const row = {
    display_name: displayName,
    topic: String(formData.get("topic") ?? "").trim() || null,
    bio: String(formData.get("bio") ?? "").trim() || null,
    commission_pct: commission,
    active: formData.get("active") === "on",
  };

  const { error } = id
    ? await admin.from("instructors").update(row).eq("id", id)
    : await admin.from("instructors").insert({ ...row, slug: slugify(displayName) });
  if (error) return { error: error.message.includes("duplicate") ? "Ya existe un instructor con ese nombre." : "No se pudo guardar." };

  revalidatePath("/admin/instructores");
  return { message: "Instructor guardado." };
}

/* ---------- Cursos ---------- */

export async function saveCourse(_: CrudState, formData: FormData): Promise<CrudState> {
  await requireRole(["admin"], "/admin/cursos");
  const admin = createAdminClient();

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (title.length < 3) return { error: "Escribe el título del curso." };

  const priceMxn = Number(formData.get("price"));
  if (!(priceMxn > 0)) return { error: "El precio debe ser mayor a cero." };

  const capacityRaw = String(formData.get("capacity") ?? "").trim();
  const replayPriceRaw = String(formData.get("permanent_replay_price") ?? "").trim();
  const salesCloseRaw = String(formData.get("sales_close_at") ?? "").trim();

  const row = {
    instructor_id: String(formData.get("instructor_id")),
    title,
    subtitle: String(formData.get("subtitle") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    price_cents: Math.round(priceMxn * 100),
    capacity: capacityRaw ? Number(capacityRaw) : null,
    replay_hours: Number(formData.get("replay_hours") || 72),
    permanent_replay_price_cents: replayPriceRaw ? Math.round(Number(replayPriceRaw) * 100) : null,
    // Monterrey es UTC-6 todo el año
    sales_close_at: salesCloseRaw ? new Date(`${salesCloseRaw}:00-06:00`).toISOString() : null,
    video_url: String(formData.get("video_url") ?? "").trim() || null,
    community_url: String(formData.get("community_url") ?? "").trim() || null,
    status: String(formData.get("status") ?? "draft"),
  };

  let courseId = id;
  if (id) {
    const { error } = await admin.from("courses").update(row).eq("id", id);
    if (error) return { error: "No se pudo guardar el curso." };
  } else {
    const { data, error } = await admin
      .from("courses")
      .insert({ ...row, slug: slugify(title) })
      .select("id")
      .single();
    if (error || !data) {
      return { error: error?.message.includes("duplicate") ? "Ya existe un curso con ese título." : "No se pudo crear el curso." };
    }
    courseId = data.id;
  }

  // Sesiones: hasta 4 filas (posición, título, fecha/hora local MTY, duración)
  for (let position = 1; position <= 4; position++) {
    const when = String(formData.get(`session_${position}_at`) ?? "").trim();
    const sessionTitle = String(formData.get(`session_${position}_title`) ?? "").trim() || null;
    const duration = Number(formData.get(`session_${position}_duration`) || 60);

    if (!when) {
      // Fila vacía: si existía, se elimina
      await admin.from("live_sessions").delete().eq("course_id", courseId).eq("position", position);
      continue;
    }
    const startsAt = new Date(`${when}:00-06:00`).toISOString();
    await admin
      .from("live_sessions")
      .upsert(
        { course_id: courseId, position, title: sessionTitle, starts_at: startsAt, duration_minutes: duration },
        { onConflict: "course_id,position" },
      );
  }

  revalidatePath("/admin");
  revalidatePath("/cursos");
  if (!id) redirect(`/admin/cursos/${courseId}`);
  return { message: "Curso guardado." };
}

/* ---------- Lista de espera ---------- */

export async function notifyWaitlist(_: CrudState, formData: FormData): Promise<CrudState> {
  await requireRole(["admin"], "/admin");
  const admin = createAdminClient();
  const courseId = String(formData.get("course_id"));

  const [{ data: course }, { data: waiting }] = await Promise.all([
    admin.from("courses").select("title, slug").eq("id", courseId).maybeSingle(),
    admin.from("waitlist").select("id, email").eq("course_id", courseId).is("notified_at", null),
  ]);
  if (!course) return { error: "Curso no encontrado." };
  if (!waiting?.length) return { error: "No hay nadie pendiente de avisar en la lista de espera." };

  const { waitlistSpotEmail, sendEmail } = await import("@/lib/email");
  const html = waitlistSpotEmail(course.title, course.slug);
  for (const person of waiting) {
    await sendEmail(person.email, `¡Hay lugar! ${course.title}`, html);
    await admin.from("waitlist").update({ notified_at: new Date().toISOString() }).eq("id", person.id);
  }

  revalidatePath("/admin");
  return { message: `Avisamos a ${waiting.length} personas de la lista de espera.` };
}

/* ---------- Cupones ---------- */

export async function saveCoupon(_: CrudState, formData: FormData): Promise<CrudState> {
  await requireRole(["admin"], "/admin/cupones");
  const admin = createAdminClient();

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (code.length < 3) return { error: "El código debe tener al menos 3 caracteres." };

  const type = String(formData.get("type"));
  const value = Number(formData.get("value"));
  if (!(value > 0)) return { error: "El valor del descuento debe ser mayor a cero." };
  if (type === "percent" && value > 100) return { error: "El porcentaje no puede ser mayor a 100." };

  const maxRaw = String(formData.get("max_redemptions") ?? "").trim();
  const expiresRaw = String(formData.get("expires_at") ?? "").trim();
  const courseId = String(formData.get("course_id") ?? "");

  const { error } = await admin.from("coupons").insert({
    code,
    percent_off: type === "percent" ? value : null,
    amount_off_cents: type === "amount" ? Math.round(value * 100) : null,
    course_id: courseId || null,
    max_redemptions: maxRaw ? Number(maxRaw) : null,
    expires_at: expiresRaw ? new Date(`${expiresRaw}:00-06:00`).toISOString() : null,
    featured: formData.get("featured") === "on",
  });
  if (error) return { error: error.message.includes("duplicate") ? "Ya existe un cupón con ese código." : "No se pudo crear el cupón." };

  revalidatePath("/admin/cupones");
  return { message: `Cupón ${code} creado.` };
}

export async function toggleCoupon(formData: FormData) {
  await requireRole(["admin"], "/admin/cupones");
  const admin = createAdminClient();
  await admin
    .from("coupons")
    .update({ active: formData.get("active") === "true" })
    .eq("id", String(formData.get("id")));
  revalidatePath("/admin/cupones");
}
