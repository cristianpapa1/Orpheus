/**
 * Pure media geometry — fit math and variant planning. Zero DOM; shared by
 * the web app's canvas pipeline and (later) the Expo app's native pipeline.
 */

export const MAX_DISPLAY_EDGE = 1600;
export const VARIANT_WIDTHS = [480, 960, 1600] as const;
export const BLUR_WIDTH = 24;
export const MAX_ORIGINAL_BYTES = 50 * 1024 * 1024; // Supabase default object limit

/** Longest edge capped at `maxEdge`, aspect preserved. */
export function fitWithin(
  width: number,
  height: number,
  maxEdge: number = MAX_DISPLAY_EDGE,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge || longest === 0) return { width, height };
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** Display widths to generate for an original — never upscales. */
export function variantWidthsFor(originalWidth: number): number[] {
  if (originalWidth <= 0) return [];
  const fitting = VARIANT_WIDTHS.filter((w) => w < originalWidth);
  return fitting.length > 0 ? fitting : [originalWidth];
}
