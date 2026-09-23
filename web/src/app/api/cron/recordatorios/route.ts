import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { reminderEmail, reviewInviteEmail, sendEmail } from "@/lib/email";
import { normalizePhoneMx, sendCourseNotice, whatsappConfigured } from "@/lib/whatsapp";

// Recordatorios 24 h, 1 h y 30 min antes de cada sesión (30 min incluye
// WhatsApp), más invitación a reseñar al terminar el curso.
// Se ejecuta cada 15 min desde el servicio cron. Protegido con CRON_SECRET.
const WINDOWS = [
  { kind: "24h" as const, minutes: 24 * 60, whatsapp: false },
  { kind: "1h" as const, minutes: 60, whatsapp: false },
  { kind: "30m" as const, minutes: 30, whatsapp: true },
];
const TOLERANCE_MIN = 16; // debe ser mayor al intervalo del cron

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = Date.now();
  let sent = 0;

  for (const window of WINDOWS) {
    const from = new Date(now + (window.minutes - TOLERANCE_MIN) * 60_000).toISOString();
    const to = new Date(now + window.minutes * 60_000).toISOString();

    const { data: sessions } = await admin
      .from("live_sessions")
      .select("id, position, title, starts_at, course:courses(id, title)")
      .gte("starts_at", from)
      .lte("starts_at", to);

    for (const session of sessions ?? []) {
      // ¿Ya se envió este recordatorio?
      const { data: already } = await admin
        .from("session_reminders")
        .select("session_id")
        .eq("session_id", session.id)
        .eq("kind", window.kind)
        .maybeSingle();
      if (already) continue;

      const course = Array.isArray(session.course) ? session.course[0] : session.course;
      if (!course) continue;

      const { data: enrollments } = await admin
        .from("enrollments")
        .select("user_id")
        .eq("course_id", course.id)
        .eq("status", "active");

      const label = session.title ?? `Sesión ${session.position}`;
      const emailKind = window.kind === "30m" ? "1h" : window.kind;
      const html = reminderEmail(course.title, label, new Date(session.starts_at), emailKind);

      for (const enrollment of enrollments ?? []) {
        const [{ data: authUser }, { data: profile }] = await Promise.all([
          admin.auth.admin.getUserById(enrollment.user_id),
          admin.from("profiles").select("full_name, phone").eq("id", enrollment.user_id).maybeSingle(),
        ]);
        const email = authUser?.user?.email;
        if (email) {
          const subject =
            window.kind === "30m"
              ? `¡Tu clase empieza en 30 minutos! ${course.title}`
              : `Recordatorio: ${course.title} — ${label}`;
          await sendEmail(email, subject, html);
          sent++;
        }
        if (window.whatsapp && whatsappConfigured) {
          const phone = normalizePhoneMx(profile?.phone);
          if (phone) {
            await sendCourseNotice(
              phone,
              profile?.full_name?.split(" ")[0] ?? "alumno",
              course.title,
              `Tu clase "${label}" empieza en 30 minutos. Entra desde tu panel: ${process.env.NEXT_PUBLIC_SITE_URL}/panel`,
            );
            sent++;
          }
        }
      }

      await admin.from("session_reminders").insert({ session_id: session.id, kind: window.kind });
    }
  }

  // --- Invitación a reseñar: 24 h después de la ÚLTIMA sesión del curso ---
  const { data: endedSessions } = await admin
    .from("live_sessions")
    .select("id, starts_at, duration_minutes, course:courses(id, title)")
    .gte("starts_at", new Date(now - 26 * 3600_000).toISOString())
    .lte("starts_at", new Date(now - 24 * 3600_000).toISOString());

  for (const session of endedSessions ?? []) {
    const course = Array.isArray(session.course) ? session.course[0] : session.course;
    if (!course) continue;

    // ¿Es la última sesión del curso?
    const { data: later } = await admin
      .from("live_sessions")
      .select("id")
      .eq("course_id", course.id)
      .gt("starts_at", session.starts_at)
      .limit(1);
    if (later?.length) continue;

    const { data: already } = await admin
      .from("session_reminders")
      .select("session_id")
      .eq("session_id", session.id)
      .eq("kind", "review")
      .maybeSingle();
    if (already) continue;

    const { data: enrollments } = await admin
      .from("enrollments")
      .select("user_id")
      .eq("course_id", course.id)
      .eq("status", "active");

    for (const enrollment of enrollments ?? []) {
      const { data: authUser } = await admin.auth.admin.getUserById(enrollment.user_id);
      const email = authUser?.user?.email;
      if (email) {
        await sendEmail(email, `¿Qué te pareció ${course.title}?`, reviewInviteEmail(course.title));
        sent++;
      }
    }
    await admin.from("session_reminders").insert({ session_id: session.id, kind: "review" });
  }

  return NextResponse.json({ ok: true, sent });
}
