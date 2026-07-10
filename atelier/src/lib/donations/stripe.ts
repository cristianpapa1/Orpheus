import "server-only";
import Stripe from "stripe";

/** Lazy Stripe client — null when STRIPE_SECRET_KEY isn't configured. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
