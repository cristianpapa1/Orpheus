"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { notify } from "@/lib/notifications/notify";

export async function addComment(formData: FormData) {
  const postId = String(formData.get("post_id") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, 2000);
  const supabase = await createServerSupabase();
  if (!supabase) redirect(`/p/${postId}`);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!body) redirect(`/p/${postId}`);

  const { error } = await supabase
    .from("post_comments")
    .insert({ post_id: postId, author_id: user.id, body });
  if (!error) {
    const { data: post } = await supabase
      .from("posts")
      .select("author_id")
      .eq("id", postId)
      .maybeSingle();
    if (post) {
      await notify(supabase, {
        actorId: user.id,
        recipientId: post.author_id,
        type: "comment",
        subjectType: "post",
        subjectId: postId,
      });
    }
  }
  revalidatePath(`/p/${postId}`);
  redirect(`/p/${postId}`);
}

export async function deleteComment(formData: FormData) {
  const postId = String(formData.get("post_id") ?? "");
  const id = String(formData.get("id") ?? "");
  const supabase = await createServerSupabase();
  if (!supabase) redirect(`/p/${postId}`);
  // RLS permits the comment's author or an admin.
  await supabase.from("post_comments").delete().eq("id", id);
  revalidatePath(`/p/${postId}`);
  redirect(`/p/${postId}`);
}
