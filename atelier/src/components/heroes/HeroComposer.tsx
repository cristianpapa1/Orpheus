"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  extractVideoPoster,
  prepareUpload,
  readMediaDuration,
  type PreparedUpload,
} from "@/lib/posts/media";
import { MEDIA_EXT, MEDIA_LIMITS } from "@atelier/core/posts/types";
import { HERO_CAPTION_MAX, validHeroDuration } from "@atelier/core/heroes/types";
import { publishHero } from "@/app/(shell)/heroes/actions";
import { useT } from "@/lib/i18n/context";

interface EventOption {
  id: string;
  title: string;
}
type Stage = "idle" | "uploading" | "recording";

/**
 * Compose a Hero — pick a vertical clip (≤90s), auto-extract a poster, add a
 * caption + optional alt text + optional event, and publish. The video uploads
 * DIRECTLY to storage; the server action records paths and moderates.
 */
export function HeroComposer({
  events,
  initialEventId = "",
}: {
  events: EventOption[];
  initialEventId?: string;
}) {
  const t = useT().heroes;
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [poster, setPoster] = useState<PreparedUpload | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [alt, setAlt] = useState("");
  const [eventId, setEventId] = useState(initialEventId);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      setError(t.needVideo);
      return;
    }
    if (f.size > MEDIA_LIMITS.video.maxBytes) {
      setError(`Too large — video is capped at ${Math.round(MEDIA_LIMITS.video.maxBytes / 1024 / 1024)} MB.`);
      return;
    }
    try {
      const dur = await readMediaDuration(f, "video");
      if (!validHeroDuration(dur)) {
        setError(t.tooLong);
        return;
      }
      const posterFile = await extractVideoPoster(f);
      const prep = await prepareUpload(posterFile);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const largest = prep.variants.at(-1);
      setFile(f);
      setDuration(dur);
      setPoster(prep);
      setPreviewUrl(URL.createObjectURL(largest?.blob ?? posterFile));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.failed);
    }
  };

  const publish = () => {
    setError(null);
    if (!file || !poster || !duration) {
      setError(t.needVideo);
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setError("Preview mode — posting is disabled.");
      return;
    }
    startTransition(async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setError(t.membersOnly);
          return;
        }
        setStage("uploading");
        const stamp = crypto.randomUUID();

        // 1. The video — untouched, in the caller's heroes folder.
        const ext = MEDIA_EXT.video[file.type] ?? file.name.split(".").pop() ?? "mp4";
        const mediaPath = `${user.id}/heroes/${stamp}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("media")
          .upload(mediaPath, file, { contentType: file.type });
        if (upErr) throw new Error(upErr.message);

        // 2. The poster — largest webp variant.
        let posterPath: string | null = null;
        const largest = poster.variants.at(-1);
        if (largest) {
          posterPath = `${user.id}/heroes/${stamp}-poster.webp`;
          const { error: pErr } = await supabase.storage
            .from("media")
            .upload(posterPath, largest.blob, { contentType: "image/webp" });
          if (pErr) throw new Error(pErr.message);
        }

        // 3. Record it.
        setStage("recording");
        const result = await publishHero({
          media_path: mediaPath,
          poster_path: posterPath,
          width: poster.originalWidth,
          height: poster.originalHeight,
          duration_seconds: Math.round(duration),
          caption,
          alt_text: alt,
          event_id: eventId || null,
        });
        // publishHero redirects on success; reaching here means failure.
        if (result && !result.ok) {
          setError(result.error ?? t.failed);
          setStage("idle");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t.failed);
        setStage("idle");
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <span className="text-h2 font-bold uppercase tracking-tight">{t.new}</span>
        <span className="ml-3 text-caption uppercase opacity-70">{t.tagline}</span>
      </div>

      <label htmlFor="hero_video" className="text-caption font-bold uppercase">
        {t.pickVideo}
      </label>
      <input
        id="hero_video"
        data-hero-video
        type="file"
        accept="video/*"
        onChange={onFile}
        className="border-2 border-ink bg-paper px-3 py-2 text-body file:mr-3 file:border-2 file:border-ink file:bg-ink file:px-3 file:py-1 file:text-caption file:font-bold file:uppercase file:text-paper"
      />
      <p className="text-caption uppercase opacity-70">{t.videoHint}</p>

      {previewUrl && duration ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Poster preview"
            className="max-h-64 w-auto border-2 border-ink object-contain"
          />
          <span className="text-caption font-bold uppercase">{Math.round(duration)}s ✓</span>
        </div>
      ) : null}

      <label htmlFor="hero_caption" className="text-caption font-bold uppercase">
        {t.caption}
      </label>
      <textarea
        id="hero_caption"
        rows={3}
        maxLength={HERO_CAPTION_MAX}
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder={t.captionPlaceholder}
        className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue"
      />

      <label htmlFor="hero_alt" className="text-caption font-bold uppercase">
        {t.altText}
      </label>
      <input
        id="hero_alt"
        value={alt}
        onChange={(e) => setAlt(e.target.value)}
        maxLength={300}
        className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue"
      />

      {events.length > 0 ? (
        <>
          <label htmlFor="hero_event" className="text-caption font-bold uppercase">
            {t.event}
          </label>
          <select
            id="hero_event"
            data-hero-event
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="border-2 border-ink bg-paper px-3 py-2 text-body outline-none focus:border-blue"
          >
            <option value="">{t.noEvent}</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
        </>
      ) : null}

      {error ? (
        <p role="alert" className="border-2 border-red px-3 py-2 text-caption font-bold uppercase text-red">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={publish}
        disabled={pending || !file}
        className="self-start border-2 border-ink bg-ink px-6 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue disabled:opacity-50"
      >
        {stage === "uploading" ? t.uploading : stage === "recording" ? t.publishing : t.publish}
      </button>
    </div>
  );
}
