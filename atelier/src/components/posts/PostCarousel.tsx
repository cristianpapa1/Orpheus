"use client";

import { useRef, useState } from "react";
import type { PostImage } from "@atelier/core/posts/types";

/**
 * Swipe/click carousel for multi-image posts. Bauhaus controls: square ink
 * arrows (shown on hover / keyboard focus), square dots, a counter. Touch: drag
 * left/right to change image. Each image renders from its own variants (srcset)
 * over a blur-up background. Single image → render it plain.
 */
export function PostCarousel({
  images,
  alt = "",
  eager = false,
  className,
}: {
  images: PostImage[];
  alt?: string;
  eager?: boolean;
  className?: string;
}) {
  const [i, setI] = useState(0);
  const img = images[i];
  if (!img) return null;

  const src = img.variants.at(-1)?.url;
  const srcSet =
    img.variants.length > 1
      ? img.variants.map((v) => `${v.url} ${v.width}w`).join(", ")
      : undefined;
  const go = (d: number) => setI((x) => (x + d + images.length) % images.length);

  // Touch swipe: horizontal drag past a threshold flips the image; vertical
  // scroll is left to the page (touch-action: pan-y).
  const startX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = startX.current;
    startX.current = null;
    if (start == null || images.length < 2) return;
    const dx = (e.changedTouches[0]?.clientX ?? start) - start;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  };

  return (
    <div
      className="group relative"
      style={{ touchAction: "pan-y" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        srcSet={srcSet}
        sizes="(max-width: 768px) 100vw, 60vw"
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        className={`w-full ${className ?? ""}`}
        style={
          img.blur_data
            ? { backgroundImage: `url(${img.blur_data})`, backgroundSize: "cover" }
            : undefined
        }
      />
      {images.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center border-2 border-ink bg-paper text-body font-bold opacity-0 transition-opacity pointer-events-none hover:bg-ink hover:text-paper group-hover:opacity-100 group-hover:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center border-2 border-ink bg-paper text-body font-bold opacity-0 transition-opacity pointer-events-none hover:bg-ink hover:text-paper group-hover:opacity-100 group-hover:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto"
          >
            ›
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {images.map((_, d) => (
              <button
                key={d}
                type="button"
                aria-label={`Go to image ${d + 1}`}
                onClick={() => setI(d)}
                className={`size-2 border border-ink ${d === i ? "bg-ink" : "bg-paper"}`}
              />
            ))}
          </div>
          <span className="absolute right-2 top-2 border-2 border-ink bg-paper px-2 py-0.5 text-caption font-bold tabular-nums">
            {i + 1}/{images.length}
          </span>
        </>
      ) : null}
    </div>
  );
}
