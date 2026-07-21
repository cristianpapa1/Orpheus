import "server-only";
import { cookies } from "next/headers";
import { PostHog } from "posthog-node";

// Shared singleton for server-side analytics. flushAt=1 / flushInterval=0 so
// every capture() is sent before the short-lived Next.js action/route exits.
let _client: PostHog | null = null;

/**
 * Raw client (key-gated only) — NO consent check. Use ONLY for server-to-server
 * contexts with no browser cookie to consult, and only for transactional events
 * (e.g. the Stripe webhook confirming a donation). Prefer getPostHog() elsewhere.
 */
export function getPostHogClient(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  if (!_client) {
    _client = new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
      enableExceptionAutocapture: true,
    });
  }
  return _client;
}

const CONSENT_COOKIE = "atelier_analytics_consent";

/**
 * Consent-aware server client: returns the PostHog client ONLY when the visitor
 * has accepted analytics (the same consent the client banner sets). Returns null
 * if analytics is unconfigured OR consent wasn't granted (opt-out by default) OR
 * there's no request cookie context. Use this for all user-facing captures.
 */
export async function getPostHog(): Promise<PostHog | null> {
  const client = getPostHogClient();
  if (!client) return null;
  try {
    const store = await cookies();
    if (store.get(CONSENT_COOKIE)?.value !== "granted") return null;
  } catch {
    return null; // no request context → don't capture
  }
  return client;
}
