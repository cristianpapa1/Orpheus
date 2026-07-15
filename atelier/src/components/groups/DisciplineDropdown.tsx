"use client";

import { useState } from "react";
import { DISCIPLINE_OPTIONS } from "@atelier/core/taxonomy/disciplines";
import { POST_CATEGORIES, CATEGORY_LABEL } from "@atelier/core/posts/types";

/**
 * Dropdown multi-select for group disciplines (replaces the always-open
 * checkbox box). Opens like the Act menu; selected values are emitted as hidden
 * `interests` inputs so the existing createGroup form action is unchanged.
 */
export function DisciplineDropdown({ disabled = false }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (v: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });

  return (
    <div data-discipline-picker className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between border-2 border-ink px-3 py-2 text-caption font-bold uppercase hover:bg-yellow disabled:opacity-50"
      >
        <span>{selected.size ? `${selected.size} selected` : "Pick disciplines"}</span>
        <span aria-hidden>{open ? "▾" : "▸"}</span>
      </button>

      {/* selected values ride the form submission */}
      {[...selected].map((v) => (
        <input key={v} type="hidden" name="interests" value={v} />
      ))}

      {open ? (
        <div className="absolute left-0 z-20 mt-1 max-h-72 w-full overflow-auto border-2 border-ink bg-paper p-3">
          {POST_CATEGORIES.map((c) => (
            <fieldset key={c} className="mb-3 flex flex-col gap-1">
              <legend className="text-caption font-bold uppercase opacity-70">
                {CATEGORY_LABEL[c]}
              </legend>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {DISCIPLINE_OPTIONS.filter((o) => o.category === c).map((o) => (
                  <label key={o.value} className="flex items-center gap-1 text-caption">
                    <input
                      type="checkbox"
                      checked={selected.has(o.value)}
                      onChange={() => toggle(o.value)}
                      className="size-3 accent-ink"
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      ) : null}
    </div>
  );
}
