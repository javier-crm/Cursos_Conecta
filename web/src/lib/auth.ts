import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "student" | "instructor" | "admin";

/** Devuelve el usuario y su perfil, o redirige a /entrar. */
export async function requireUser(next = "/panel") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/entrar?next=${encodeURIComponent(next)}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role")
    .eq("id", user.id)
    .single();

  return { supabase, user, profile, role: (profile?.role ?? "student") as Role };
}

/** Exige uno de los roles indicados; si no, manda al panel del alumno. */
export async function requireRole(roles: Role[], next: string) {
  const ctx = await requireUser(next);
  if (!roles.includes(ctx.role)) redirect("/panel");
  return ctx;
}
