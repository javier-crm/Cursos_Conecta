"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; message?: string } | undefined;

/** Solo rutas internas, para evitar redirecciones abiertas. */
function safeNext(value: FormDataEntryValue | null, fallback = "/panel") {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : fallback;
}

async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

const ERRORS: Record<string, string> = {
  invalid_credentials: "Correo o contraseña incorrectos.",
  email_not_confirmed: "Confirma tu correo antes de entrar. Revisa tu bandeja de entrada.",
  user_already_exists: "Ya existe una cuenta con ese correo.",
  weak_password: "La contraseña es muy débil. Usa al menos 8 caracteres.",
  over_email_send_rate_limit: "Demasiados intentos. Espera unos minutos.",
};

function translate(error: { code?: string; message: string }) {
  return (error.code && ERRORS[error.code]) || "Ocurrió un error. Intenta de nuevo.";
}

export async function signIn(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });
  if (error) return { error: translate(error) };
  redirect(safeNext(formData.get("next")));
}

export async function signUp(_: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password"));
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  if (!formData.get("terms")) return { error: "Debes aceptar los términos y el aviso de privacidad." };

  const supabase = await createClient();
  const next = safeNext(formData.get("next"));
  const { data, error } = await supabase.auth.signUp({
    email: String(formData.get("email")),
    password,
    options: {
      data: {
        full_name: String(formData.get("full_name") ?? "").trim(),
        phone: String(formData.get("phone") ?? "").trim(),
      },
      emailRedirectTo: `${await siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { error: translate(error) };

  // Con confirmación de correo activada no hay sesión todavía.
  if (!data.session) {
    return { message: "¡Listo! Te enviamos un correo para confirmar tu cuenta." };
  }
  redirect(next);
}

export async function signInWithGoogle(formData: FormData) {
  const supabase = await createClient();
  const next = safeNext(formData.get("next"));
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await siteUrl()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect("/entrar?error=google");
  redirect(data.url);
}

export async function requestPasswordReset(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(String(formData.get("email")), {
    redirectTo: `${await siteUrl()}/auth/callback?next=/nueva-contrasena`,
  });
  // Mismo mensaje exista o no la cuenta, para no revelar correos registrados.
  return { message: "Si el correo está registrado, recibirás un enlace para cambiar tu contraseña." };
}

export async function updatePassword(_: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password"));
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  if (password !== String(formData.get("confirm"))) return { error: "Las contraseñas no coinciden." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: translate(error) };
  redirect("/panel");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
