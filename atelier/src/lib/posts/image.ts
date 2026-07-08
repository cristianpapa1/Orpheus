/**
 * Client-side image downscaling for the create-post flow.
 * Phase 2 stores one optimized display size; the full-resolution
 * originals pipeline is Phase 3 (never degrade art silently — this
 * downscale is explicit and disclosed in the composer UI).
 */

export const MAX_DISPLAY_EDGE = 1600;

/** Pure fit math — longest edge capped at `maxEdge`, aspect preserved. */
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

export interface DownscaledImage {
  blob: Blob;
  width: number;
  height: number;
}

/** Browser-only: decode, downscale on a canvas, re-encode as WebP. */
export async function downscaleImage(
  file: File,
  maxEdge: number = MAX_DISPLAY_EDGE,
): Promise<DownscaledImage> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = fitWithin(bitmap.width, bitmap.height, maxEdge);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.85),
  );
  if (!blob) throw new Error("Image encoding failed");
  return { blob, width, height };
}
