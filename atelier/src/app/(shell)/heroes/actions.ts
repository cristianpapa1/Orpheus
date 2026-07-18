"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { moderatePost } from "@/lib/moderation/ai";
import { publicMediaUrl } from "@/lib/posts/queries";
import { HERO_CAPTION_MAX, validHeroDuration } from "@atelier/core/heroes/types";

export interface PublishHeroInput {
  /** Storage path of the uploaded video (caller's folder). */
  media_path: string;
  /** Storage path of the poster frame (caller's folder). */
  poster_path?: string | null;
  width?: number | null;
  height?: number | null;
  duration_seconds: number;
  caption?: string;
  alt_text?: string;
  /** Optional event to tie this Hero to. */
  event_id?: string | null;
}

export interface PublishHeroResult {
  ok: boolean;
  error?: string;
}

/**
 * Record a Hero whose video the client uploaded DIRECTLY to storage (server
 * actions have a 1MB body limit). Any signed-in member may post — Heroes is the
 * open surface — but the video path must live in the caller's own folder, and
 * the poster + caption pass the same fail-open Claude moderation as posts.
 */
export async function publishHero(input: PublishHeroInput): Promise<PublishHeroResult> {
  const supabase = await createServerSupabase();
  if (!supabase) return { ok: false, error: "Preview mode — posting is disabled." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to post a Hero." };

  const caption = String(input.caption ?? "").trim().slice(0, HERO_CAPTION_MAX);
  const duration = Math.round(Number(input.duration_seconds) || 0);
  if (!validHeroDuration(duration)) {
    return { ok: false, error: "Heroes are capped at 90 seconds — keep it short." };
  }

  const ownFolder = `${user.id}/`;
  const paths = [input.media_path, ...(input.poster_path ? [input.poster_path] : [])];
  if (
    !input.media_path ||
    paths.some((p) => typeof p !== "string" || !p.startsWith(ownFolder) || p.includes(".."))
  ) {
    return { ok: false, error: "Invalid media path." };
  }

  // Optional event link — must reference a real event (RLS keeps events public-read).
  let event_id: string | null = null;
  if (input.event_id) {
    const { data: ev } = await supabase
      .from("events")
      .select("id")
      .eq("id", input.event_id)
      .maybeSingle();
    event_id = ev?.id ?? null;
  }

  // Rate limit: ≤20 Heroes per hour.
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { count: recent } = await supabase
    .from("heroes")
    .select("*", { count: "exact", head: true })
    .eq("author_id", user.id)
    .gte("created_at", hourAgo);
  if ((recent ?? 0) >= 20) {
    return { ok: false, error: "Rate limit: max 20 Heroes per hour." };
  }

  // Moderation (poster + caption), fail-open. A hard reject blocks publishing;
  // borderline "flag" clips publish and simply vanish in 24h (nothing to queue).
  const moderation = await moderatePost({
    imageUrl: input.poster_path ? publicMediaUrl(input.poster_path) : null,
    caption,
  });
  if (moderation.decision === "reject") {
    return {
      ok: false,
      error: `This didn't pass moderation: ${moderation.reason || "content not allowed here"}.`,
    };
  }

  const { error } = await supabase.from("heroes").insert({
    author_id: user.id,
    media_path: input.media_path,
    poster_path: input.poster_path ?? null,
    width: input.width ?? null,
    height: input.height ?? null,
    duration_seconds: duration,
    caption,
    alt_text: String(input.alt_text ?? "").trim().slice(0, 300) || null,
    event_id,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/heroes");
  redirect("/heroes");
}

export interface HeroFavoriteResult {
  ok: boolean;
  favorited: boolean;
  count: number;
  error?: string;
}

/** Toggle the viewer's like on a Hero. */
export async function toggleHeroFavorite(heroId: string): Promise<HeroFavoriteResult> {
  const supabase = await createServerSupabase();
  if (!supabase) return { ok: false, favorited: false, count: 0, error: "Unavailable." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, favorited: false, count: 0, error: "Sign in to like." };

  const { data: existing, error: selErr } = await supabase
    .from("hero_favorites")
    .select("hero_id")
    .eq("hero_id", heroId)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (selErr) return { ok: false, favorited: false, count: 0, error: "Likes unavailable." };

  if (existing) {
    await supabase.from("hero_favorites").delete().eq("hero_id", heroId).eq("profile_id", user.id);
  } else {
    await supabase.from("hero_favorites").insert({ hero_id: heroId, profile_id: user.id });
  }
  const { count } = await supabase
    .from("hero_favorites")
    .select("*", { count: "exact", head: true })
    .eq("hero_id", heroId);
  return { ok: true, favorited: !existing, count: count ?? 0 };
}

/** Record that the viewer watched a Hero (idempotent per viewer). Best-effort. */
export async function recordHeroView(heroId: string): Promise<void> {
  const supabase = await createServerSupabase();
  if (!supabase) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("hero_views")
    .upsert({ hero_id: heroId, viewer_id: user.id }, { onConflict: "hero_id,viewer_id", ignoreDuplicates: true });
}

export interface DeleteHeroResult {
  ok: boolean;
  error?: string;
}

/** Delete a Hero early (RLS permits the author or an admin). */
export async function deleteHero(heroId: string): Promise<DeleteHeroResult> {
  const supabase = await createServerSupabase();
  if (!supabase) return { ok: false, error: "Unavailable." };
  const { error } = await supabase.from("heroes").delete().eq("id", heroId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/heroes");
  return { ok: true };
}
