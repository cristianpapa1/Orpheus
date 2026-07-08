"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { isPostCategory } from "@/lib/posts/types";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // client downscales first; hard cap here

const EXT: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
};

/**
 * Publish a post: upload the (client-downscaled) display image to the
 * media bucket under the author's folder, then insert the posts row.
 * Everything is re-validated server-side.
 */
export async function createPost(formData: FormData): Promise<{
  ok: boolean;
  error?: string;
}> {
  const supabase = await createServerSupabase();
  if (!supabase) return { ok: false, error: "Preview mode — publishing is disabled." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to publish." };

  const caption = String(formData.get("caption") ?? "")
    .trim()
    .slice(0, 1000);
  const category = String(formData.get("category") ?? "");
  if (!isPostCategory(category)) {
    return { ok: false, error: "Pick a category." };
  }

  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return { ok: false, error: "Choose an image." };
  }
  if (!EXT[image.type]) {
    return { ok: false, error: "Unsupported image type." };
  }
  if (image.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "Image is too large (8 MB max)." };
  }

  const width = Number(formData.get("width")) || null;
  const height = Number(formData.get("height")) || null;

  const path = `${user.id}/${crypto.randomUUID()}.${EXT[image.type]}`;
  const { error: uploadError } = await supabase.storage
    .from("media")
    .upload(path, image, { contentType: image.type });
  if (uploadError) return { ok: false, error: uploadError.message };

  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      caption,
      category,
      image_path: path,
      image_width: width,
      image_height: height,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Publish failed." };

  revalidatePath("/feed");
  redirect(`/p/${data.id}`);
}
