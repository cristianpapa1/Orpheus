"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { parseDisplay } from "@atelier/core/posts/display";
import {
  MAX_BODY_CHARS,
  isMediaType,
  isPostCategory,
  isValidSubcategory,
  parsePostTags,
  validDuration,
} from "@atelier/core/posts/types";
import { moderatePost } from "@/lib/moderation/ai";
import { publicMediaUrl } from "@/lib/posts/queries";
import { notify } from "@/lib/notifications/notify";

const MAX_BLUR_CHARS = 6000; // matches the DB check constraint

export interface PublishPostInput {
  caption: string;
  category: string;
  /** Optional style within the category (e.g. music → jazz). */
  subcategory?: string | null;
  display: unknown;
  /** Text posts (media_type 'text') carry their work here — a poem/paragraph. */
  body?: string;
  /** Free-form topic tags ("#woodfired, ceramics" or already-split). */
  tags?: string;
  /** Storage path of the untouched original (nullable). */
  original_path?: string | null;
  /** Storage paths of the display variants, ascending width. */
  variants?: { width: number; height: number; path: string }[];
  /** Largest display variant — kept as the post's primary image. */
  image_path?: string;
  width?: number | null;
  height?: number | null;
  blur_data?: string | null;
  /** Author-written alt text for accessibility. */
  alt_text?: string;
  /** Track B: image (default) | video | audio. */
  media_type?: string;
  /** Storage path of the AV file (caller's folder; null for images). */
  media_path?: string | null;
  duration_seconds?: number | null;
  /** Groups to tag this post into — caller must be a MEMBER of each. */
  group_ids?: string[];
  /** People to tag — caller must MUTUALLY follow each (both directions). */
  mention_ids?: string[];
  /** Optional Astelier store/product URL — powers the Act "Checkout at Astelier". */
  checkout_url?: string | null;
}

export interface PublishPostResult {
  ok: boolean;
  error?: string;
}

// The checkout link may only point at Astelier — never an arbitrary URL. Keeps
// the "Checkout at Astelier" button honest and un-abusable.
const ASTELIER_HOST =
  process.env.NEXT_PUBLIC_ASTELIER_HOST ?? "astelier.aunflaneur.com";
function cleanCheckoutUrl(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim()) return null;
  try {
    const u = new URL(v.trim());
    return u.protocol === "https:" && u.hostname === ASTELIER_HOST ? u.href : null;
  } catch {
    return null;
  }
}

/**
 * Record a post whose media the client already uploaded DIRECTLY to storage
 * (server actions have a 1MB body limit — originals never pass through here).
 * Ownership guard: every referenced path must live inside the caller's own
 * folder, so nobody can publish someone else's files as their work.
 */
export async function publishPost(
  input: PublishPostInput,
): Promise<PublishPostResult> {
  const supabase = await createServerSupabase();
  if (!supabase) return { ok: false, error: "Preview mode — publishing is disabled." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to publish." };

  const media_type = isMediaType(input.media_type) ? input.media_type : "image";

  // Shared metadata (every post kind).
  const caption = String(input.caption ?? "").trim().slice(0, 1000);
  const category = String(input.category ?? "");
  if (!isPostCategory(category)) return { ok: false, error: "Pick a category." };
  const rawSub = input.subcategory ? String(input.subcategory) : null;
  if (!isValidSubcategory(category, rawSub)) {
    return { ok: false, error: "That style doesn't belong to this category." };
  }
  const subcategory = rawSub || null;

  // Per-kind payload + what the moderator sees.
  const display = parseDisplay(input.display);
  let payload: Record<string, unknown>;
  let moderationImageUrl: string | null = null;
  let moderationBody: string | undefined;

  if (media_type === "text") {
    const body = String(input.body ?? "").trim().slice(0, MAX_BODY_CHARS);
    if (!body) return { ok: false, error: "Write something to publish." };
    moderationBody = body;
    payload = {
      image_path: null,
      image_width: null,
      image_height: null,
      original_path: null,
      variants: [],
      blur_data: null,
      alt_text: null,
      media_type: "text",
      media_path: null,
      duration_seconds: null,
      body,
    };
  } else {
    const duration =
      media_type === "image"
        ? null
        : Math.round(Number(input.duration_seconds) || 0) || null;
    if (!validDuration(media_type, duration)) {
      return {
        ok: false,
        error:
          media_type === "video"
            ? "Videos are capped at 2 minutes."
            : "Audio is capped at 5 minutes.",
      };
    }
    const media_path = media_type === "image" ? null : input.media_path;
    if (media_type !== "image" && !media_path) {
      return { ok: false, error: "Upload the media file first." };
    }

    const ownFolder = `${user.id}/`;
    const variantList = input.variants ?? [];
    const paths = [
      input.image_path,
      ...(input.original_path ? [input.original_path] : []),
      ...(media_path ? [media_path] : []),
      ...variantList.map((v) => v.path),
    ];
    if (!input.image_path) {
      return { ok: false, error: "Upload an image first." };
    }
    if (paths.some((p) => typeof p !== "string" || !p.startsWith(ownFolder) || p.includes(".."))) {
      return { ok: false, error: "Invalid media path." };
    }

    let blur_data: string | null = null;
    if (typeof input.blur_data === "string" && input.blur_data.startsWith("data:image/")) {
      blur_data = input.blur_data.slice(0, MAX_BLUR_CHARS);
    }
    const variants = variantList
      .filter((v) => typeof v.width === "number" && v.width > 0)
      .map((v) => ({ width: Math.round(v.width), path: v.path }));

    moderationImageUrl = publicMediaUrl(input.image_path);
    payload = {
      image_path: input.image_path,
      image_width: input.width ?? null,
      image_height: input.height ?? null,
      original_path: input.original_path ?? null,
      variants,
      blur_data,
      alt_text: String(input.alt_text ?? "").trim().slice(0, 300) || null,
      media_type,
      media_path,
      duration_seconds: duration,
      body: null,
    };
  }

  // Rate limit: ≤20 posts per hour (advisory basics; see LAUNCH.md).
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { count: recentPosts } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("author_id", user.id)
    .gte("created_at", hourAgo);
  if ((recentPosts ?? 0) >= 20) {
    return { ok: false, error: "Rate limit: max 20 posts per hour." };
  }

  // AI moderation (fail-open). A hard reject blocks publishing; a flag lets
  // the work through but files a report for a human to review.
  const moderation = await moderatePost({
    imageUrl: moderationImageUrl,
    caption,
    category,
    subcategory,
    body: moderationBody,
  });
  if (moderation.decision === "reject") {
    return {
      ok: false,
      error: `This didn't pass moderation: ${moderation.reason || "content not allowed here"}.`,
    };
  }

  // Group tagging guard: only groups where the author is a MEMBER
  // (followers can't tag — RLS enforces this a second time).
  const groupIds = [...new Set(input.group_ids ?? [])];
  if (groupIds.length > 0) {
    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("profile_id", user.id)
      .in("group_id", groupIds);
    if ((memberships ?? []).length !== groupIds.length) {
      return { ok: false, error: "You can only tag groups you're a member of." };
    }
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      caption,
      category,
      subcategory,
      display,
      tags: parsePostTags(input.tags),
      checkout_url: cleanCheckoutUrl(input.checkout_url),
      ...payload,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Publish failed." };

  // A flagged (but not rejected) post is published, then queued for review.
  if (moderation.decision === "flag") {
    await supabase.from("reports").insert({
      reporter_id: user.id,
      subject_type: "post",
      subject_id: data.id,
      reason: "other",
      detail: `Auto-flagged by AI moderation: ${moderation.reason}`.slice(0, 600),
    });
  }

  if (groupIds.length > 0) {
    await supabase
      .from("post_groups")
      .insert(groupIds.map((group_id) => ({ post_id: data.id, group_id })));
  }

  // Mentions: only people the author MUTUALLY follows (both directions).
  // RLS re-checks the mutual-follow rule; we filter here for a clean UX.
  const mentionIds = [...new Set(input.mention_ids ?? [])].filter(
    (id) => id !== user.id,
  );
  if (mentionIds.length > 0) {
    const [{ data: iFollow }, { data: followMe }] = await Promise.all([
      supabase
        .from("follows")
        .select("followee_id")
        .eq("follower_id", user.id)
        .in("followee_id", mentionIds),
      supabase
        .from("follows")
        .select("follower_id")
        .eq("followee_id", user.id)
        .in("follower_id", mentionIds),
    ]);
    const iFollowSet = new Set((iFollow ?? []).map((r) => r.followee_id));
    const followMeSet = new Set((followMe ?? []).map((r) => r.follower_id));
    const mutual = mentionIds.filter(
      (id) => iFollowSet.has(id) && followMeSet.has(id),
    );
    if (mutual.length > 0) {
      await supabase
        .from("post_mentions")
        .insert(mutual.map((mentioned_id) => ({ post_id: data.id, mentioned_id })));
      for (const mentioned_id of mutual) {
        await notify(supabase, {
          actorId: user.id,
          recipientId: mentioned_id,
          type: "mention",
          subjectType: "post",
          subjectId: data.id,
        });
      }
    }
  }

  revalidatePath("/feed");
  redirect(`/p/${data.id}`);
}
