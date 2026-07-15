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
} from "@atelier/core/posts/display";
import {
  extractVideoPoster,
  prepareUpload,
  readMediaDuration,
  type PreparedUpload,
} from "@/lib/posts/media";
import { createClient } from "@/lib/supabase/client";
import {
  CATEGORY_LABEL,
  MAX_BODY_CHARS,
  MEDIA_EXT,
  MEDIA_LIMITS,
  POST_CATEGORIES,
  subcategoriesFor,
  subcategoryLabel,
  validDuration,
  type MediaType,
} from "@atelier/core/posts/types";
import type { MutualFollow } from "@/lib/profile/queries";
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
  mutuals = [],
}: {
  canPublish: boolean;
  memberGroups?: TaggableGroup[];
  mutuals?: MutualFollow[];
}) {
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [caption, setCaption] = useState("");
  const [altText, setAltText] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("image");
  const [avFile, setAvFile] = useState<File | null>(null);
  const [avDuration, setAvDuration] = useState<number | null>(null);
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [display, setDisplay] = useState<PostDisplay>(DEFAULT_DISPLAY);
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [mentionIds, setMentionIds] = useState<string[]>([]);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onAvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file || mediaType === "image" || mediaType === "text") return;
    if (!file.type.startsWith(`${mediaType}/`)) {
      setError(`Choose a ${mediaType} file.`);
      return;
    }
    if (file.size > MEDIA_LIMITS[mediaType].maxBytes) {
      setError(
        `Too large — ${mediaType} files are capped at ${Math.round(MEDIA_LIMITS[mediaType].maxBytes / 1024 / 1024)} MB.`,
      );
      return;
    }
    try {
      const duration = await readMediaDuration(file, mediaType);
      if (!validDuration(mediaType, duration)) {
        setError(
          mediaType === "video"
            ? "Videos are capped at 2 minutes — shorts, not features."
            : "Audio is capped at 5 minutes.",
        );
        return;
      }
      setAvFile(file);
      setAvDuration(duration);
      if (mediaType === "video") {
        // Poster frame → the existing image pipeline (variants + blur).
        const poster = await extractVideoPoster(file);
        const result = await prepareUpload(poster);
        if (prepared) URL.revokeObjectURL(prepared.previewUrl);
        const largest = result.variants.at(-1);
        setPrepared({
          ...result,
          previewUrl: URL.createObjectURL(largest?.blob ?? poster),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read that file.");
    }
  };

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

    // Text posts (poems / paragraphs) carry no media — publish the words.
    if (mediaType === "text") {
      const trimmed = body.trim();
      if (!trimmed) {
        setError("Write something to publish.");
        return;
      }
      if (!category) {
        setError("Pick a category.");
        return;
      }
      startTransition(async () => {
        const result = await publishPost({
          caption,
          category,
          subcategory: subcategory || null,
          body: trimmed,
          tags,
          checkout_url: checkoutUrl,
          display: DEFAULT_DISPLAY,
          media_type: "text",
          group_ids: groupIds,
          mention_ids: mentionIds,
        });
        if (result && !result.ok) setError(result.error ?? "Publish failed.");
      });
      return;
    }

    if (!prepared) {
      setError(
        mediaType === "audio"
          ? "Audio posts need a cover image."
          : mediaType === "video"
            ? "Choose a video file first."
            : "Choose an image.",
      );
      return;
    }
    if (mediaType !== "image" && !avFile) {
      setError(`Choose a ${mediaType} file.`);
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

        // 1b. Track B: the AV file itself — untouched, in the owner's folder.
        let mediaPath: string | null = null;
        if (mediaType !== "image" && avFile) {
          const avExt =
            MEDIA_EXT[mediaType][avFile.type] ??
            avFile.name.split(".").pop() ??
            "bin";
          mediaPath = `${user.id}/media/${stamp}.${avExt}`;
          const { error: avErr } = await supabase.storage
            .from("media")
            .upload(mediaPath, avFile, { contentType: avFile.type });
          if (avErr) throw new Error(avErr.message);
        }

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
          subcategory: subcategory || null,
          tags,
          checkout_url: checkoutUrl,
          display,
          original_path: originalPath,
          variants,
          image_path: largest.path,
          width: prepared.variants.at(-1)?.width ?? prepared.originalWidth,
          height: prepared.variants.at(-1)?.height ?? prepared.originalHeight,
          blur_data: prepared.blur,
          alt_text: altText,
          media_type: mediaType,
          media_path: mediaPath,
          duration_seconds: avDuration,
          group_ids: groupIds,
          mention_ids: mentionIds,
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

      <p className="text-caption font-bold uppercase">What are you sharing?</p>
      <div className="flex flex-wrap gap-2" data-media-picker>
        {(["image", "video", "audio", "text"] as const).map((m) => (
          <button
            key={m}
            type="button"
            data-media-option={m}
            onClick={() => {
              setMediaType(m);
              setAvFile(null);
              setAvDuration(null);
              setError(null);
            }}
            className={`border-2 px-3 py-1 text-caption font-bold uppercase ${
              mediaType === m
                ? "border-ink bg-ink text-paper"
                : "border-ink hover:bg-yellow"
            }`}
          >
            {m === "image"
              ? "Image"
              : m === "video"
                ? "Short video"
                : m === "audio"
                  ? "Short audio"
                  : "Text"}
          </button>
        ))}
      </div>

      {mediaType === "text" ? (
        <>
          <label htmlFor="body" className="text-caption font-bold uppercase">
            Your words (poem, paragraph…)
          </label>
          <textarea
            id="body"
            data-post-body
            rows={12}
            maxLength={MAX_BODY_CHARS}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={"Low tide.\nThe sea unmakes the letters\nI wrote across the sand…"}
            className="resize-y whitespace-pre-wrap border-2 border-ink bg-paper px-3 py-2 text-body leading-relaxed outline-none focus:border-blue"
          />
          <p className="text-caption uppercase opacity-70">
            {body.length} / {MAX_BODY_CHARS} · line breaks are kept
          </p>
        </>
      ) : null}

      {mediaType === "video" || mediaType === "audio" ? (
        <>
          <label htmlFor="av_file" className="text-caption font-bold uppercase">
            {mediaType === "video" ? "Video (max 2 min)" : "Audio (max 5 min)"}
          </label>
          <input
            id="av_file"
            type="file"
            accept={mediaType === "video" ? "video/*" : "audio/*"}
            onChange={onAvFileChange}
            className="border-2 border-ink bg-paper px-3 py-2 text-body file:mr-3 file:border-2 file:border-ink file:bg-ink file:px-3 file:py-1 file:text-caption file:font-bold file:uppercase file:text-paper"
          />
          {avFile && avDuration ? (
            <p className="text-caption font-bold uppercase">
              {avFile.name} · {Math.round(avDuration)}s ✓
            </p>
          ) : null}
        </>
      ) : null}

      {mediaType === "image" || mediaType === "audio" ? (
        <>
          <label htmlFor="image" className="text-caption font-bold uppercase">
            {mediaType === "audio" ? "Cover image (required)" : "Work (image)"}
          </label>
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="border-2 border-ink bg-paper px-3 py-2 text-body file:mr-3 file:border-2 file:border-ink file:bg-ink file:px-3 file:py-1 file:text-caption file:font-bold file:uppercase file:text-paper"
          />
        </>
      ) : mediaType === "video" ? (
        <p className="text-caption uppercase opacity-70">
          Poster frame is extracted automatically from the video
        </p>
      ) : null}

      {mediaType !== "text" ? (
        <p data-pipeline-note className="text-caption uppercase opacity-70">
          Your original is stored untouched, full resolution. Optimized display
          copies are generated for fast viewing.
        </p>
      ) : null}

      {prepared && mediaType !== "text" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={prepared.previewUrl}
          alt="Upload preview"
          className="max-h-96 w-auto border-2 border-ink object-contain"
        />
      ) : null}

      {mediaType !== "text" ? (
        <>
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
        </>
      ) : null}

      <label htmlFor="caption" className="text-caption font-bold uppercase">
        {mediaType === "text" ? "Title (optional)" : "Caption"}
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
        onChange={(e) => {
          setCategory(e.target.value);
          setSubcategory(""); // reset — styles differ per category
        }}
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

      {subcategoriesFor(category).length > 0 ? (
        <>
          <label htmlFor="subcategory" className="text-caption font-bold uppercase">
            Style (optional)
          </label>
          <select
            id="subcategory"
            data-subcategory
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue"
          >
            <option value="">No style</option>
            {subcategoriesFor(category).map((s) => (
              <option key={s} value={s}>
                {subcategoryLabel(s)}
              </option>
            ))}
          </select>
        </>
      ) : null}

      <label htmlFor="tags" className="text-caption font-bold uppercase">
        Tags (optional)
      </label>
      <input
        id="tags"
        data-tags
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="woodfired, ceramics, studio"
        className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue"
      />
      <p className="text-caption uppercase opacity-70">
        Comma or space separated · up to 8 · lets people find work by topic
      </p>

      <label htmlFor="checkout_url" className="text-caption font-bold uppercase">
        Astelier link (optional)
      </label>
      <input
        id="checkout_url"
        data-checkout-url
        value={checkoutUrl}
        onChange={(e) => setCheckoutUrl(e.target.value)}
        placeholder="https://astelier.aunflaneur.com/store/your-shop"
        className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue"
      />
      <p className="text-caption uppercase opacity-70">
        Selling this? Paste your Astelier store or product link — adds a “Checkout
        at Astelier” button to the post&apos;s Act menu.
      </p>

      {mediaType !== "text" ? (
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
      ) : null}

      {mutuals.length > 0 ? (
        <fieldset data-people-tagging className="flex flex-col gap-2 border-t-2 border-ink pt-4">
          <legend className="pr-3 text-caption font-bold uppercase">
            Tag people you follow
          </legend>
          <div className="flex flex-wrap gap-2">
            {mutuals.map((m) => {
              const active = mentionIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  data-mention={m.id}
                  aria-pressed={active}
                  onClick={() =>
                    setMentionIds((ids) =>
                      active ? ids.filter((id) => id !== m.id) : [...ids, m.id],
                    )
                  }
                  className={`border-2 px-3 py-1 text-caption font-bold uppercase ${
                    active ? "border-ink bg-ink text-paper" : "border-ink hover:bg-yellow"
                  }`}
                >
                  {m.display_name}
                  {m.handle ? ` · @${m.handle}` : ""}
                </button>
              );
            })}
          </div>
          <p className="text-caption uppercase opacity-70">
            Only people you both follow can be tagged
          </p>
        </fieldset>
      ) : null}

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
