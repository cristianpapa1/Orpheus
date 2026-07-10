"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { parseDisplay } from "@atelier/core/posts/display";
import {
  isMediaType,
  isPostCategory,
  validDuration,
} from "@atelier/core/posts/types";

const MAX_BLUR_CHARS = 6000; // matches the DB check constraint

export interface PublishPostInput {
  caption: string;
  category: string;
  display: unknown;
  /** Storage path of the untouched original (nullable). */
  original_path: string | null;
  /** Storage paths of the display variants, ascending width. */
  variants: { width: number; height: number; path: string }[];
  /** Largest display variant — kept as the post's primary image. */
  image_path: string;
  width: number | null;
  height: number | null;
  blur_data: string | null;
  /** Author-written alt text for accessibility. */
  alt_text?: string;
  /** Track B: image (default) | video | audio. */
  media_type?: string;
  /** Storage path of the AV file (caller's folder; null for images). */
  media_path?: string | null;
  duration_seconds?: number | null;
  /** Groups to tag this post into — caller must be a MEMBER of each. */
  group_ids?: string[];
}

export interface PublishPostResult {
  ok: boolean;
  error?: string;
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

  // Track B: media type + duration validation.
  const media_type = isMediaType(input.media_type) ? input.media_type : "image";
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
  const paths = [
    input.image_path,
    ...(input.original_path ? [input.original_path] : []),
    ...(media_path ? [media_path] : []),
    ...input.variants.map((v) => v.path),
  ];
  if (paths.length === 0 || !input.image_path) {
    return { ok: false, error: "Upload an image first." };
  }
  if (paths.some((p) => typeof p !== "string" || !p.startsWith(ownFolder) || p.includes(".."))) {
    return { ok: false, error: "Invalid media path." };
  }

  const caption = String(input.caption ?? "").trim().slice(0, 1000);
  const category = String(input.category ?? "");
  if (!isPostCategory(category)) return { ok: false, error: "Pick a category." };

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

  const display = parseDisplay(input.display);

  let blur_data: string | null = null;
  if (typeof input.blur_data === "string" && input.blur_data.startsWith("data:image/")) {
    blur_data = input.blur_data.slice(0, MAX_BLUR_CHARS);
  }

  const variants = input.variants
    .filter((v) => typeof v.width === "number" && v.width > 0)
    .map((v) => ({ width: Math.round(v.width), path: v.path }));

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
      image_path: input.image_path,
      image_width: input.width,
      image_height: input.height,
      original_path: input.original_path,
      variants,
      blur_data,
      alt_text: String(input.alt_text ?? "").trim().slice(0, 300) || null,
      media_type,
      media_path,
      duration_seconds: duration,
      display,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Publish failed." };

  if (groupIds.length > 0) {
    await supabase
      .from("post_groups")
      .insert(groupIds.map((group_id) => ({ post_id: data.id, group_id })));
  }

  revalidatePath("/feed");
  redirect(`/p/${data.id}`);
}
