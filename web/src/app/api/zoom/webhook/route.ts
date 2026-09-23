import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Webhook de Zoom (Feature → Event Subscriptions de la app S2S):
// evento "recording.completed". Guarda la liga de reproducción y calcula
// su expiración con base en replay_hours del curso.
export async function POST(request: NextRequest) {
  const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;
  if (!secret) return NextResponse.json({ error: "config" }, { status: 500 });

  const raw = await request.text();
  const timestamp = request.headers.get("x-zm-request-timestamp") ?? "";
  const expected = `v0=${crypto
    .createHmac("sha256", secret)
    .update(`v0:${timestamp}:${raw}`)
    .digest("hex")}`;
  if (request.headers.get("x-zm-signature") !== expected) {
    return NextResponse.json({ error: "firma" }, { status: 401 });
  }

  const body = JSON.parse(raw);

  // Validación inicial del endpoint que exige Zoom
  if (body.event === "endpoint.url_validation") {
    const encryptedToken = crypto
      .createHmac("sha256", secret)
      .update(body.payload.plainToken)
      .digest("hex");
    return NextResponse.json({ plainToken: body.payload.plainToken, encryptedToken });
  }

  if (body.event === "recording.completed") {
    const meeting = body.payload?.object;
    const meetingId = String(meeting?.id ?? "");
    const shareUrl: string | undefined = meeting?.share_url;

    if (meetingId && shareUrl) {
      const admin = createAdminClient();
      const { data: access } = await admin
        .from("live_session_access")
        .select("session_id, session:live_sessions(course:courses(replay_hours))")
        .eq("zoom_meeting_id", meetingId)
        .maybeSingle();

      if (access) {
        const sessionRel = Array.isArray(access.session) ? access.session[0] : access.session;
        const courseRel = sessionRel && (Array.isArray(sessionRel.course) ? sessionRel.course[0] : sessionRel.course);
        const replayHours = courseRel?.replay_hours ?? 72;
        const now = new Date();
        await admin
          .from("live_session_access")
          .update({
            recording_provider: "zoom",
            recording_url: shareUrl,
            recording_ready_at: now.toISOString(),
            recording_expires_at: new Date(now.getTime() + replayHours * 3600_000).toISOString(),
          })
          .eq("session_id", access.session_id);
      }
    }
  }

  return NextResponse.json({ received: true });
}
