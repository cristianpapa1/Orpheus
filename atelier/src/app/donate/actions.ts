"use server";

import { redirect } from "next/navigation";
import { getStripe } from "@/lib/donations/stripe";
import { parseEurosToCents } from "@/lib/donations/types";
import { createServerSupabase } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Create a Stripe Checkout session for a one-off or recurring donation.
 * The donation row is written ONLY by the webhook on completion — this
 * action never touches the donations table.
 */
export async function createDonationCheckout(formData: FormData) {
  const stripe = getStripe();
  if (!stripe) redirect("/donate?error=unconfigured");

  const preset = String(formData.get("preset") ?? "");
  const custom = String(formData.get("custom") ?? "");
  const cents = preset ? Number(preset) : parseEurosToCents(custom);
  if (!cents || cents < 100) redirect("/donate?error=amount");

  const recurring = formData.get("kind") === "recurring";
  const appealId = String(formData.get("appeal") ?? "") || null;

  // Attach the signed-in user (if any) for the ledger + Stripe receipt email.
  const supabase = await createServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  const session = await stripe.checkout.sessions.create({
    mode: recurring ? "subscription" : "payment",
    customer_email: user?.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: cents,
          ...(recurring ? { recurring: { interval: "month" as const } } : {}),
          product_data: {
            name: recurring
              ? "Atelier monthly donation"
              : "Atelier one-off donation",
            description:
              "Voluntary support — keeps Atelier ad-free and independent.",
          },
        },
      },
    ],
    metadata: {
      donor_id: user?.id ?? "",
      appeal_id: appealId ?? "",
      kind: recurring ? "recurring" : "one_off",
    },
    success_url: `${SITE_URL}/donate?thanks=1`,
    cancel_url: `${SITE_URL}/donate`,
  });

  if (!session.url) redirect("/donate?error=stripe");
  redirect(session.url);
}
