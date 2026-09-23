"use server";

import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const REFERRAL_PERCENT = 10; // descuento que recibe el amigo

/** Devuelve (o crea) el código de referido personal del alumno. */
export async function getMyReferralCode(): Promise<{ code: string; uses: number } | null> {
  const { user } = await requireUser("/panel");
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("coupons")
    .select("code, redeemed_count")
    .eq("referrer_user_id", user.id)
    .maybeSingle();
  if (existing) return { code: existing.code, uses: existing.redeemed_count };

  // Código corto y legible a partir del id del usuario
  const suffix = user.id.replace(/-/g, "").slice(0, 6).toUpperCase();
  const code = `AMIGO-${suffix}`;
  const { data: created, error } = await admin
    .from("coupons")
    .insert({ code, percent_off: REFERRAL_PERCENT, referrer_user_id: user.id })
    .select("code, redeemed_count")
    .single();
  if (error || !created) return null;
  return { code: created.code, uses: created.redeemed_count };
}
