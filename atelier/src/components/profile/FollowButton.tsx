"use client";

import { useState, useTransition } from "react";
import { follow, unfollow } from "@/app/(shell)/u/actions";

export type FollowState = "can-follow" | "following" | "self" | "signed-out" | "preview";

export function FollowButton({
  targetId,
  handle,
  initialState,
}: {
  targetId: string;
  handle: string;
  initialState: FollowState;
}) {
  const [state, setState] = useState(initialState);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (state === "self") return null;

  if (state === "signed-out" || state === "preview") {
    return (
      <a
        href="/login"
        data-follow-button
        className="border-2 border-ink px-4 py-1 text-caption font-bold uppercase hover:bg-blue hover:border-blue hover:text-paper"
        title={
          state === "preview"
            ? "Preview mode — connect Supabase to enable following"
            : "Sign in to follow"
        }
      >
        Follow
      </a>
    );
  }

  const toggle = () => {
    setError(null);
    startTransition(async () => {
      const isFollowing = state === "following";
      const result = isFollowing
        ? await unfollow(targetId, handle)
        : await follow(targetId, handle);
      if (result.ok) setState(isFollowing ? "can-follow" : "following");
      else setError(result.error ?? "Something went wrong.");
    });
  };

  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        data-follow-button
        onClick={toggle}
        disabled={pending}
        className={`border-2 border-ink px-4 py-1 text-caption font-bold uppercase disabled:opacity-50 ${
          state === "following"
            ? "bg-ink text-paper hover:bg-red hover:border-red"
            : "hover:bg-blue hover:border-blue hover:text-paper"
        }`}
      >
        {pending ? "…" : state === "following" ? "Following" : "Follow"}
      </button>
      {error ? (
        <span className="text-caption font-bold uppercase text-red">{error}</span>
      ) : null}
    </span>
  );
}
