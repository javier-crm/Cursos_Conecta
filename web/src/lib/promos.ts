import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/supabase/config";

export type FeaturedCoupon = {
  code: string;
  percent_off: number | null;
  amount_off_cents: number | null;
  expires_at: string | null;
  course_id: string | null;
};

/** Cupón activo marcado como destacado, global o del curso. Cacheado 60 s. */
export const getFeaturedCoupons = unstable_cache(
  async (): Promise<FeaturedCoupon[]> => {
    if (!supabaseConfigured) return [];
    const admin = createAdminClient();
    const { data } = await admin
      .from("coupons")
      .select("code, percent_off, amount_off_cents, expires_at, course_id, max_redemptions, redeemed_count")
      .eq("featured", true)
      .eq("active", true);
    const now = new Date();
    return (data ?? [])
      .filter((c) => !c.expires_at || new Date(c.expires_at) > now)
      .filter((c) => c.max_redemptions == null || c.redeemed_count < c.max_redemptions);
  },
  ["featured-coupons"],
  { revalidate: 60 },
);

export async function getFeaturedCouponFor(courseId: string): Promise<FeaturedCoupon | null> {
  const coupons = await getFeaturedCoupons();
  return coupons.find((c) => c.course_id === courseId) ?? coupons.find((c) => !c.course_id) ?? null;
}

export function couponLabel(coupon: FeaturedCoupon): string {
  return coupon.percent_off
    ? `${Number(coupon.percent_off)}% de descuento`
    : `$${((coupon.amount_off_cents ?? 0) / 100).toLocaleString("es-MX")} de descuento`;
}

export function discountedCents(coupon: FeaturedCoupon, priceCents: number): number {
  const off = coupon.percent_off
    ? Math.round((priceCents * Number(coupon.percent_off)) / 100)
    : Math.min(coupon.amount_off_cents ?? 0, priceCents);
  return priceCents - off;
}

/** Convierte una liga de YouTube/Vimeo en URL para incrustar. */
export function toEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}
