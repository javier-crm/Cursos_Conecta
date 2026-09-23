import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { purchaseConfirmationEmail, sendEmail } from "@/lib/email";

const OXXO_CUTOFF_DAYS = 3; // OXXO tarda hasta 3 días en confirmarse

export type CheckoutCourse = {
  id: string;
  slug: string;
  title: string;
  price_cents: number;
  currency: string;
  capacity: number | null;
  sales_close_at: string | null;
  permanent_replay_price_cents: number | null;
  first_session_at: string | null;
};

export async function loadCheckoutCourse(slug: string): Promise<CheckoutCourse | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("courses")
    .select(
      "id, slug, title, price_cents, currency, capacity, sales_close_at, permanent_replay_price_cents, live_sessions(starts_at)",
    )
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return null;

  const sessions = (data.live_sessions as { starts_at: string }[]) ?? [];
  const first = sessions.map((s) => s.starts_at).sort()[0] ?? null;
  const { live_sessions, ...course } = data;
  void live_sessions;
  return { ...course, first_session_at: first };
}

export function oxxoAvailable(course: CheckoutCourse): boolean {
  if (!course.first_session_at) return true;
  const cutoff = new Date(course.first_session_at);
  cutoff.setDate(cutoff.getDate() - OXXO_CUTOFF_DAYS);
  return new Date() < cutoff;
}

export type CouponResult =
  | { ok: true; couponId: string; discountCents: number }
  | { ok: false; reason: string };

export async function validateCoupon(
  code: string,
  courseId: string,
  baseCents: number,
  userId?: string,
): Promise<CouponResult> {
  const admin = createAdminClient();
  const { data: coupon } = await admin
    .from("coupons")
    .select("id, percent_off, amount_off_cents, course_id, max_redemptions, redeemed_count, expires_at, active, referrer_user_id")
    .ilike("code", code.trim())
    .maybeSingle();

  if (!coupon || !coupon.active) return { ok: false, reason: "Cupón no válido." };
  if (coupon.referrer_user_id && userId && coupon.referrer_user_id === userId)
    return { ok: false, reason: "Tu código de referido es para tus amigos, no aplica en tus propias compras." };
  if (coupon.course_id && coupon.course_id !== courseId)
    return { ok: false, reason: "Este cupón no aplica a este curso." };
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
    return { ok: false, reason: "Este cupón ya expiró." };
  if (coupon.max_redemptions != null && coupon.redeemed_count >= coupon.max_redemptions)
    return { ok: false, reason: "Este cupón ya se agotó." };

  const discountCents = coupon.percent_off
    ? Math.round((baseCents * Number(coupon.percent_off)) / 100)
    : Math.min(coupon.amount_off_cents ?? 0, baseCents);
  return { ok: true, couponId: coupon.id, discountCents };
}

type StartCheckoutInput = {
  course: CheckoutCourse;
  userId: string;
  userEmail: string;
  couponCode?: string;
  permanentReplay: boolean;
  siteUrl: string;
};

export type StartCheckoutResult = { url: string } | { error: string };

export async function startCheckout(input: StartCheckoutInput): Promise<StartCheckoutResult> {
  const { course, userId, userEmail, permanentReplay, siteUrl } = input;
  const admin = createAdminClient();

  // Reglas de venta
  if (course.sales_close_at && new Date(course.sales_close_at) < new Date())
    return { error: "Las ventas de este curso ya cerraron." };

  const { data: existing } = await admin
    .from("enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", course.id)
    .eq("status", "active")
    .maybeSingle();
  if (existing) return { error: "Ya estás inscrito en este curso. Revisa tu panel." };

  if (course.capacity != null) {
    const { data: taken } = await admin.rpc("seats_taken", { p_course_id: course.id });
    if (typeof taken === "number" && taken >= course.capacity)
      return { error: "El cupo de este curso ya se agotó." };
  }

  // Total: curso + acceso permanente opcional − cupón
  let amountCents = course.price_cents;
  const replayCents =
    permanentReplay && course.permanent_replay_price_cents ? course.permanent_replay_price_cents : 0;
  amountCents += replayCents;

  let couponId: string | null = null;
  if (input.couponCode?.trim()) {
    const result = await validateCoupon(input.couponCode, course.id, amountCents, userId);
    if (!result.ok) return { error: result.reason };
    couponId = result.couponId;
    amountCents -= result.discountCents;
  }

  // Orden pendiente
  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: userId,
      course_id: course.id,
      coupon_id: couponId,
      amount_cents: amountCents,
      currency: course.currency,
      includes_permanent_replay: replayCents > 0,
    })
    .select("id")
    .single();
  if (orderError || !order) return { error: "No pudimos iniciar tu compra. Intenta de nuevo." };

  // Sesión de Stripe Checkout
  const stripe = getStripe();
  const lineItems = [
    {
      quantity: 1,
      price_data: {
        currency: course.currency.toLowerCase(),
        unit_amount: amountCents - replayCents,
        product_data: { name: course.title, description: "Curso en vivo" },
      },
    },
  ];
  if (replayCents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: course.currency.toLowerCase(),
        unit_amount: replayCents,
        product_data: { name: "Acceso permanente a las grabaciones", description: course.title },
      },
    });
  }

  const paymentMethods: ("card" | "oxxo")[] = oxxoAvailable(course) ? ["card", "oxxo"] : ["card"];

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: userEmail,
    payment_method_types: paymentMethods,
    payment_method_options: {
      card: { installments: { enabled: true } }, // meses sin intereses (cuenta MX)
      oxxo: { expires_after_days: OXXO_CUTOFF_DAYS },
    },
    line_items: lineItems,
    metadata: { order_id: order.id, course_id: course.id, user_id: userId },
    success_url: `${siteUrl}/pago/exito?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/cursos/${course.slug}?pago=cancelado`,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 h
  });

  await admin
    .from("orders")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", order.id);

  if (!session.url) return { error: "No pudimos crear la sesión de pago." };
  return { url: session.url };
}

/** Marca la orden como pagada y crea/activa las inscripciones. Idempotente. */
export async function fulfillOrder(orderId: string, paymentIntentId: string | null, paymentMethod: string | null) {
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, course_id, bundle_id, coupon_id, status, includes_permanent_replay")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.status === "paid") return;

  await admin
    .from("orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      stripe_payment_intent_id: paymentIntentId,
      payment_method: paymentMethod,
    })
    .eq("id", order.id);

  // Cursos a inscribir: uno, o todos los del paquete
  let courseIds: string[] = order.course_id ? [order.course_id] : [];
  if (order.bundle_id) {
    const { data: items } = await admin
      .from("bundle_courses")
      .select("course_id")
      .eq("bundle_id", order.bundle_id);
    courseIds = (items ?? []).map((i) => i.course_id);
  }

  for (const courseId of courseIds) {
    await admin.from("enrollments").upsert(
      {
        user_id: order.user_id,
        course_id: courseId,
        order_id: order.id,
        status: "active",
        permanent_replay: order.includes_permanent_replay,
      },
      { onConflict: "user_id,course_id" },
    );
  }

  if (order.coupon_id) {
    await admin.rpc("increment_coupon_redemption", { p_coupon_id: order.coupon_id });
  }

  // Correo de confirmación con las fechas de todas las sesiones
  const [{ data: courses }, { data: authUser }, bundleTitle] = await Promise.all([
    admin
      .from("courses")
      .select("title, community_url, live_sessions(position, title, starts_at)")
      .in("id", courseIds),
    admin.auth.admin.getUserById(order.user_id),
    order.bundle_id
      ? admin.from("bundles").select("title").eq("id", order.bundle_id).maybeSingle().then((r) => r.data?.title)
      : Promise.resolve(null),
  ]);
  const email = authUser?.user?.email;
  if (courses?.length && email) {
    const sessions = courses
      .flatMap((c) =>
        (c.live_sessions ?? []).map((s) => ({ ...s, title: `${c.title} — ${s.title ?? `Sesión ${s.position}`}` })),
      )
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    const title = bundleTitle ?? courses[0].title;
    const communityUrl = courses.find((c) => c.community_url)?.community_url ?? null;
    await sendEmail(email, `¡Tu lugar está confirmado! ${title}`, purchaseConfirmationEmail(title, sessions, communityUrl));
  }
}

/** Checkout de un paquete de cursos. */
export async function startBundleCheckout(input: {
  bundleSlug: string;
  userId: string;
  userEmail: string;
  siteUrl: string;
}): Promise<StartCheckoutResult> {
  const admin = createAdminClient();
  const { data: bundle } = await admin
    .from("bundles")
    .select("id, slug, title, price_cents, currency")
    .eq("status", "published")
    .eq("slug", input.bundleSlug)
    .maybeSingle();
  if (!bundle) return { error: "Este paquete ya no está disponible." };

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: input.userId,
      bundle_id: bundle.id,
      amount_cents: bundle.price_cents,
      currency: bundle.currency,
    })
    .select("id")
    .single();
  if (orderError || !order) return { error: "No pudimos iniciar tu compra. Intenta de nuevo." };

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.userEmail,
    payment_method_types: ["card", "oxxo"],
    payment_method_options: {
      card: { installments: { enabled: true } },
      oxxo: { expires_after_days: OXXO_CUTOFF_DAYS },
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: bundle.currency.toLowerCase(),
          unit_amount: bundle.price_cents,
          product_data: { name: bundle.title, description: "Paquete de cursos en vivo" },
        },
      },
    ],
    metadata: { order_id: order.id, bundle_id: bundle.id, user_id: input.userId },
    success_url: `${input.siteUrl}/pago/exito?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.siteUrl}/paquetes?pago=cancelado`,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  });

  await admin.from("orders").update({ stripe_checkout_session_id: session.id }).eq("id", order.id);
  if (!session.url) return { error: "No pudimos crear la sesión de pago." };
  return { url: session.url };
}

export async function markOrderFailed(orderId: string, status: "failed" | "expired") {
  const admin = createAdminClient();
  await admin.from("orders").update({ status }).eq("id", orderId).neq("status", "paid");
}

export async function refundOrder(paymentIntentId: string) {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, course_id")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();
  if (!order) return;

  await admin
    .from("orders")
    .update({ status: "refunded", refunded_at: new Date().toISOString() })
    .eq("id", order.id);
  await admin
    .from("enrollments")
    .update({ status: "revoked" })
    .eq("user_id", order.user_id)
    .eq("course_id", order.course_id);
}
