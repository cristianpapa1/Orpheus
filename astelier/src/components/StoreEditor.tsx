"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { slugify, type Store } from "@atelier/core/commerce/stores";
import { saveStore } from "@/app/sell/actions";

const ACCENTS = [
  { value: "red", cls: "bg-red" },
  { value: "blue", cls: "bg-blue" },
  { value: "yellow", cls: "bg-yellow" },
] as const;

const FIELD =
  "border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue";
const LABEL = "text-caption font-bold uppercase";

export function StoreEditor({ initial }: { initial: Store | null }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [accent, setAccent] = useState<string>(initial?.accent ?? "red");
  // Artistic-school personalization is deferred; keep the stored value untouched.
  const school = initial?.school ?? "bauhaus";
  const [status, setStatus] = useState<string | null>(null);
  const [savedSlug, setSavedSlug] = useState<string | null>(initial?.slug ?? null);
  const [pending, start] = useTransition();

  const preview = slug.trim() ? slugify(slug) : slugify(name) || "your-store";

  const onSave = () => {
    setStatus(null);
    start(async () => {
      const r = await saveStore({ name, slug, description, accent, school });
      if (r.ok) {
        setStatus("Saved.");
        setSavedSlug(r.slug ?? null);
        if (r.slug) setSlug(r.slug);
      } else {
        setStatus(r.error ?? "Save failed.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-5 border-2 border-ink bg-paper p-5">
      <div className="flex flex-col gap-2">
        <label className={LABEL} htmlFor="store-name">Store name</label>
        <input
          id="store-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          className={FIELD}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className={LABEL} htmlFor="store-slug">Handle</label>
        <input
          id="store-slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder={slugify(name) || "your-store"}
          className={FIELD}
        />
        <p className="text-caption uppercase opacity-70">
          astelier.aunflaneur.com/store/<strong>{preview}</strong>
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className={LABEL} htmlFor="store-desc">Description</label>
        <textarea
          id="store-desc"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={600}
          className={FIELD}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className={LABEL}>Accent</span>
        <div className="flex gap-3">
          {ACCENTS.map((a) => (
            <button
              key={a.value}
              type="button"
              aria-label={`${a.value} accent`}
              aria-pressed={accent === a.value}
              onClick={() => setAccent(a.value)}
              className={`size-10 border-2 ${a.cls} ${
                accent === a.value ? "border-ink ring-2 ring-ink ring-offset-2" : "border-ink/30"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={onSave}
          disabled={pending || !name.trim()}
          className="border-2 border-ink bg-ink px-6 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue disabled:opacity-50"
        >
          {pending ? "Saving…" : initial ? "Save store" : "Open store"}
        </button>
        {savedSlug ? (
          <Link
            href={`/store/${savedSlug}`}
            className="border-b-2 border-ink text-caption font-bold uppercase hover:text-blue"
          >
            View your store → /store/{savedSlug}
          </Link>
        ) : null}
      </div>

      {status ? (
        <p role="status" className="border-2 border-ink px-3 py-2 text-caption font-bold uppercase">
          {status}
        </p>
      ) : null}
    </div>
  );
}
