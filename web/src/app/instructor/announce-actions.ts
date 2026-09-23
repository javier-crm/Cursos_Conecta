"use server";

import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { broadcastToCourse } from "@/lib/announcements";

export type AnnounceState = { error?: string; message?: string } | undefined;

export async function sendAnnouncement(_: AnnounceState, formData: FormData): Promise<AnnounceState> {
  const { user, role } = await requireRole(["instructor", "admin"], "/instructor");

  const courseId = String(formData.get("course_id"));
  const body = String(formData.get("body") ?? "").trim();
  const linkUrl = String(formData.get("link_url") ?? "").trim();

  if (body.length < 3) return { error: "Escribe el mensaje del aviso." };
  if (linkUrl && !/^https?:\/\//.test(linkUrl)) return { error: "El link debe empezar con https://" };

  // Un instructor solo puede avisar en sus propios cursos
  if (role !== "admin") {
    const admin = createAdminClient();
    const { data: owns } = await admin
      .from("courses")
      .select("id, instructor:instructors!inner(profile_id)")
      .eq("id", courseId)
      .eq("instructors.profile_id", user.id)
      .maybeSingle();
    if (!owns) return { error: "Este curso no es tuyo." };
  }

  const result = await broadcastToCourse({ courseId, senderId: user.id, body, linkUrl: linkUrl || null });
  if (!result.students) return { error: "Este curso aún no tiene inscritos." };

  const wa = result.whatsapps ? ` y ${result.whatsapps} WhatsApp` : "";
  return { message: `Aviso enviado a ${result.students} alumnos (${result.emails} correos${wa}).` };
}
