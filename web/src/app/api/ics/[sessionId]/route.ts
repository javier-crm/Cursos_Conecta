import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildIcs } from "@/lib/calendar";

// Descarga .ics de una sesión (solo alumnos inscritos, vía RLS).
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/ics/[sessionId]">) {
  const { sessionId } = await ctx.params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("live_sessions")
    .select("id, position, title, starts_at, duration_minutes, course:courses(title)")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return NextResponse.json({ error: "no encontrada" }, { status: 404 });

  const course = Array.isArray(session.course) ? session.course[0] : session.course;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const title = `${course?.title ?? "Curso"} — ${session.title ?? `Sesión ${session.position}`}`;

  const ics = buildIcs({
    uid: `${session.id}@cursos`,
    title,
    startsAt: new Date(session.starts_at),
    durationMinutes: session.duration_minutes,
    description: "Entra a la clase desde tu panel.",
    url: `${site}/panel`,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="clase.ics"`,
    },
  });
}
