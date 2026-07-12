"use client";

import { useState, useTransition } from "react";
import { sharePost, toggleFavorite } from "@/app/(shell)/post/interactions";
import type { FavInfo } from "@/lib/favorites/queries";
import type { MutualFollow } from "@/lib/profile/queries";

/**
 * Post interactions: favorite (heart + count, optimistic), double-tap to
 * favorite when it wraps the media (detail page), and share to a mutual
 * follow via chat. Renders nothing extra when a capability is unavailable
 * (fav undefined → no heart; no mutuals → no share).
 */
export function FavoritePost({
  postId,
  fav,
  mutuals = [],
  children,
}: {
  postId: string;
  fav?: FavInfo;
  mutuals?: MutualFollow[];
  children?: React.ReactNode;
}) {
  const showFav = Boolean(fav);
  const [favorited, setFavorited] = useState(fav?.mine ?? false);
  const [count, setCount] = useState(fav?.count ?? 0);
  const [burst, setBurst] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const flash = () => {
    setBurst(true);
    setTimeout(() => setBurst(false), 650);
  };

  const toggle = () => {
    if (!showFav) return;
    const next = !favorited;
    setFavorited(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    if (next) flash();
    startTransition(async () => {
      const r = await toggleFavorite(postId);
      if (r.ok) {
        setFavorited(r.favorited);
        setCount(r.count);
      } else {
        setFavorited(fav?.mine ?? false);
        setCount(fav?.count ?? 0);
      }
    });
  };

  // Double-tap always favorites (never un-favorites), like the familiar tap.
  const onDoubleTap = () => {
    if (!showFav) return;
    flash();
    if (favorited) return;
    setFavorited(true);
    setCount((c) => c + 1);
    startTransition(async () => {
      const r = await toggleFavorite(postId);
      if (r.ok) {
        setFavorited(r.favorited);
        setCount(r.count);
      }
    });
  };

  const doShare = (m: MutualFollow) => {
    setShareMsg(null);
    startTransition(async () => {
      const r = await sharePost(postId, m.id);
      setShareMsg(r.ok ? `Sent to ${m.display_name}` : (r.error ?? "Couldn't share."));
      if (r.ok) setShareOpen(false);
    });
  };

  return (
    <>
      {children ? (
        <div className="relative" onDoubleClick={onDoubleTap} data-double-tap>
          {children}
          {burst ? (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <span className="animate-ping text-7xl text-red">♥</span>
            </span>
          ) : null}
        </div>
      ) : null}

      {showFav || mutuals.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 pt-3">
          {showFav ? (
            <button
              type="button"
              onClick={toggle}
              disabled={pending}
              data-favorite
              aria-pressed={favorited}
              className={`flex items-center gap-1 border-2 px-3 py-1 text-caption font-bold uppercase disabled:opacity-50 ${
                favorited
                  ? "border-red bg-red text-paper"
                  : "border-ink hover:bg-red hover:border-red hover:text-paper"
              }`}
            >
              <span aria-hidden>{favorited ? "♥" : "♡"}</span>
              <span data-favorite-count>{count}</span>
            </button>
          ) : null}

          {mutuals.length > 0 ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShareOpen((o) => !o)}
                data-share
                aria-expanded={shareOpen}
                className="border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-blue hover:border-blue hover:text-paper"
              >
                Share
              </button>
              {shareOpen ? (
                <div className="absolute left-0 z-20 mt-1 w-60 border-2 border-ink bg-paper p-2">
                  <p className="mb-1 text-caption font-bold uppercase opacity-70">
                    Send to someone you both follow
                  </p>
                  <ul className="flex max-h-48 flex-col gap-1 overflow-auto">
                    {mutuals.map((m) => (
                      <li key={m.id}>
                        <button
                          type="button"
                          onClick={() => doShare(m)}
                          disabled={pending}
                          data-share-target={m.id}
                          className="w-full border-2 border-ink px-2 py-1 text-left text-caption font-bold hover:bg-yellow disabled:opacity-50"
                        >
                          {m.display_name}
                          {m.handle ? ` · @${m.handle}` : ""}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          {shareMsg ? (
            <span role="status" className="text-caption font-bold uppercase">
              {shareMsg}
            </span>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
