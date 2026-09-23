import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// "Entrar a la clase": verifica inscripción (vía RLS), registra asistencia
// y redirige al join_url de Zoom. El enlace nunca se muestra en el HTML.
export async function GET(request: NextRequest, ctx: RouteContext<"/clase/[sessionId]">) {
  const { sessionId } = await ctx.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(
      new URL(`/entrar?next=${encodeURIComponent(`/clase/${sessionId}`)}`, request.url),
    );
  }

  // RLS: esta fila solo es visible para inscritos, el instructor o admin.
  const { data: access } = await supabase
    .from("live_session_access")
    .select("join_url")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (!access?.join_url) {
    return NextResponse.redirect(new URL("/panel?clase=no-disponible", request.url));
  }

  const admin = createAdminClient();
  await admin
    .from("attendance")
    .upsert({ session_id: sessionId, user_id: user.id }, { onConflict: "session_id,user_id", ignoreDuplicates: true });

  return NextResponse.redirect(access.join_url);
}
