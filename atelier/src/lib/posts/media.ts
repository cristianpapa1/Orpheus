import {
  BLUR_WIDTH,
  MAX_ORIGINAL_BYTES,
  fitWithin,
  variantWidthsFor,
} from "@atelier/core/posts/geometry";

/**
 * Phase 3 media pipeline (client side — browser canvas/media elements).
 * Pure geometry lives in @atelier/core/posts/geometry (M0), shared with
 * the future Expo pipeline. The ORIGINAL file is never touched — it
 * uploads byte-for-byte to {user}/originals/….
 */

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

/* ── Track B: AV media prep (browser-only) ─────────────────────── */

/** Read a video/audio file's duration via a media element. */
export function readMediaDuration(
  file: File,
  kind: "video" | "audio",
): Promise<number> {
  return new Promise((resolve, reject) => {
    const el = document.createElement(kind);
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      URL.revokeObjectURL(el.src);
      resolve(el.duration);
    };
    el.onerror = () => {
      URL.revokeObjectURL(el.src);
      reject(new Error("Couldn't read that file."));
    };
    el.src = URL.createObjectURL(file);
  });
}

/** Extract a poster frame (~0.5s in) from a video file as a JPEG File. */
export function extractVideoPoster(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.onerror = () => reject(new Error("Couldn't decode the video."));
    video.onloadeddata = () => {
      video.currentTime = Math.min(0.5, video.duration / 2);
    };
    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas unavailable"));
      ctx.drawImage(video, 0, 0);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(video.src);
          if (!blob) return reject(new Error("Poster encoding failed"));
          resolve(new File([blob], "poster.jpg", { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.85,
      );
    };
    video.src = URL.createObjectURL(file);
  });
}
