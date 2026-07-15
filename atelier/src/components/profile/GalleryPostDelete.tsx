"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteOwnPost } from "@/app/(shell)/post/interactions";

/**
 * Owner-only delete for a gallery tile. Rendered as a sibling of the tile's
 * <Link> (never inside the anchor), absolutely positioned in the corner, so a
 * click deletes rather than navigating into the post. Two-step confirm keeps a
 * stray tap from destroying work. Only the owner ever sees this.
 */
export function GalleryPostDelete({ postId }: { postId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const doDelete = () => {
    setErr(null);
    startTransition(async () => {
      const r = await deleteOwnPost(postId);
      if (r.ok) router.refresh(); // soft-deleted → drops out of the gallery
      else setErr(r.error ?? "Couldn't delete.");
    });
  };

  if (!confirming) {
    return (
      <button
        type="button"
        aria-label="Delete this post"
        title="Delete this post"
        onClick={() => setConfirming(true)}
        data-gallery-delete={postId}
        className="absolute right-1 top-1 z-10 flex size-6 items-center justify-center border-2 border-ink bg-paper text-caption font-bold leading-none opacity-70 hover:bg-red hover:border-red hover:text-paper hover:opacity-100"
      >
        ×
      </button>
    );
  }

  return (
    <div className="absolute right-1 top-1 z-10 flex items-center gap-1">
      <button
        type="button"
        onClick={doDelete}
        disabled={pending}
        data-gallery-delete-confirm={postId}
        className="border-2 border-red bg-red px-1.5 py-0.5 text-caption font-bold uppercase leading-none text-paper hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "…" : err ? "Retry" : "Delete"}
      </button>
      <button
        type="button"
        onClick={() => {
          setConfirming(false);
          setErr(null);
        }}
        disabled={pending}
        className="border-2 border-ink bg-paper px-1.5 py-0.5 text-caption font-bold uppercase leading-none hover:bg-yellow disabled:opacity-50"
      >
        ×
      </button>
    </div>
  );
}
