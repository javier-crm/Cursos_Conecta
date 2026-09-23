import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { reminderEmail, sendEmail } from "@/lib/email";

// Recordatorios 24 h y 1 h antes de cada sesión.
// En Vercel se ejecuta cada 15 min (ver vercel.json). Protegido con CRON_SECRET.
const WINDOWS = [
  { kind: "24h" as const, minutes: 24 * 60 },
  { kind: "1h" as const, minutes: 60 },
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
      const html = reminderEmail(course.title, label, new Date(session.starts_at), window.kind);

      for (const enrollment of enrollments ?? []) {
        const { data: authUser } = await admin.auth.admin.getUserById(enrollment.user_id);
        const email = authUser?.user?.email;
        if (email) {
          await sendEmail(email, `Recordatorio: ${course.title} — ${label}`, html);
          sent++;
        }
      }

      await admin.from("session_reminders").insert({ session_id: session.id, kind: window.kind });
    }
  }

  return NextResponse.json({ ok: true, sent });
}
