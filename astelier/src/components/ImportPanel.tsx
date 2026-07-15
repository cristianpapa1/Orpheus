"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  scrapeCatalog,
  importCatalog,
  type ImportCandidate,
} from "@/app/sell/import/actions";

export function ImportPanel() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [candidates, setCandidates] = useState<ImportCandidate[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const toggle = (i: number) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const doScrape = () => {
    setMsg(null);
    setCandidates(null);
    start(async () => {
      const r = await scrapeCatalog(url);
      if (!r.ok) {
        setMsg(r.error ?? "Couldn't read that page.");
        return;
      }
      const list = r.candidates ?? [];
      setCandidates(list);
      setSelected(new Set(list.map((_, i) => i)));
      if (!list.length) setMsg("No products found on that page.");
    });
  };

  const doImport = () => {
    if (!candidates) return;
    const chosen = candidates.filter((_, i) => selected.has(i));
    setMsg(null);
    start(async () => {
      const r = await importCatalog(chosen);
      if (r.ok) {
        setMsg(`Imported ${r.imported} product${r.imported === 1 ? "" : "s"} as drafts — set them Live when ready.`);
        setCandidates(null);
        router.refresh();
      } else {
        setMsg(r.error ?? "Import failed.");
      }
    });
  };

  return (
    <section className="mt-10 border-2 border-ink">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between border-b-2 border-ink px-4 py-3 text-left text-h2 font-bold uppercase hover:bg-yellow"
      >
        Import from your shop
        <span aria-hidden>{open ? "▾" : "▸"}</span>
      </button>

      {open ? (
        <div className="flex flex-col gap-3 p-4">
          <p className="text-body">
            Already sell somewhere? Paste your shop or collection URL and we&apos;ll
            pull in the products for you to review — imported as drafts.
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-shop.com/collections/all"
              className="min-w-0 flex-1 border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue"
            />
            <button
              type="button"
              onClick={doScrape}
              disabled={pending || !url.trim()}
              className="border-2 border-ink bg-ink px-4 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue disabled:opacity-50"
            >
              {pending && !candidates ? "Reading…" : "Scan"}
            </button>
          </div>

          {msg ? (
            <p role="status" className="border-2 border-ink px-3 py-2 text-caption font-bold uppercase">
              {msg}
            </p>
          ) : null}

          {candidates && candidates.length ? (
            <>
              <p className="text-caption font-bold uppercase opacity-70">
                {selected.size} of {candidates.length} selected
              </p>
              <ul className="flex max-h-96 flex-col gap-2 overflow-auto">
                {candidates.map((c, i) => (
                  <li key={i}>
                    <label className="flex cursor-pointer items-center gap-3 border-2 border-ink px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(i)}
                        onChange={() => toggle(i)}
                        className="accent-ink"
                      />
                      {c.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.image_url} alt="" className="size-12 border-2 border-ink object-cover" />
                      ) : (
                        <span className="grid size-12 place-items-center border-2 border-ink text-caption uppercase opacity-40">—</span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body font-bold">{c.title}</span>
                        <span className="text-caption uppercase opacity-70">
                          {c.price ? `$${c.price.toFixed(2)}` : "no price"}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={doImport}
                disabled={pending || selected.size === 0}
                className="self-start border-2 border-ink bg-ink px-6 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue disabled:opacity-50"
              >
                {pending ? "Importing…" : `Import ${selected.size} as drafts`}
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
