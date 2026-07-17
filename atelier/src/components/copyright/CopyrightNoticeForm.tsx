"use client";

import { useState, useTransition } from "react";
import {
  submitCopyrightNotice,
  type CopyrightNoticeInput,
} from "@/app/(shell)/copyright/actions";

const INPUT =
  "w-full border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue";
const LABEL = "text-caption font-bold uppercase";

export function CopyrightNoticeForm() {
  const [kind, setKind] = useState<"notice" | "counter">("notice");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const isCounter = kind === "counter";

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const input: CopyrightNoticeInput = {
      kind,
      work: String(fd.get("work") ?? ""),
      location: String(fd.get("location") ?? ""),
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      address: String(fd.get("address") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      statement: String(fd.get("statement") ?? ""),
      goodFaith: fd.get("goodFaith") === "on",
      accuracy: fd.get("accuracy") === "on",
      website: String(fd.get("website") ?? ""),
    };
    start(async () => {
      const r = await submitCopyrightNotice(input);
      if (r.ok) setDone(true);
      else setError(r.error ?? "Couldn't send — please try again.");
    });
  };

  if (done) {
    return (
      <p role="status" className="border-2 border-ink bg-yellow px-4 py-3 text-body font-bold">
        Received. We&apos;ve forwarded your {isCounter ? "counter-notice" : "notice"} to
        our copyright agent and sent a confirmation to your email.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filing type">
        {(["notice", "counter"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            aria-pressed={kind === k}
            className={`border-2 border-ink px-4 py-2 text-caption font-bold uppercase ${
              kind === k ? "bg-ink text-paper" : "hover:bg-yellow"
            }`}
          >
            {k === "notice" ? "Report infringement" : "Counter-notice"}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-1">
        <span className={LABEL}>
          {isCounter ? "Work that was removed *" : "Your copyrighted work *"}
        </span>
        <textarea name="work" rows={2} required maxLength={4000} className={INPUT}
          placeholder={isCounter ? "Describe the work that was taken down." : "Describe or link the work you own."} />
      </label>

      <label className="flex flex-col gap-1">
        <span className={LABEL}>
          {isCounter ? "Where it appeared on Atelier (URL) *" : "Infringing material — URL(s) on Atelier *"}
        </span>
        <textarea name="location" rows={2} required maxLength={4000} className={INPUT}
          placeholder="https://atelier.aunflaneur.com/p/…" />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className={LABEL}>Full legal name *</span>
          <input name="name" required maxLength={200} className={INPUT} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={LABEL}>Email *</span>
          <input name="email" type="email" required maxLength={200} className={INPUT} />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className={LABEL}>Postal address *</span>
        <input name="address" required maxLength={1000} className={INPUT} />
      </label>

      <label className="flex flex-col gap-1">
        <span className={LABEL}>Phone (optional)</span>
        <input name="phone" maxLength={100} className={INPUT} />
      </label>

      <label className="flex flex-col gap-1">
        <span className={LABEL}>Anything else</span>
        <textarea name="statement" rows={3} maxLength={4000} className={INPUT} />
      </label>

      {/* Honeypot — hidden from humans; bots fill it and get silently dropped. */}
      <div aria-hidden className="hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="flex items-start gap-2 text-body">
        <input type="checkbox" name="goodFaith" required className="mt-1 accent-ink" />
        <span>
          {isCounter
            ? "I have a good-faith belief the material was removed by mistake or misidentification, and I consent to the jurisdiction of the appropriate courts."
            : "I have a good-faith belief that the use of the material is not authorised by the rights holder, its agent, or the law."}
        </span>
      </label>

      <label className="flex items-start gap-2 text-body">
        <input type="checkbox" name="accuracy" required className="mt-1 accent-ink" />
        <span>
          Under penalty of perjury, the information in this notice is accurate and
          I am {isCounter ? "the person whose work was removed, or authorised to act on their behalf." : "the copyright owner, or authorised to act on the owner's behalf."}
        </span>
      </label>

      <p className="text-caption uppercase opacity-70">
        Typing your name above and submitting counts as your electronic signature.
      </p>

      {error ? (
        <p role="alert" className="border-2 border-red bg-paper px-3 py-2 text-caption font-bold uppercase text-red">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start border-2 border-ink bg-ink px-6 py-2 text-caption font-bold uppercase text-paper hover:border-blue hover:bg-blue disabled:opacity-50"
      >
        {pending ? "Sending…" : isCounter ? "File counter-notice" : "File notice"}
      </button>
    </form>
  );
}
