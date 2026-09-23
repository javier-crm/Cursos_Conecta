"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/supabase/config";

export type WaitlistState = { error?: string; message?: string } | undefined;

export async function joinWaitlist(_: WaitlistState, formData: FormData): Promise<WaitlistState> {
  if (!supabaseConfigured) return { error: "Inténtalo más tarde." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Escribe un correo válido." };
  if (fullName.length < 2) return { error: "Escribe tu nombre." };

  const admin = createAdminClient();
  const { error } = await admin.from("waitlist").insert({
    course_id: String(formData.get("course_id")),
    full_name: fullName.slice(0, 120),
    email,
    phone: String(formData.get("phone") ?? "").trim().slice(0, 20) || null,
  });

  if (error && error.code !== "23505") return { error: "No pudimos registrarte. Intenta de nuevo." };
  return { message: "¡Listo! Te avisaremos en cuanto haya lugar o nueva fecha." };
}
