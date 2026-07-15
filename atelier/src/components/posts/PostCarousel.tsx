"use client";

import { useState } from "react";
import type { PostImage } from "@atelier/core/posts/types";

/**
 * Swipe/click carousel for multi-image posts. Bauhaus controls: square ink
 * arrows, square dots, a counter. Each image renders from its own variants
 * (srcset) over a blur-up background. Single image → render it plain.
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

  return (
    <div className="relative">
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
            className="absolute left-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center border-2 border-ink bg-paper text-body font-bold hover:bg-ink hover:text-paper"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center border-2 border-ink bg-paper text-body font-bold hover:bg-ink hover:text-paper"
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
