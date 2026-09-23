import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { fulfillOrder, markOrderFailed, refundOrder } from "@/lib/checkout";

// Webhook de Stripe. Configurar en el dashboard apuntando a /api/stripe/webhook
// con los eventos: checkout.session.completed, checkout.session.async_payment_succeeded,
// checkout.session.async_payment_failed, checkout.session.expired, charge.refunded.
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return NextResponse.json({ error: "config" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "firma inválida" }, { status: 400 });
  }

  const orderIdOf = (s: Stripe.Checkout.Session) => s.metadata?.order_id;

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const orderId = orderIdOf(session);
      if (!orderId) break;
      // Con tarjeta el pago ya está confirmado; con OXXO queda pendiente
      // hasta el evento async_payment_succeeded.
      if (session.payment_status === "paid") {
        await fulfillOrder(orderId, paymentIntentId(session), methodOf(session));
      }
      break;
    }
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      const orderId = orderIdOf(session);
      if (orderId) await fulfillOrder(orderId, paymentIntentId(session), "oxxo");
      break;
    }
    case "checkout.session.async_payment_failed": {
      const orderId = orderIdOf(event.data.object);
      if (orderId) await markOrderFailed(orderId, "failed");
      break;
    }
    case "checkout.session.expired": {
      const orderId = orderIdOf(event.data.object);
      if (orderId) await markOrderFailed(orderId, "expired");
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object;
      const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
      if (pi) await refundOrder(pi);
      break;
    }
  }

  return NextResponse.json({ received: true });
}

function paymentIntentId(session: Stripe.Checkout.Session): string | null {
  return typeof session.payment_intent === "string"
    ? session.payment_intent
    : (session.payment_intent?.id ?? null);
}

function methodOf(session: Stripe.Checkout.Session): string {
  return session.payment_method_types?.[0] ?? "card";
}
