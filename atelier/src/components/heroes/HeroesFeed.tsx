"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { heroCountdown } from "@atelier/core/heroes/types";
import type { HeroItem } from "@/lib/heroes/queries";
import { deleteHero, recordHeroView, toggleHeroFavorite } from "@/app/(shell)/heroes/actions";
import { useT } from "@/lib/i18n/context";

/**
 * Heroes — the vertical, snap-scrolling short-video pager. The active clip
 * autoplays muted + looped; tapping toggles sound. Recording a view, liking,
 * sharing and deleting mirror the post surface. Empty state invites the first
 * Hero. Everything degrades gracefully when the 0031 tables aren't there yet
 * (the server hands us [] and we show the empty state).
 */
export function HeroesFeed({
  heroes: initial,
  viewerId,
  isAdmin,
}: {
  heroes: HeroItem[];
  viewerId: string | null;
  isAdmin: boolean;
}) {
  const t = useT().heroes;
  const [heroes, setHeroes] = useState<HeroItem[]>(initial);
  const [muted, setMuted] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const videos = useRef(new Map<string, HTMLVideoElement>());
  const viewed = useRef(new Set<string>());

  // Autoplay whichever clip is centered; pause + rewind the rest; record a view
  // the first time a clip becomes active.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.getAttribute("data-hero");
          if (!id) continue;
          const video = videos.current.get(id);
          if (!video) continue;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            video.muted = muted;
            void video.play().catch(() => {});
            if (!viewed.current.has(id)) {
              viewed.current.add(id);
              void recordHeroView(id);
              setHeroes((hs) => hs.map((h) => (h.id === id ? { ...h, views: h.views + 1 } : h)));
            }
          } else {
            video.pause();
            video.currentTime = 0;
          }
        }
      },
      { threshold: [0, 0.6, 1] },
    );
    for (const el of videos.current.values()) {
      const panel = el.closest("[data-hero]");
      if (panel) observer.observe(panel);
    }
    return () => observer.disconnect();
    // Re-bind when the set of heroes changes.
  }, [heroes.length, muted]);

  const setVideoRef = useCallback((id: string, el: HTMLVideoElement | null) => {
    if (el) videos.current.set(id, el);
    else videos.current.delete(id);
  }, []);

  const like = async (id: string) => {
    if (!viewerId) return;
    // optimistic
    setHeroes((hs) =>
      hs.map((h) =>
        h.id === id ? { ...h, liked: !h.liked, favorites: h.favorites + (h.liked ? -1 : 1) } : h,
      ),
    );
    const r = await toggleHeroFavorite(id);
    if (r.ok) {
      setHeroes((hs) => hs.map((h) => (h.id === id ? { ...h, liked: r.favorited, favorites: r.count } : h)));
    }
  };

  const share = async (id: string, caption: string) => {
    const url = `${window.location.origin}/heroes?h=${id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Atelier · Heroes", text: caption || "A Hero on Atelier", url });
        return;
      }
    } catch {
      // fall through to copy
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1800);
    } catch {
      /* no-op */
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm(t.deleteConfirm)) return;
    setHeroes((hs) => hs.filter((h) => h.id !== id));
    await deleteHero(id);
  };

  return (
    <div className="-mx-6 -mt-10">
      <div className="flex items-center justify-between border-b-2 border-ink bg-paper px-6 py-3">
        <div>
          <span className="text-h2 font-bold uppercase tracking-tight">{t.title}</span>
          <span className="ml-3 text-caption uppercase opacity-70">{t.tagline}</span>
        </div>
        <Link
          href="/heroes/new"
          data-new-hero
          className="border-2 border-ink bg-ink px-4 py-1 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue"
        >
          ＋ {t.new}
        </Link>
      </div>

      {heroes.length === 0 ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-h2 font-bold uppercase">{t.emptyTitle}</p>
          <p className="max-w-md text-body opacity-70">{t.emptyBody}</p>
          <Link
            href="/heroes/new"
            className="border-2 border-ink bg-ink px-6 py-2 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue"
          >
            ＋ {t.new}
          </Link>
        </div>
      ) : (
        <div
          data-heroes-pager
          className="h-[calc(100dvh-11rem)] snap-y snap-mandatory overflow-y-auto bg-ink"
        >
          {heroes.map((h) => {
            const canDelete = isAdmin || (viewerId && viewerId === h.author_id);
            return (
              <section
                key={h.id}
                data-hero={h.id}
                className="relative flex h-full snap-start items-center justify-center overflow-hidden"
              >
                <video
                  ref={(el) => setVideoRef(h.id, el)}
                  src={h.media_url}
                  poster={h.poster_url ?? undefined}
                  className="max-h-full max-w-full"
                  style={h.width && h.height ? { aspectRatio: `${h.width}/${h.height}` } : undefined}
                  loop
                  muted={muted}
                  playsInline
                  onClick={() => setMuted((m) => !m)}
                />

                {/* mute hint */}
                {muted ? (
                  <button
                    type="button"
                    onClick={() => setMuted(false)}
                    className="absolute left-1/2 top-4 -translate-x-1/2 border-2 border-paper bg-ink/70 px-3 py-1 text-caption font-bold uppercase text-paper"
                  >
                    🔇 {t.tapForSound}
                  </button>
                ) : null}

                {/* countdown */}
                <span className="absolute right-4 top-4 border-2 border-paper bg-ink/70 px-2 py-1 text-caption font-bold uppercase text-paper">
                  ⏳ {heroCountdown(h.expires_at)}
                </span>

                {/* left: identity + caption + event */}
                <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4">
                  <div className="min-w-0 max-w-[70%]">
                    <Link
                      href={`/u/${h.author_handle || h.author_id}`}
                      className="inline-block text-caption font-bold uppercase text-paper hover:text-yellow"
                    >
                      {h.author_name}
                      {h.author_handle ? ` · @${h.author_handle}` : ""}
                    </Link>
                    {h.caption ? (
                      <p className="mt-1 line-clamp-3 whitespace-pre-wrap break-words text-body text-paper">
                        {h.caption}
                      </p>
                    ) : null}
                    {h.event_id && h.event_title ? (
                      <Link
                        href="/events"
                        data-hero-event={h.event_id}
                        className="mt-2 inline-block border-2 border-paper px-2 py-0.5 text-caption font-bold uppercase text-paper hover:bg-paper hover:text-ink"
                      >
                        ◆ {h.event_title}
                      </Link>
                    ) : null}
                  </div>

                  {/* right: actions */}
                  <div className="flex shrink-0 flex-col items-center gap-3 text-paper">
                    <button
                      type="button"
                      onClick={() => like(h.id)}
                      disabled={!viewerId}
                      aria-pressed={h.liked}
                      className="flex flex-col items-center disabled:opacity-50"
                    >
                      <span className={`text-2xl leading-none ${h.liked ? "text-red" : ""}`}>
                        {h.liked ? "♥" : "♡"}
                      </span>
                      <span className="text-caption font-bold tabular-nums">{h.favorites}</span>
                    </button>
                    <div className="flex flex-col items-center">
                      <span className="text-xl leading-none" aria-hidden>
                        👁
                      </span>
                      <span className="text-caption font-bold tabular-nums">{h.views}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => share(h.id, h.caption)}
                      className="flex flex-col items-center"
                    >
                      <span className="text-xl leading-none" aria-hidden>
                        ↗
                      </span>
                      <span className="text-caption font-bold uppercase">
                        {copied === h.id ? t.shareCopied : t.share}
                      </span>
                    </button>
                    {canDelete ? (
                      <button
                        type="button"
                        onClick={() => remove(h.id)}
                        data-delete-hero={h.id}
                        className="flex flex-col items-center"
                      >
                        <span className="text-xl leading-none" aria-hidden>
                          🗑
                        </span>
                        <span className="text-caption font-bold uppercase">{t.delete}</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
