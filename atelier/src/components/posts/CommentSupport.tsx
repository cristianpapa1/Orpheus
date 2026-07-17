"use client";

import { useState, useTransition } from "react";
import { toggleCommentSupport } from "@/app/(shell)/post/comments";
import type { SupportInfo } from "@/lib/comments/queries";

/** A support (like) signal any signed-in member can give a curator's comment. */
export function CommentSupport({
  commentId,
  support,
}: {
  commentId: string;
  support?: SupportInfo;
}) {
  const [supported, setSupported] = useState(support?.mine ?? false);
  const [count, setCount] = useState(support?.count ?? 0);
  const [pending, start] = useTransition();

  const toggle = () => {
    const next = !supported;
    setSupported(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    start(async () => {
      const r = await toggleCommentSupport(commentId);
      if (r.ok) {
        setSupported(r.supported);
        setCount(r.count);
      } else {
        setSupported(support?.mine ?? false);
        setCount(support?.count ?? 0);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      data-support={commentId}
      aria-pressed={supported}
      title="Support this comment"
      className={`flex items-center gap-1 border-2 px-2 py-0.5 text-caption font-bold uppercase disabled:opacity-50 ${
        supported ? "border-blue bg-blue text-paper" : "border-ink hover:bg-blue hover:border-blue hover:text-paper"
      }`}
    >
      <span aria-hidden>▲</span>
      <span data-support-count>{count}</span>
    </button>
  );
}
