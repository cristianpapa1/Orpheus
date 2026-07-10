"use client";

import { useState, useTransition } from "react";
import { publishPost } from "@/app/(shell)/post/actions";
import {
  ASPECTS,
  ASPECT_LABEL,
  DEFAULT_DISPLAY,
  FRAMES,
  FRAME_LABEL,
  SPANS,
  SPAN_LABEL,
  type PostDisplay,
} from "@/lib/posts/display";
import { prepareUpload, type PreparedUpload } from "@/lib/posts/media";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_LABEL, POST_CATEGORIES } from "@/lib/posts/types";
import type { TaggableGroup } from "@/lib/groups/queries";

type Stage = "idle" | "uploading" | "recording";

interface Prepared extends PreparedUpload {
  previewUrl: string;
}

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/tiff": "tif",
  "image/gif": "gif",
};

export function PostComposer({
  canPublish,
  memberGroups = [],
}: {
  canPublish: boolean;
  memberGroups?: TaggableGroup[];
}) {
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [caption, setCaption] = useState("");
  const [altText, setAltText] = useState("");
  const [category, setCategory] = useState("");
  const [display, setDisplay] = useState<PostDisplay>(DEFAULT_DISPLAY);
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    try {
      const result = await prepareUpload(file);
      if (prepared) URL.revokeObjectURL(prepared.previewUrl);
      const largest = result.variants.at(-1);
      setPrepared({
        ...result,
        previewUrl: URL.createObjectURL(largest?.blob ?? file),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read that image.");
    }
  };

  const publish = () => {
    setError(null);
    if (!prepared) {
      setError("Choose an image.");
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setError("Preview mode — publishing is disabled.");
      return;
    }

    startTransition(async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setError("Sign in to publish.");
          return;
        }

        setStage("uploading");
        const stamp = crypto.randomUUID();

        // 1. The ORIGINAL — byte-for-byte, never re-encoded.
        const ext = EXT[prepared.original.type] ?? "bin";
        const originalPath = `${user.id}/originals/${stamp}.${ext}`;
        const { error: origErr } = await supabase.storage
          .from("media")
          .upload(originalPath, prepared.original, {
            contentType: prepared.original.type,
          });
        if (origErr) throw new Error(origErr.message);

        // 2. Display variants.
        const variants: { width: number; height: number; path: string }[] = [];
        for (const v of prepared.variants) {
          const path = `${user.id}/display/${stamp}-${v.width}.webp`;
          const { error: varErr } = await supabase.storage
            .from("media")
            .upload(path, v.blob, { contentType: "image/webp" });
          if (varErr) throw new Error(varErr.message);
          variants.push({ width: v.width, height: v.height, path });
        }

        // 3. Record the post — paths + metadata only.
        setStage("recording");
        const largest = variants.at(-1)!;
        const result = await publishPost({
          caption,
          category,
          display,
          original_path: originalPath,
          variants,
          image_path: largest.path,
          width: prepared.variants.at(-1)?.width ?? prepared.originalWidth,
          height: prepared.variants.at(-1)?.height ?? prepared.originalHeight,
          blur_data: prepared.blur,
          alt_text: altText,
          group_ids: groupIds,
        });
        // publishPost redirects on success; reaching here means failure.
        if (result && !result.ok) setError(result.error ?? "Publish failed.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setStage("idle");
      }
    });
  };

  const choice = (active: boolean) =>
    `border-2 px-3 py-1 text-caption font-bold uppercase ${
      active ? "border-ink bg-ink text-paper" : "border-ink hover:bg-yellow"
    }`;

  return (
    <div className="flex flex-col gap-4">
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
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="border-2 border-ink bg-paper px-3 py-2 text-body file:mr-3 file:border-2 file:border-ink file:bg-ink file:px-3 file:py-1 file:text-caption file:font-bold file:uppercase file:text-paper"
      />
      <p data-pipeline-note className="text-caption uppercase opacity-70">
        Your original is stored untouched, full resolution. Optimized display
        copies are generated for fast viewing.
      </p>

      {prepared ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={prepared.previewUrl}
          alt="Upload preview"
          className="max-h-96 w-auto border-2 border-ink object-contain"
        />
      ) : null}

      <label htmlFor="alt_text" className="text-caption font-bold uppercase">
        Alt text (describe the work for screen readers)
      </label>
      <input
        id="alt_text"
        value={altText}
        onChange={(e) => setAltText(e.target.value)}
        maxLength={300}
        placeholder="e.g. Wood-fired tea bowl with iron glaze, kiln scar on the rim"
        className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue"
      />

      <label htmlFor="caption" className="text-caption font-bold uppercase">
        Caption
      </label>
      <textarea
        id="caption"
        rows={3}
        maxLength={1000}
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Say something about the work…"
        className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue"
      />

      <label htmlFor="category" className="text-caption font-bold uppercase">
        Category
      </label>
      <select
        id="category"
        required
        value={category}
        onChange={(e) => setCategory(e.target.value)}
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

      <fieldset data-display-controls className="flex flex-col gap-3 border-t-2 border-ink pt-4">
        <legend className="pr-3 text-caption font-bold uppercase">
          How it displays — your call
        </legend>

        <p className="text-caption font-bold uppercase">Frame</p>
        <div className="flex flex-wrap gap-2">
          {FRAMES.map((f) => (
            <button
              key={f}
              type="button"
              data-frame-option={f}
              onClick={() => setDisplay({ ...display, frame: f })}
              className={choice(display.frame === f)}
            >
              {FRAME_LABEL[f]}
            </button>
          ))}
        </div>

        <p className="text-caption font-bold uppercase">Window size</p>
        <div className="flex flex-wrap gap-2">
          {SPANS.map((s) => (
            <button
              key={s}
              type="button"
              data-span-option={s}
              onClick={() => setDisplay({ ...display, span: s })}
              className={choice(display.span === s)}
            >
              {SPAN_LABEL[s]}
            </button>
          ))}
        </div>

        <p className="text-caption font-bold uppercase">Aspect</p>
        <div className="flex flex-wrap gap-2">
          {ASPECTS.map((a) => (
            <button
              key={a}
              type="button"
              data-aspect-option={a}
              onClick={() => setDisplay({ ...display, aspect: a })}
              className={choice(display.aspect === a)}
            >
              {ASPECT_LABEL[a]}
            </button>
          ))}
        </div>
      </fieldset>

      {memberGroups.length > 0 ? (
        <fieldset data-group-tagging className="flex flex-col gap-2 border-t-2 border-ink pt-4">
          <legend className="pr-3 text-caption font-bold uppercase">
            Also share into your groups
          </legend>
          {memberGroups.map((g) => (
            <label key={g.id} className="flex items-center gap-2 text-body">
              <input
                type="checkbox"
                checked={groupIds.includes(g.id)}
                onChange={(e) =>
                  setGroupIds((ids) =>
                    e.target.checked
                      ? [...ids, g.id]
                      : ids.filter((id) => id !== g.id),
                  )
                }
                className="size-4 accent-ink"
              />
              {g.name}
            </label>
          ))}
          <p className="text-caption uppercase opacity-70">
            Tagged posts appear in the group feed and carry an &ldquo;also
            in&rdquo; marker in the main feed
          </p>
        </fieldset>
      ) : null}

      {error ? (
        <p role="alert" className="border-2 border-red px-3 py-2 text-caption font-bold uppercase text-red">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={publish}
        disabled={!canPublish || pending}
        className="self-start border-2 border-ink bg-ink px-6 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue disabled:opacity-50"
      >
        {stage === "uploading"
          ? "Uploading original + variants…"
          : stage === "recording"
            ? "Publishing…"
            : "Publish"}
      </button>
    </div>
  );
}
