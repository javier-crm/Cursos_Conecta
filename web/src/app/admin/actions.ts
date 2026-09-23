"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMeeting, zoomConfigured } from "@/lib/zoom";

export type AdminState = { error?: string; message?: string } | undefined;

/** Crea las reuniones de Zoom de todas las sesiones de un curso que aún no tengan una. */
export async function createZoomMeetings(_: AdminState, formData: FormData): Promise<AdminState> {
  await requireRole(["admin"], "/admin");
  if (!zoomConfigured) return { error: "Faltan las credenciales de Zoom en las variables de entorno." };

  const courseId = String(formData.get("course_id"));
  const admin = createAdminClient();

  const { data: course } = await admin
    .from("courses")
    .select("id, title, live_sessions(id, position, title, starts_at, duration_minutes, live_session_access(session_id))")
    .eq("id", courseId)
    .maybeSingle();
  if (!course) return { error: "Curso no encontrado." };

  type SessionRow = {
    id: string;
    position: number;
    title: string | null;
    starts_at: string;
    duration_minutes: number;
    live_session_access: { session_id: string }[] | { session_id: string } | null;
  };

  const pending = (course.live_sessions as SessionRow[]).filter((s) => {
    const access = s.live_session_access;
    return !access || (Array.isArray(access) && access.length === 0);
  });
  if (!pending.length) return { message: "Todas las sesiones ya tienen su reunión de Zoom." };

  let created = 0;
  for (const session of pending) {
    try {
      const meeting = await createMeeting({
        topic: `${course.title} — ${session.title ?? `Sesión ${session.position}`}`,
        startsAt: new Date(session.starts_at),
        durationMinutes: session.duration_minutes,
      });
      await admin.from("live_session_access").insert({
        session_id: session.id,
        zoom_meeting_id: meeting.id,
        join_url: meeting.join_url,
      });
      created++;
    } catch (err) {
      console.error("Zoom:", err);
      return {
        error: `Se crearon ${created} reuniones y luego falló Zoom. Reintenta para completar las restantes.`,
      };
    }
  }

  revalidatePath("/admin");
  return { message: `Listo: ${created} reuniones creadas.` };
}
