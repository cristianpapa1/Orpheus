"use client";

import { useRef, useState } from "react";
import { formatDuration } from "@atelier/core/posts/types";

/**
 * Bauhaus media player — square play/pause, a monolithic ink progress bar on a
 * paper track, mono time. Replaces the generic browser controls. Never
 * autoplays (preload="none"); sound only on the user's action.
 */
export function MediaPlayer({
  src,
  kind,
  poster,
  durationSeconds,
  className,
}: {
  src: string;
  kind: "audio" | "video";
  poster?: string;
  durationSeconds?: number | null;
  className?: string;
}) {
  const ref = useRef<HTMLMediaElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(durationSeconds ?? 0);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || !dur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    el.currentTime = pct * dur;
    setCur(el.currentTime);
  };

  const mediaProps = {
    preload: "none" as const,
    onPlay: () => setPlaying(true),
    onPause: () => setPlaying(false),
    onEnded: () => setPlaying(false),
    onTimeUpdate: () => setCur(ref.current?.currentTime ?? 0),
    onLoadedMetadata: () => setDur(ref.current?.duration || durationSeconds || 0),
  };

  const pct = dur ? (cur / dur) * 100 : 0;

  const controls = (
    <div className="mt-2 flex items-center gap-3 border-2 border-ink bg-paper p-2">
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
        className="grid size-9 shrink-0 place-items-center bg-ink text-caption font-bold text-paper hover:bg-blue"
      >
        <span aria-hidden>{playing ? "❚❚" : "▶"}</span>
      </button>
      <div
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={Math.round(dur)}
        aria-valuenow={Math.round(cur)}
        tabIndex={0}
        onClick={seek}
        className="h-4 grow cursor-pointer border-2 border-ink bg-paper"
      >
        <div className="h-full bg-ink" style={{ width: `${pct}%` }} />
      </div>
      <span className="shrink-0 text-caption font-bold tabular-nums">
        {formatDuration(cur)} / {formatDuration(dur)}
      </span>
    </div>
  );

  if (kind === "video") {
    return (
      <div className="block">
        <video
          ref={ref as React.RefObject<HTMLVideoElement>}
          playsInline
          poster={poster}
          className={`h-auto w-full ${className ?? ""}`}
          {...mediaProps}
        >
          <source src={src} />
        </video>
        {controls}
      </div>
    );
  }

  return (
    <div className="block">
      <audio ref={ref as React.RefObject<HTMLAudioElement>} {...mediaProps}>
        <source src={src} />
      </audio>
      {controls}
    </div>
  );
}
