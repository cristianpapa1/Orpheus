"use client";

import { useState, useTransition } from "react";
import { sharePost, toggleFavorite } from "@/app/(shell)/post/interactions";
import { createReport } from "@/lib/moderation/actions";
import { REASON_LABEL, REPORT_REASONS } from "@atelier/core/moderation/types";
import type { FavInfo } from "@/lib/favorites/queries";
import type { MutualFollow } from "@/lib/profile/queries";

/**
 * Post interactions: favorite (heart + count, optimistic), double-tap to
 * favorite when it wraps the media, and an "Act" menu that bundles Share
 * (send to a mutual follow via chat) and Report.
 */
export function FavoritePost({
  postId,
  fav,
  mutuals = [],
  backTo,
  children,
}: {
  postId: string;
  fav?: FavInfo;
  mutuals?: MutualFollow[];
  /** Where a report redirects back to (default: the post page). */
  backTo?: string;
  children?: React.ReactNode;
}) {
  const showFav = Boolean(fav);
  const reportBackTo = backTo ?? `/p/${postId}`;
  const [favorited, setFavorited] = useState(fav?.mine ?? false);
  const [count, setCount] = useState(fav?.count ?? 0);
  const [burst, setBurst] = useState(false);
  const [actOpen, setActOpen] = useState(false);
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

  const onDoubleTap = () => {
    if (!showFav || favorited) {
      flash();
      return;
    }
    flash();
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

        <div className="relative">
          <button
            type="button"
            onClick={() => setActOpen((o) => !o)}
            data-act
            aria-expanded={actOpen}
            className="border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-blue hover:border-blue hover:text-paper"
          >
            Act ▾
          </button>
          {actOpen ? (
            <div className="absolute left-0 z-20 mt-1 w-72 border-2 border-ink bg-paper p-3">
              {/* Share / send to a mutual follow */}
              {mutuals.length > 0 ? (
                <div className="mb-3">
                  <p className="mb-1 text-caption font-bold uppercase opacity-70">
                    Send to someone you both follow
                  </p>
                  <ul className="flex max-h-40 flex-col gap-1 overflow-auto">
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
                  {shareMsg ? (
                    <p role="status" className="mt-1 text-caption font-bold uppercase">
                      {shareMsg}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {/* Report */}
              <p className="mb-1 text-caption font-bold uppercase opacity-70">Report</p>
              <form action={createReport} className="flex flex-col gap-2" data-report-form>
                <input type="hidden" name="subject_type" value="post" />
                <input type="hidden" name="subject_id" value={postId} />
                <input type="hidden" name="back_to" value={reportBackTo} />
                <select
                  name="reason"
                  required
                  defaultValue=""
                  className="border-2 border-ink bg-paper px-2 py-1 text-body outline-none focus:border-blue"
                >
                  <option value="" disabled>
                    Reason…
                  </option>
                  {REPORT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {REASON_LABEL[r]}
                    </option>
                  ))}
                </select>
                <textarea
                  name="detail"
                  rows={2}
                  maxLength={600}
                  placeholder="Anything moderators should know (optional)"
                  className="border-2 border-ink bg-paper px-2 py-1 text-body outline-none focus:border-blue"
                />
                <button
                  type="submit"
                  className="self-start border-2 border-ink bg-ink px-3 py-1 text-caption font-bold uppercase text-paper hover:bg-red hover:border-red"
                >
                  Send report
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
