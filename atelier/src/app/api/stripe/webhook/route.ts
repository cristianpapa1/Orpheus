import { NextResponse } from "next/server";
import { getStripe } from "@/lib/donations/stripe";
import { createServiceClient } from "@/lib/supabase/admin";
import { getPostHogClient } from "@/lib/analytics/posthog";

/**
 * Stripe webhook — the ONLY writer of donation rows (service role; the
 * donations table has no client insert policy). Signature is verified
 * before any processing.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  const payload = await request.text();
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      webhookSecret,
    );
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "no service client" }, { status: 503 });
    }

    const { error } = await supabase.from("donations").insert({
      donor_id: session.metadata?.donor_id || null,
      donor_email: session.customer_details?.email ?? null,
      amount_cents: session.amount_total ?? 0,
      currency: session.currency ?? "eur",
      kind: session.metadata?.kind === "recurring" ? "recurring" : "one_off",
      status: "succeeded",
      stripe_session_id: session.id,
      stripe_subscription_id:
        typeof session.subscription === "string" ? session.subscription : null,
      appeal_id: session.metadata?.appeal_id || null,
    });
    if (error && !error.message.includes("duplicate")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const donorId = session.metadata?.donor_id;
    // Transactional confirmation from Stripe (server-to-server, no browser
    // cookie to consult) → raw client. Not behavioral tracking.
    const ph = getPostHogClient();
    if (ph && donorId) {
      ph.capture({
        distinctId: donorId,
        event: "donation_completed",
        properties: {
          amount_cents: session.amount_total ?? 0,
          currency: session.currency ?? "eur",
          kind: session.metadata?.kind === "recurring" ? "recurring" : "one_off",
          stripe_session_id: session.id,
          has_appeal: !!(session.metadata?.appeal_id),
        },
      });
      await ph.flush();
    }
  }

  return NextResponse.json({ received: true });
}
