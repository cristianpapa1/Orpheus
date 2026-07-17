"use client";

import { useState, useTransition } from "react";
import { setRating } from "@/app/(shell)/post/interactions";

/** Editable 1–5 star rating; click the current star again to clear it. */
export function StarRating({ postId, initial }: { postId: string; initial: number }) {
  const [value, setValue] = useState(initial);
  const [pending, start] = useTransition();

  const set = (n: number) => {
    const next = n === value ? 0 : n;
    const prev = value;
    setValue(next);
    start(async () => {
      const r = await setRating(postId, next);
      if (r.ok) setValue(r.stars);
      else setValue(prev);
    });
  };

  return (
    <div
      data-star-rating={postId}
      role="group"
      aria-label="Your rating"
      className="flex items-center gap-0.5"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => set(n)}
          disabled={pending}
          aria-pressed={value >= n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className={`text-body leading-none disabled:opacity-50 ${
            value >= n ? "text-blue" : "text-ink opacity-30 hover:opacity-70"
          }`}
        >
          {value >= n ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}
