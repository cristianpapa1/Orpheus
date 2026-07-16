"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitCreatorApplication } from "@/app/(shell)/creator/apply/actions";
import { STATEMENT_MAX } from "@/lib/creator/limits";

const FIELD =
  "w-full border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue";

/** The creator application: what you'll post + links that prove it. Shared shape
 *  with the onboarding "creator" path. On success we flip to a received state —
 *  the account is now pending review. */
export function CreatorApplyForm() {
  const router = useRouter();
  const [statement, setStatement] = useState("");
  const [links, setLinks] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await submitCreatorApplication({
        statement,
        links: links.split("\n"),
      });
      if (res.ok) {
        setDone(true);
        router.refresh();
      } else {
        setError(res.error ?? "Something went wrong.");
      }
    });
  };

  if (done) {
    return (
      <div data-application-received className="border-2 border-ink bg-yellow/30 p-5">
        <p className="text-h2 font-bold uppercase">Application received</p>
        <p className="mt-2 text-body">
          We&apos;ll review what you sent and email you when you&apos;re approved.
          Until then you can browse, follow, and join groups.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="statement" className="text-caption font-bold uppercase">
          What will you post here?
        </label>
        <p className="mb-2 mt-1 text-caption uppercase opacity-70">
          Tell us what you make and how you&apos;ll use Atelier — the more concrete, the faster the review.
        </p>
        <textarea
          id="statement"
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          rows={5}
          maxLength={STATEMENT_MAX}
          data-creator-statement
          placeholder="e.g. I'm a film photographer — I'll post darkroom prints, contact sheets, and process notes."
          className={FIELD}
        />
      </div>

      <div>
        <label htmlFor="links" className="text-caption font-bold uppercase">
          Links that prove your work
        </label>
        <p className="mb-2 mt-1 text-caption uppercase opacity-70">
          One per line — portfolio, Instagram, published pieces, a label or gallery page. At least one.
        </p>
        <textarea
          id="links"
          value={links}
          onChange={(e) => setLinks(e.target.value)}
          rows={4}
          data-creator-links
          placeholder={"https://your-portfolio.com\nhttps://instagram.com/you"}
          className={`${FIELD} font-mono text-caption`}
        />
      </div>

      {error ? (
        <p role="alert" className="border-2 border-red px-3 py-2 text-caption font-bold uppercase text-red">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        data-creator-apply-submit
        className="self-start border-2 border-ink bg-ink px-6 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send for review →"}
      </button>
    </div>
  );
}
