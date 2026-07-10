/**
 * Per-post display personalization — bold options, not one toggle.
 * A post's owner controls how their work sits in the facade: the frame
 * treatment, how many columns the window spans, and the crop aspect.
 * This typed config is the ONLY personalization channel; rendering maps
 * it to classes through the pure functions below (no ad-hoc CSS per post).
 */

import { isSchool, type School } from "@/lib/design/schools";

export const FRAMES = ["inset", "full-bleed", "plate"] as const;
export type PostFrame = (typeof FRAMES)[number];

export const SPANS = ["standard", "wide", "full"] as const;
export type PostSpan = (typeof SPANS)[number];

export const ASPECTS = ["natural", "square", "landscape", "portrait"] as const;
export type PostAspect = (typeof ASPECTS)[number];

export interface PostDisplay {
  frame: PostFrame;
  span: PostSpan;
  aspect: PostAspect;
  /** Track A: pin an artistic school on this post's frame (optional). */
  school?: School;
}

export const DEFAULT_DISPLAY: PostDisplay = {
  frame: "inset",
  span: "standard",
  aspect: "natural",
};

export const FRAME_LABEL: Record<PostFrame, string> = {
  inset: "Inset — bordered, on paper",
  "full-bleed": "Full bleed — edge to edge",
  plate: "Plate — mounted on ink",
};

export const SPAN_LABEL: Record<PostSpan, string> = {
  standard: "Standard window",
  wide: "Wide window",
  full: "Full row",
};

export const ASPECT_LABEL: Record<PostAspect, string> = {
  natural: "Natural",
  square: "Square crop",
  landscape: "Landscape crop (3:2)",
  portrait: "Portrait crop (3:4)",
};

/** Validate anything (DB jsonb, request body) into a safe display config. */
export function parseDisplay(value: unknown): PostDisplay {
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return DEFAULT_DISPLAY;
    }
  }
  if (!value || typeof value !== "object") return DEFAULT_DISPLAY;
  const raw = value as Record<string, unknown>;
  return {
    frame: FRAMES.includes(raw.frame as PostFrame)
      ? (raw.frame as PostFrame)
      : DEFAULT_DISPLAY.frame,
    span: SPANS.includes(raw.span as PostSpan)
      ? (raw.span as PostSpan)
      : DEFAULT_DISPLAY.span,
    aspect: ASPECTS.includes(raw.aspect as PostAspect)
      ? (raw.aspect as PostAspect)
      : DEFAULT_DISPLAY.aspect,
    ...(isSchool(raw.school) ? { school: raw.school } : {}),
  };
}

/** Grid columns the post's window occupies. */
export function spanClass(span: PostSpan): string {
  switch (span) {
    case "standard":
      return "col-span-12 md:col-span-5";
    case "wide":
      return "col-span-12 md:col-span-7";
    case "full":
      return "col-span-12";
  }
}

/** Crop preset applied to the image element. */
export function aspectClass(aspect: PostAspect): string {
  switch (aspect) {
    case "natural":
      return "";
    case "square":
      return "aspect-square object-cover";
    case "landscape":
      return "aspect-[3/2] object-cover";
    case "portrait":
      return "aspect-[3/4] object-cover";
  }
}

/** Frame treatment: wrapper + image classes. */
export function frameClasses(frame: PostFrame): {
  wrapper: string;
  image: string;
} {
  switch (frame) {
    case "inset":
      return { wrapper: "block p-4 pb-0", image: "border-2 border-ink" };
    case "full-bleed":
      return { wrapper: "block", image: "" };
    case "plate":
      return { wrapper: "block bg-ink p-6", image: "" };
  }
}
