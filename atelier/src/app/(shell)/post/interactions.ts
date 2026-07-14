"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { notify } from "@/lib/notifications/notify";
import { getOrCreateThread } from "@/lib/chat/threads";

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

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aunflaneur.com";
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
