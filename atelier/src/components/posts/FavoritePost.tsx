"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  sharePost,
  toggleFavorite,
  deleteOwnPost,
  curatePost,
  setCurationStoreUrl,
} from "@/app/(shell)/post/interactions";
import { createReport } from "@/lib/moderation/actions";
import {
  REPORT_REASONS,
  STAMPED_ONLY_REASONS,
} from "@atelier/core/moderation/types";
import { useT } from "@/lib/i18n/context";
import type { FavInfo } from "@/lib/favorites/queries";
import type { CurationInfo } from "@/lib/curations/queries";

export interface Contact {
  id: string;
  handle: string;
  display_name: string;
}

/**
 * Post interactions: favorite (heart + count), double-tap to favorite when it
 * wraps the media, and an "Act" menu with three things —
 *   • Share  — the device's native share sheet (copy-link fallback)
 *   • Send to — search your follows (recent chats first) → drops the post into
 *               your chat with them and opens the conversation
 *   • Report — reason + note to moderators
 */
export function FavoritePost({
  postId,
  caption,
  fav,
  cur,
  canCurate = false,
  curatedHref,
  following = [],
  backTo,
  canReportQuality = false,
  canDelete = false,
  checkoutUrl,
  children,
}: {
  postId: string;
  caption?: string;
  fav?: FavInfo;
  /** Curation count + whether the viewer curated it. Absent → hide curated UI. */
  cur?: CurationInfo;
  /** Viewer is a curator → show "Repost as curated" in the Act menu. */
  canCurate?: boolean;
  /** When set, the curated count links here (feed → post detail to inspect). */
  curatedHref?: string;
  following?: Contact[];
  backTo?: string;
  canReportQuality?: boolean;
  /** Viewer owns this post — show a Delete action. */
  canDelete?: boolean;
  /** When set, the Act menu shows "Checkout at Astelier" linking here. */
  checkoutUrl?: string | null;
  children?: React.ReactNode;
}) {
  const { post: tp, reportReason: tReason } = useT();
  const reasons = REPORT_REASONS.filter(
    (r) => !STAMPED_ONLY_REASONS.includes(r) || canReportQuality,
  );
  const router = useRouter();
  const showFav = Boolean(fav);
  const reportBackTo = backTo ?? `/p/${postId}`;
  const [favorited, setFavorited] = useState(fav?.mine ?? false);
  const [count, setCount] = useState(fav?.count ?? 0);
  const showCur = Boolean(cur);
  const [curated, setCurated] = useState(cur?.mine ?? false);
  const [curCount, setCurCount] = useState(cur?.count ?? 0);
  const [burst, setBurst] = useState(false);
  const [actOpen, setActOpen] = useState(false);
  const [sub, setSub] = useState<"none" | "send" | "report" | "delete" | "curate">("none");
  const [curateUrl, setCurateUrl] = useState("");
  const [sendQuery, setSendQuery] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
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

  const nativeShare = async () => {
    const url = `${window.location.origin}/p/${postId}`;
    const title = caption || "Atelier";
    // Web Share API (the OS "send to any app" sheet), with a copy fallback.
    const nav = navigator as Navigator & {
      share?: (d: { title?: string; url?: string }) => Promise<void>;
    };
    if (nav.share) {
      try {
        await nav.share({ title, url });
        return;
      } catch {
        /* user dismissed — fall through to copy */
      }
    }
    try {
      await navigator.clipboard?.writeText(url);
      setMsg("Link copied");
    } catch {
      setMsg(url);
    }
  };

  const doDelete = () => {
    setMsg(null);
    startTransition(async () => {
      const r = await deleteOwnPost(postId);
      if (r.ok) router.refresh(); // post is soft-deleted → drops out of the feed
      else setMsg(r.error ?? "Couldn't delete.");
    });
  };

  // Repost (or un-repost) as curated; when reposting, optionally attach an
  // Astelier buy link so people can follow through and buy.
  const doRepost = () => {
    setMsg(null);
    startTransition(async () => {
      const r = await curatePost(postId);
      if (!r.ok) {
        setMsg(r.error ?? "Couldn't curate.");
        return;
      }
      setCurated(r.curated);
      setCurCount(r.count);
      if (r.curated && curateUrl.trim()) {
        const s = await setCurationStoreUrl(postId, curateUrl.trim());
        setMsg(s.ok ? "Reposted as curated." : s.error ?? "Curated, but the link didn't save.");
      } else {
        setMsg(r.curated ? "Reposted as curated." : "Removed from curated.");
      }
    });
  };

  const saveLink = () => {
    setMsg(null);
    startTransition(async () => {
      const s = await setCurationStoreUrl(postId, curateUrl.trim());
      setMsg(s.ok ? (s.storeUrl ? "Buy link saved." : "Buy link cleared.") : s.error ?? "Couldn't save link.");
    });
  };

  const doSend = (c: Contact) => {
    setMsg(null);
    startTransition(async () => {
      const r = await sharePost(postId, c.id);
      if (r.ok && r.threadId) {
        router.push(`/chat/${r.threadId}`); // jump into the conversation
      } else {
        setMsg(r.error ?? "Couldn't send.");
      }
    });
  };

  const q = sendQuery.trim().toLowerCase();
  const sendList = q
    ? following.filter((c) =>
        `${c.display_name} @${c.handle}`.toLowerCase().includes(q),
      )
    : following;

  const menuBtn =
    "w-full border-2 border-ink px-3 py-2 text-left text-caption font-bold uppercase hover:bg-yellow";

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

        {showCur ? (
          curatedHref ? (
            <Link
              href={curatedHref}
              data-curated-count
              title="Curated — see who curated this"
              className={`flex items-center gap-1 border-2 px-3 py-1 text-caption font-bold uppercase ${
                curated ? "border-blue bg-blue text-paper" : "border-ink hover:bg-blue hover:border-blue hover:text-paper"
              }`}
            >
              <span aria-hidden>♺</span>
              <span>{curCount}</span>
            </Link>
          ) : (
            <span
              data-curated-count
              title="Curated"
              className={`flex items-center gap-1 border-2 px-3 py-1 text-caption font-bold uppercase ${
                curated ? "border-blue bg-blue text-paper" : "border-ink"
              }`}
            >
              <span aria-hidden>♺</span>
              <span>{curCount}</span>
            </span>
          )
        ) : null}

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setActOpen((o) => !o);
              setSub("none");
              setMsg(null);
            }}
            data-act
            aria-expanded={actOpen}
            className="border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-blue hover:border-blue hover:text-paper"
          >
            {tp.act} ▾
          </button>

          {actOpen ? (
            <div className="absolute right-0 z-20 mt-1 w-72 max-w-[calc(100vw-1.5rem)] border-2 border-ink bg-paper p-3">
              {/* actions */}
              <div className="flex flex-col gap-2">
                {checkoutUrl ? (
                  <a
                    href={checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-checkout
                    className="block border-2 border-ink bg-ink px-3 py-2 text-left text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue"
                  >
                    {tp.checkout} →
                  </a>
                ) : null}
                <button type="button" data-share onClick={nativeShare} className={menuBtn}>
                  {tp.share}
                </button>
                <button
                  type="button"
                  data-send-to
                  onClick={() => setSub(sub === "send" ? "none" : "send")}
                  className={menuBtn}
                >
                  {tp.sendTo} {sub === "send" ? "▾" : "▸"}
                </button>
                {canCurate ? (
                  <button
                    type="button"
                    data-curate-toggle
                    onClick={() => setSub(sub === "curate" ? "none" : "curate")}
                    className={`${menuBtn} ${curated ? "bg-blue text-paper" : "hover:bg-blue hover:text-paper"}`}
                  >
                    {curated ? tp.curated : tp.repostCurated} ♺ {sub === "curate" ? "▾" : "▸"}
                  </button>
                ) : null}
                <button
                  type="button"
                  data-report-toggle
                  onClick={() => setSub(sub === "report" ? "none" : "report")}
                  className={menuBtn}
                >
                  {tp.report} {sub === "report" ? "▾" : "▸"}
                </button>
                {canDelete ? (
                  <button
                    type="button"
                    data-delete-toggle
                    onClick={() => setSub(sub === "delete" ? "none" : "delete")}
                    className="w-full border-2 border-ink px-3 py-2 text-left text-caption font-bold uppercase text-red hover:bg-red hover:border-red hover:text-paper"
                  >
                    {tp.deletePost} {sub === "delete" ? "▾" : "▸"}
                  </button>
                ) : null}
              </div>

              {msg ? (
                <p role="status" className="mt-2 text-caption font-bold uppercase">
                  {msg}
                </p>
              ) : null}

              {/* Send to — searchable follow list, recent chats first */}
              {sub === "send" ? (
                <div className="mt-3 border-t-2 border-ink pt-3">
                  {following.length === 0 ? (
                    <p className="text-caption uppercase opacity-70">
                      {tp.followToSend}
                    </p>
                  ) : (
                    <>
                      <input
                        value={sendQuery}
                        onChange={(e) => setSendQuery(e.target.value)}
                        placeholder={tp.searchContacts}
                        data-send-search
                        className="mb-2 w-full border-2 border-ink bg-paper px-2 py-1 text-body outline-none focus:border-blue"
                      />
                      <ul className="flex max-h-48 flex-col gap-1 overflow-auto">
                        {sendList.map((c) => (
                          <li key={c.id}>
                            <button
                              type="button"
                              onClick={() => doSend(c)}
                              disabled={pending}
                              data-send-target={c.id}
                              className="w-full border-2 border-ink px-2 py-1 text-left text-caption font-bold hover:bg-yellow disabled:opacity-50"
                            >
                              {c.display_name}
                              {c.handle ? ` · @${c.handle}` : ""}
                            </button>
                          </li>
                        ))}
                        {sendList.length === 0 ? (
                          <li className="text-caption uppercase opacity-70">{tp.noMatch}</li>
                        ) : null}
                      </ul>
                    </>
                  )}
                </div>
              ) : null}

              {/* Report */}
              {sub === "report" ? (
                <form
                  action={createReport}
                  data-report-form
                  className="mt-3 flex flex-col gap-2 border-t-2 border-ink pt-3"
                >
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
                      {tp.reasonPlaceholder}
                    </option>
                    {reasons.map((r) => (
                      <option key={r} value={r}>
                        {tReason[r]}
                      </option>
                    ))}
                  </select>
                  <textarea
                    name="detail"
                    rows={2}
                    maxLength={600}
                    placeholder={tp.reportNote}
                    className="border-2 border-ink bg-paper px-2 py-1 text-body outline-none focus:border-blue"
                  />
                  <button
                    type="submit"
                    className="self-start border-2 border-ink bg-ink px-3 py-1 text-caption font-bold uppercase text-paper hover:bg-red hover:border-red"
                  >
                    {tp.sendReport}
                  </button>
                </form>
              ) : null}

              {sub === "curate" ? (
                <div data-curate-panel className="mt-3 flex flex-col gap-2 border-t-2 border-ink pt-3">
                  {curated ? (
                    <>
                      <p className="text-caption font-bold uppercase">You curated this ♺</p>
                      <label className="text-caption font-bold uppercase">
                        {tp.buyLinkOptional}
                      </label>
                      <input
                        value={curateUrl}
                        onChange={(e) => setCurateUrl(e.target.value)}
                        data-curate-link
                        placeholder="https://astelier.aunflaneur.com/product/…"
                        className="w-full border-2 border-ink bg-paper px-2 py-1 text-body outline-none focus:border-blue"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={saveLink}
                          disabled={pending}
                          className="border-2 border-ink bg-ink px-3 py-1 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue disabled:opacity-50"
                        >
                          {tp.saveLink}
                        </button>
                        <button
                          type="button"
                          data-uncurate
                          onClick={doRepost}
                          disabled={pending}
                          className="border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-red hover:border-red hover:text-paper disabled:opacity-50"
                        >
                          {tp.remove}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-body">
                        Repost to your Curated shelf and your followers&apos; feeds.
                        Add an Astelier link so people can buy.
                      </p>
                      <label className="text-caption font-bold uppercase">
                        {tp.buyLinkOptional}
                      </label>
                      <input
                        value={curateUrl}
                        onChange={(e) => setCurateUrl(e.target.value)}
                        data-curate-link
                        placeholder="https://astelier.aunflaneur.com/product/…"
                        className="w-full border-2 border-ink bg-paper px-2 py-1 text-body outline-none focus:border-blue"
                      />
                      <button
                        type="button"
                        data-repost
                        onClick={doRepost}
                        disabled={pending}
                        className="self-start border-2 border-ink bg-ink px-4 py-1 text-caption font-bold uppercase text-paper hover:bg-blue hover:border-blue disabled:opacity-50"
                      >
                        {pending ? "…" : tp.repostCurated}
                      </button>
                    </>
                  )}
                </div>
              ) : null}

              {sub === "delete" ? (
                <div className="mt-3 flex flex-col gap-2 border-t-2 border-ink pt-3">
                  <p className="text-caption font-bold uppercase">
                    {tp.confirmDelete}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      data-delete-confirm
                      onClick={doDelete}
                      disabled={pending}
                      className="border-2 border-red bg-red px-3 py-1 text-caption font-bold uppercase text-paper hover:opacity-80 disabled:opacity-50"
                    >
                      {pending ? "…" : tp.delete}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSub("none")}
                      className="border-2 border-ink px-3 py-1 text-caption font-bold uppercase hover:bg-yellow"
                    >
                      {tp.cancel}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
