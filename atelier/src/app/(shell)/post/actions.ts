"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { parseDisplay } from "@/lib/posts/display";
import { isPostCategory } from "@/lib/posts/types";

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

  const ownFolder = `${user.id}/`;
  const paths = [
    input.image_path,
    ...(input.original_path ? [input.original_path] : []),
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

  const display = parseDisplay(input.display);

  let blur_data: string | null = null;
  if (typeof input.blur_data === "string" && input.blur_data.startsWith("data:image/")) {
    blur_data = input.blur_data.slice(0, MAX_BLUR_CHARS);
  }

  const variants = input.variants
    .filter((v) => typeof v.width === "number" && v.width > 0)
    .map((v) => ({ width: Math.round(v.width), path: v.path }));

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
      display,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Publish failed." };

  revalidatePath("/feed");
  redirect(`/p/${data.id}`);
}
