"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import posthog from "posthog-js";
import { createClient } from "@/lib/supabase/client";

// Set these on Vercel to turn analytics on. Absent → this whole component is a
// no-op (deploy-safe). US host default matches the PostHog project + the
// server-side client (lib/analytics/posthog.ts).
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
const CONSENT_KEY = "atelier_analytics_consent";

/** Mirror the consent choice into a cookie so server-side capture can honor it. */
function writeConsentCookie(granted: boolean) {
  if (typeof document === "undefined") return;
  document.cookie = `${CONSENT_KEY}=${granted ? "granted" : "denied"}; path=/; max-age=31536000; samesite=lax`;
}

let started = false;
function ensureInit() {
  if (started || !KEY || typeof window === "undefined") return;
  started = true;
  posthog.init(KEY, {
    api_host: HOST,
    capture_pageview: false, // captured manually per App Router navigation
    capture_pageleave: true,
    autocapture: true,
    person_profiles: "identified_only",
    // Privacy-first: record NOTHING until the visitor consents, and mask every
    // input value in session replays.
    opt_out_capturing_by_default: true,
    session_recording: { maskAllInputs: true },
  });
  if (localStorage.getItem(CONSENT_KEY) === "granted") posthog.opt_in_capturing();
}

/** Manual $pageview on each App Router navigation (Suspense-wrapped for useSearchParams). */
function PageviewTracker() {
  const pathname = usePathname();
  const search = useSearchParams();
  useEffect(() => {
    if (!KEY) return;
    ensureInit();
    posthog.capture("$pageview");
  }, [pathname, search]);
  return null;
}

export function Analytics() {
  const [consent, setConsent] = useState<"granted" | "denied" | "unset">("unset");

  useEffect(() => {
    if (!KEY) return;
    ensureInit();
    const saved = localStorage.getItem(CONSENT_KEY);
    const value = saved === "granted" || saved === "denied" ? saved : "unset";
    setConsent(value);
    // Keep the cookie in sync for returning users (migrates pre-cookie choices).
    if (value !== "unset") writeConsentCookie(value === "granted");
  }, []);

  // Stitch client events (pageviews/replay) to the same person as the
  // server-side events by identifying with the Supabase user id. Only when
  // consent is granted; reset on sign-out.
  useEffect(() => {
    if (!KEY || consent !== "granted") return;
    const supabase = createClient();
    if (!supabase) return;
    let cancelled = false;
    void supabase.auth.getUser().then(({ data }) => {
      if (!cancelled && data.user) posthog.identify(data.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") posthog.reset();
      else if (session?.user) posthog.identify(session.user.id);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [consent]);

  const choose = (granted: boolean) => {
    localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied");
    writeConsentCookie(granted);
    if (granted) posthog.opt_in_capturing();
    else posthog.opt_out_capturing();
    setConsent(granted ? "granted" : "denied");
  };

  if (!KEY) return null;

  return (
    <>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      {consent === "unset" ? (
        <div
          data-analytics-consent
          className="fixed inset-x-0 bottom-0 z-50 flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink bg-paper px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
        >
          <p className="max-w-2xl text-caption">
            We use privacy-first analytics (including masked session replay) to
            improve the app — never for ads. See our{" "}
            <a href="/privacy" className="font-bold underline">
              privacy policy
            </a>
            .
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => choose(false)}
              className="border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-yellow"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={() => choose(true)}
              className="border-2 border-ink bg-ink px-3 py-1 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue"
            >
              Accept
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
