"use client";

import { useRef, useState, useTransition } from "react";
import { createPost } from "@/app/(shell)/post/actions";
import { downscaleImage, MAX_DISPLAY_EDGE } from "@/lib/posts/image";
import { CATEGORY_LABEL, POST_CATEGORIES } from "@/lib/posts/types";

interface Prepared {
  blob: Blob;
  width: number;
  height: number;
  previewUrl: string;
  name: string;
}

export function PostComposer({ canPublish }: { canPublish: boolean }) {
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    try {
      const { blob, width, height } = await downscaleImage(file);
      if (prepared) URL.revokeObjectURL(prepared.previewUrl);
      setPrepared({
        blob,
        width,
        height,
        previewUrl: URL.createObjectURL(blob),
        name: file.name,
      });
    } catch {
      setError("Couldn't read that image. Try another file.");
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!prepared) {
      setError("Choose an image.");
      return;
    }
    const form = formRef.current!;
    const data = new FormData(form);
    data.set(
      "image",
      new File([prepared.blob], "display.webp", { type: "image/webp" }),
    );
    data.set("width", String(prepared.width));
    data.set("height", String(prepared.height));

    startTransition(async () => {
      const result = await createPost(data);
      // On success createPost redirects; reaching here means failure.
      if (result && !result.ok) setError(result.error ?? "Publish failed.");
    });
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-4">
      {!canPublish ? (
        <p
          data-setup-notice
          className="border-2 border-ink bg-yellow px-3 py-2 text-caption font-bold uppercase"
        >
          Preview mode — publishing needs Supabase configured
        </p>
      ) : null}

      <label htmlFor="image" className="text-caption font-bold uppercase">
        Work (image)
      </label>
      <input
        id="image"
        name="image_file"
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="border-2 border-ink bg-paper px-3 py-2 text-body file:mr-3 file:border-2 file:border-ink file:bg-ink file:px-3 file:py-1 file:text-caption file:font-bold file:uppercase file:text-paper"
      />
      <p className="text-caption uppercase opacity-70">
        Display copy is optimized to {MAX_DISPLAY_EDGE}px — full-resolution
        originals arrive in phase 3
      </p>

      {prepared ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={prepared.previewUrl}
          alt={`Preview of ${prepared.name}`}
          width={prepared.width}
          height={prepared.height}
          className="max-h-96 w-auto border-2 border-ink object-contain"
        />
      ) : null}

      <label htmlFor="caption" className="text-caption font-bold uppercase">
        Caption
      </label>
      <textarea
        id="caption"
        name="caption"
        rows={3}
        maxLength={1000}
        placeholder="Say something about the work…"
        className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue"
      />

      <label htmlFor="category" className="text-caption font-bold uppercase">
        Category
      </label>
      <select
        id="category"
        name="category"
        required
        defaultValue=""
        className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue"
      >
        <option value="" disabled>
          Pick one…
        </option>
        {POST_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {CATEGORY_LABEL[c]}
          </option>
        ))}
      </select>

      {error ? (
        <p role="alert" className="border-2 border-red px-3 py-2 text-caption font-bold uppercase text-red">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canPublish || pending}
        className="self-start border-2 border-ink bg-ink px-6 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue disabled:opacity-50"
      >
        {pending ? "Publishing…" : "Publish"}
      </button>
    </form>
  );
}
