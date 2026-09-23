"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase/config";
import { stripeConfigured } from "@/lib/stripe";
import { startBundleCheckout } from "@/lib/checkout";

export type BundleBuyState = { error?: string } | undefined;

export async function buyBundle(_: BundleBuyState, formData: FormData): Promise<BundleBuyState> {
  const slug = String(formData.get("slug"));
  const { user } = await requireUser("/paquetes");

  if (!supabaseConfigured || !stripeConfigured) {
    return { error: "Los pagos no están activos en este entorno." };
  }

  const result = await startBundleCheckout({
    bundleSlug: slug,
    userId: user.id,
    userEmail: user.email ?? "",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  });
  if ("error" in result) return { error: result.error };
  redirect(result.url);
}
