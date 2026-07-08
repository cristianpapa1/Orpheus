import { fitWithin } from "./image";

/**
 * Phase 3 media pipeline (client side).
 * The ORIGINAL file is never touched — it uploads byte-for-byte to
 * {user}/originals/…. Display variants are generated from a decoded copy
 * and upload to {user}/display/…. Swapping to an image CDN later replaces
 * variant generation, not this contract.
 */

export const VARIANT_WIDTHS = [480, 960, 1600] as const;
export const BLUR_WIDTH = 24;
export const MAX_ORIGINAL_BYTES = 50 * 1024 * 1024; // Supabase default object limit

/** Which display widths to generate — never upscale beyond the original. */
export function variantWidthsFor(originalWidth: number): number[] {
  const widths = VARIANT_WIDTHS.filter((w) => w < originalWidth);
  if (widths.length === 0) return originalWidth > 0 ? [originalWidth] : [];
  return widths;
}

export interface PreparedVariant {
  width: number;
  height: number;
  blob: Blob;
}

export interface PreparedUpload {
  /** The untouched original file — uploaded as-is. */
  original: File;
  originalWidth: number;
  originalHeight: number;
  variants: PreparedVariant[];
  /** Tiny blur-up placeholder as a data URI. */
  blur: string;
}

async function encodeAt(
  bitmap: ImageBitmap,
  targetWidth: number,
): Promise<PreparedVariant> {
  const { width, height } = fitWithin(bitmap.width, bitmap.height, targetWidth);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.85),
  );
  if (!blob) throw new Error("Variant encoding failed");
  return { width, height, blob };
}

/** Decode once, derive display variants + blur. The original is untouched. */
export async function prepareUpload(file: File): Promise<PreparedUpload> {
  if (file.size > MAX_ORIGINAL_BYTES) {
    throw new Error("Original exceeds the 50 MB storage limit.");
  }
  const bitmap = await createImageBitmap(file);

  const variants: PreparedVariant[] = [];
  for (const targetWidth of variantWidthsFor(bitmap.width)) {
    variants.push(await encodeAt(bitmap, targetWidth));
  }

  // Blur placeholder: tiny canvas, heavy compression, inline data URI.
  const { width: bw, height: bh } = fitWithin(
    bitmap.width,
    bitmap.height,
    BLUR_WIDTH,
  );
  const blurCanvas = document.createElement("canvas");
  blurCanvas.width = bw;
  blurCanvas.height = bh;
  const blurCtx = blurCanvas.getContext("2d");
  if (!blurCtx) throw new Error("Canvas 2D context unavailable");
  blurCtx.drawImage(bitmap, 0, 0, bw, bh);
  const blur = blurCanvas.toDataURL("image/jpeg", 0.4);

  const result: PreparedUpload = {
    original: file,
    originalWidth: bitmap.width,
    originalHeight: bitmap.height,
    variants,
    blur,
  };
  bitmap.close();
  return result;
}
