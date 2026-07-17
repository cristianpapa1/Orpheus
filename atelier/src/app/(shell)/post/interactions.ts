"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notifications/notify";
import { getOrCreateThread } from "@/lib/chat/threads";

// A curator's buy link may only point at Astelier — never an arbitrary URL.
const ASTELIER_HOST = process.env.NEXT_PUBLIC_ASTELIER_HOST ?? "astelier.aunflaneur.com";
function cleanAstelierUrl(v: string): string | null {
  try {
    const u = new URL(v.trim());
    return u.protocol === "https:" && u.hostname === ASTELIER_HOST ? u.href : null;
  } catch {
    return null;
  }
}

export interface FavoriteResult {
  ok: boolean;
  favorited: boolean;
  count: number;
  error?: string;
}

/** Toggle the signed-in user's favorite on a post. Defensive: reports the
    feature off if the 0016 table isn't there yet, never throwing. */
export async function toggleFavorite(postId: string): Promise<FavoriteResult> {
  const supabase = await createServerSupabase();
  if (!supabase) return { ok: false, favorited: false, count: 0, error: "Unavailable." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, favorited: false, count: 0, error: "Sign in to favorite." };

  const { data: existing, error: selErr } = await supabase
    .from("post_favorites")
    .select("post_id")
    .eq("post_id", postId)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (selErr) {
    return { ok: false, favorited: false, count: 0, error: "Favorites unavailable." };
  }

  if (existing) {
    await supabase
      .from("post_favorites")
      .delete()
      .eq("post_id", postId)
      .eq("profile_id", user.id);
  } else {
    await supabase
      .from("post_favorites")
      .insert({ post_id: postId, profile_id: user.id });
    // Notify the author that their work was favorited.
    const { data: post } = await supabase
      .from("posts")
      .select("author_id")
      .eq("id", postId)
      .maybeSingle();
    if (post) {
      await notify(supabase, {
        actorId: user.id,
        recipientId: post.author_id,
        type: "favorite",
        subjectType: "post",
        subjectId: postId,
      });
    }
  }

  const { count } = await supabase
    .from("post_favorites")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);

  revalidatePath("/feed");
  revalidatePath("/saved");
  return { ok: true, favorited: !existing, count: count ?? 0 };
}

export interface CurateResult {
  ok: boolean;
  curated: boolean;
  count: number;
  error?: string;
}

/**
 * Toggle a curator's "repost as curated" on a post. Curator-only and non-self —
 * both re-checked in SQL (RLS `is_curator` + author guard), so a non-curator
 * calling this directly just gets an insert error we surface cleanly. Defensive:
 * reports the feature off if the 0027 table isn't there yet.
 */
export async function curatePost(postId: string): Promise<CurateResult> {
  const supabase = await createServerSupabase();
  if (!supabase) return { ok: false, curated: false, count: 0, error: "Unavailable." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, curated: false, count: 0, error: "Sign in to curate." };

  const { data: existing, error: selErr } = await supabase
    .from("post_curations")
    .select("post_id")
    .eq("post_id", postId)
    .eq("curator_id", user.id)
    .maybeSingle();
  if (selErr) {
    return { ok: false, curated: false, count: 0, error: "Curation unavailable." };
  }

  if (existing) {
    await supabase
      .from("post_curations")
      .delete()
      .eq("post_id", postId)
      .eq("curator_id", user.id);
  } else {
    const { error: insErr } = await supabase
      .from("post_curations")
      .insert({ post_id: postId, curator_id: user.id });
    if (insErr) {
      // RLS rejects non-curators, self-reposts, and removed posts.
      return {
        ok: false,
        curated: false,
        count: 0,
        error: "Only curators can repost another maker's live work.",
      };
    }
    const { data: post } = await supabase
      .from("posts")
      .select("author_id")
      .eq("id", postId)
      .maybeSingle();
    if (post) {
      await notify(supabase, {
        actorId: user.id,
        recipientId: post.author_id,
        type: "curated",
        subjectType: "post",
        subjectId: postId,
      });
    }
  }

  const { count } = await supabase
    .from("post_curations")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);

  revalidatePath("/feed");
  revalidatePath(`/p/${postId}`);
  return { ok: true, curated: !existing, count: count ?? 0 };
}

export interface StoreLinkResult {
  ok: boolean;
  storeUrl: string | null;
  error?: string;
}

/**
 * Set (or clear, with "") the Astelier buy link on the viewer's curation of a
 * post — "paste your product/store link so people can follow and buy". Only
 * affects the caller's own curation row (they must have curated it first).
 * Validates the link points at Astelier. Defensive: reports off if the 0028
 * store_url column isn't there yet.
 */
export async function setCurationStoreUrl(
  postId: string,
  rawUrl: string,
): Promise<StoreLinkResult> {
  const supabase = await createServerSupabase();
  if (!supabase) return { ok: false, storeUrl: null, error: "Unavailable." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, storeUrl: null, error: "Sign in." };

  const trimmed = (rawUrl ?? "").trim();
  const url = trimmed ? cleanAstelierUrl(trimmed) : null;
  if (trimmed && !url) {
    return { ok: false, storeUrl: null, error: `Link must be an https://${ASTELIER_HOST} URL.` };
  }

  const { error } = await supabase
    .from("post_curations")
    .update({ store_url: url })
    .eq("post_id", postId)
    .eq("curator_id", user.id);
  if (error) return { ok: false, storeUrl: null, error: "Store link isn't available yet." };

  revalidatePath(`/p/${postId}`);
  revalidatePath("/profile");
  return { ok: true, storeUrl: url };
}

export interface RateResult {
  ok: boolean;
  stars: number; // 0 = cleared
  error?: string;
}

/**
 * Set (1–5) or clear (0) the signed-in user's star rating on a post. Upsert on
 * (profile_id, post_id). Defensive: reports off if the 0027 table is missing.
 */
export async function setRating(postId: string, stars: number): Promise<RateResult> {
  const supabase = await createServerSupabase();
  if (!supabase) return { ok: false, stars: 0, error: "Unavailable." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, stars: 0, error: "Sign in to rate." };

  const clamped = Math.round(stars);
  if (clamped < 0 || clamped > 5) return { ok: false, stars: 0, error: "Rating must be 0–5." };

  if (clamped === 0) {
    const { error } = await supabase
      .from("post_ratings")
      .delete()
      .eq("post_id", postId)
      .eq("profile_id", user.id);
    if (error) return { ok: false, stars: 0, error: "Ratings unavailable." };
  } else {
    const { error } = await supabase.from("post_ratings").upsert(
      {
        profile_id: user.id,
        post_id: postId,
        stars: clamped,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id,post_id" },
    );
    if (error) return { ok: false, stars: 0, error: "Ratings unavailable." };
  }

  revalidatePath("/profile");
  revalidatePath("/saved");
  return { ok: true, stars: clamped };
}

export interface ShareResult {
  ok: boolean;
  error?: string;
  /** The chat thread the post was dropped into (for redirect). */
  threadId?: string;
}

/**
 * Send a post to someone the sender FOLLOWS, as a chat message with the post
 * link. Get-or-creates the thread, posts the message, and returns the thread
 * id so the client can jump straight into the conversation.
 */
export async function sharePost(
  postId: string,
  targetId: string,
): Promise<ShareResult> {
  const supabase = await createServerSupabase();
  if (!supabase) return { ok: false, error: "Unavailable." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to send." };
  if (targetId === user.id) return { ok: false, error: "Can't send to yourself." };

  // You can send to anyone you follow.
  const { data: iFollow } = await supabase
    .from("follows")
    .select("followee_id")
    .eq("follower_id", user.id)
    .eq("followee_id", targetId)
    .maybeSingle();
  if (!iFollow) {
    return { ok: false, error: "You can only send to people you follow." };
  }

  // Confirm the post exists (and grab a caption for the message).
  const { data: post } = await supabase
    .from("posts")
    .select("id, caption")
    .eq("id", postId)
    .maybeSingle();
  if (!post) return { ok: false, error: "Post not found." };

  // Get-or-create the thread (a non-mutual first contact becomes a request).
  const { threadId, error: threadErr } = await getOrCreateThread(
    supabase,
    user.id,
    targetId,
  );
  if (threadErr || !threadId) {
    return { ok: false, error: "Couldn't start a conversation." };
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://atelier.aunflaneur.com";
  const label = post.caption ? `"${post.caption}"` : "a post";
  const { error: msgErr } = await supabase.from("chat_messages").insert({
    thread_id: threadId,
    sender_id: user.id,
    body: `Shared ${label}: ${site}/p/${post.id}`,
  });
  if (msgErr) return { ok: false, error: "Couldn't send the message." };

  revalidatePath(`/chat/${threadId}`);
  return { ok: true, threadId };
}

export interface DeleteResult {
  ok: boolean;
  error?: string;
}

/**
 * Delete the signed-in user's OWN post. Soft-delete (removed_at) — it vanishes
 * from every feed/profile immediately but stays recoverable by an admin, same
 * mechanism as moderation takedown. Author-only, enforced server-side.
 */
export async function deleteOwnPost(postId: string): Promise<DeleteResult> {
  const supabase = await createServerSupabase();
  if (!supabase) return { ok: false, error: "Unavailable." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to delete." };

  const { data: post } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", postId)
    .maybeSingle();
  if (!post) return { ok: false, error: "Post not found." };
  if (post.author_id !== user.id) return { ok: false, error: "That isn't your post." };

  const admin = createServiceClient();
  if (!admin) return { ok: false, error: "Unavailable." };
  const { error } = await admin
    .from("posts")
    .update({ removed_at: new Date().toISOString(), removed_by: user.id })
    .eq("id", postId);
  if (error) return { ok: false, error: "Couldn't delete the post." };

  revalidatePath("/feed");
  revalidatePath("/profile");
  return { ok: true };
}
