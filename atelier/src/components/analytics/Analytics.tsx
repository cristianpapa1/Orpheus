"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import posthog from "posthog-js";

// Set these on Vercel to turn analytics on. Absent → this whole component is a
// no-op (deploy-safe). EU host by default (data residency, fits the app ethos).
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";
const CONSENT_KEY = "atelier_analytics_consent";

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
    setConsent(saved === "granted" || saved === "denied" ? saved : "unset");
  }, []);

  const choose = (granted: boolean) => {
    localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied");
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
          className="fixed inset-x-0 bottom-0 z-50 flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink bg-paper px-4 py-3"
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
