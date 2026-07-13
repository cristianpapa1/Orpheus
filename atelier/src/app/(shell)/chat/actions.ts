"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { getOrCreateThread } from "@/lib/chat/threads";

async function requireUser() {
  const supabase = await createServerSupabase();
  if (!supabase) return { supabase: null, user: null } as const;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user } as const;
}

export async function startOrGetThread(
  otherHandle: string,
): Promise<{ ok: boolean; threadId?: string; error?: string }> {
  const { supabase, user } = await requireUser();
  if (!supabase || !user) return { ok: false, error: "Sign in to message." };

  const { data: other } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", otherHandle)
    .maybeSingle();
  if (!other) return { ok: false, error: "User not found." };
  if (other.id === user.id) return { ok: false, error: "Can't message yourself." };

  const { threadId, error } = await getOrCreateThread(supabase, user.id, other.id);
  if (error || !threadId) return { ok: false, error: "Couldn't start conversation." };
  return { ok: true, threadId };
}

export async function startChatAndRedirect(formData: FormData) {
  const handle = String(formData.get("handle") ?? "").trim().toLowerCase();
  if (!handle) return;
  const { supabase, user } = await requireUser();
  if (!supabase || !user) redirect(`/u/${handle}?error=unavailable`);

  const { data: other } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", handle)
    .maybeSingle();
  if (!other) redirect(`/u/${handle}?error=no-such-user`);
  if (other.id === user.id) redirect(`/u/${handle}?error=self`);

  const { threadId, error } = await getOrCreateThread(supabase, user.id, other.id);
  if (error || !threadId) redirect(`/u/${handle}?error=chat`);
  redirect(`/chat/${threadId}`);
}

/** Recipient accepts a contact request — the thread joins their main Messages. */
export async function acceptRequest(formData: FormData) {
  const threadId = String(formData.get("thread_id") ?? "");
  const { supabase, user } = await requireUser();
  if (!supabase || !user) redirect("/chat");

  const { data: t } = await supabase
    .from("chat_threads")
    .select("requested_by")
    .eq("id", threadId)
    .maybeSingle();
  // Only the recipient (not the initiator) accepts.
  if (t && t.requested_by !== user.id) {
    await supabase
      .from("chat_threads")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", threadId);
  }
  revalidatePath("/chat");
  revalidatePath(`/chat/${threadId}`);
  redirect(`/chat/${threadId}`);
}

/** Recipient dismisses a contact request — the thread is removed. */
export async function dismissRequest(formData: FormData) {
  const threadId = String(formData.get("thread_id") ?? "");
  const { supabase, user } = await requireUser();
  if (!supabase || !user) redirect("/chat");
  await supabase.from("chat_threads").delete().eq("id", threadId);
  revalidatePath("/chat");
  redirect("/chat");
}

export async function sendMessage(formData: FormData) {
  const { supabase, user } = await requireUser();
  if (!supabase || !user) return;

  const threadId = String(formData.get("thread_id") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, 2000);
  if (!threadId || !body) return;

  // Rate limit: ≤120 messages per hour (advisory basics; see LAUNCH.md).
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { count: recent } = await supabase
    .from("chat_messages")
    .select("*", { count: "exact", head: true })
    .eq("sender_id", user.id)
    .gte("created_at", hourAgo);
  if ((recent ?? 0) >= 120) return;

  // RLS checks participant access.
  await supabase.from("chat_messages").insert({
    thread_id: threadId,
    sender_id: user.id,
    body,
  });

  revalidatePath(`/chat/${threadId}`);
}
