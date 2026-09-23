import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { normalizePhoneMx, sendCourseNotice, whatsappConfigured } from "@/lib/whatsapp";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export type AnnouncementResult = { emails: number; whatsapps: number; students: number };

/** Envía un aviso (correo + WhatsApp) a todos los inscritos activos de un curso. */
export async function broadcastToCourse(input: {
  courseId: string;
  senderId: string;
  body: string;
  linkUrl?: string | null;
}): Promise<AnnouncementResult> {
  const admin = createAdminClient();

  const { data: course } = await admin
    .from("courses")
    .select("title")
    .eq("id", input.courseId)
    .maybeSingle();
  if (!course) return { emails: 0, whatsapps: 0, students: 0 };

  const { data: enrollments } = await admin
    .from("enrollments")
    .select("user_id")
    .eq("course_id", input.courseId)
    .eq("status", "active");

  const message = input.linkUrl ? `${input.body}\n${input.linkUrl}` : input.body;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0f172a">
      <h2 style="font-size:18px">Aviso de tu curso: ${course.title}</h2>
      <p style="white-space:pre-line">${input.body}</p>
      ${input.linkUrl ? `<p><a href="${input.linkUrl}" style="color:#4f46e5;font-weight:bold">${input.linkUrl}</a></p>` : ""}
      <p style="margin-top:24px;font-size:12px;color:#94a3b8"><a href="${SITE}/panel" style="color:#6366f1">Mi panel</a></p>
    </div>`;

  let emails = 0;
  let whatsapps = 0;
  const students = enrollments?.length ?? 0;

  for (const enrollment of enrollments ?? []) {
    const [{ data: authUser }, { data: profile }] = await Promise.all([
      admin.auth.admin.getUserById(enrollment.user_id),
      admin.from("profiles").select("full_name, phone").eq("id", enrollment.user_id).maybeSingle(),
    ]);

    const email = authUser?.user?.email;
    if (email) {
      await sendEmail(email, `Aviso: ${course.title}`, html);
      emails++;
    }

    if (whatsappConfigured) {
      const phone = normalizePhoneMx(profile?.phone);
      if (phone) {
        const ok = await sendCourseNotice(
          phone,
          profile?.full_name?.split(" ")[0] ?? "alumno",
          course.title,
          message,
        );
        if (ok) whatsapps++;
      }
    }
  }

  await admin.from("announcements").insert({
    course_id: input.courseId,
    sender_id: input.senderId,
    body: input.body,
    link_url: input.linkUrl || null,
    sent_email: emails,
    sent_wa: whatsapps,
  });

  return { emails, whatsapps, students };
}
