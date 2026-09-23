"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase/config";
import { stripeConfigured } from "@/lib/stripe";
import { loadCheckoutCourse, startCheckout } from "@/lib/checkout";

export type CheckoutState = { error?: string } | undefined;

export async function payAction(_: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const slug = String(formData.get("slug"));
  const { user } = await requireUser(`/cursos/${slug}/comprar`);

  if (!supabaseConfigured || !stripeConfigured) {
    return { error: "Los pagos aún no están activados en este entorno. Falta configurar Stripe y Supabase." };
  }

  const course = await loadCheckoutCourse(slug);
  if (!course) return { error: "Este curso ya no está disponible." };

  const result = await startCheckout({
    course,
    userId: user.id,
    userEmail: user.email ?? "",
    couponCode: String(formData.get("coupon") ?? ""),
    permanentReplay: formData.get("permanent_replay") === "on",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  });

  if ("error" in result) return { error: result.error };
  redirect(result.url);
}
