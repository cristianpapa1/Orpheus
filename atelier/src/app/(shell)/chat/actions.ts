"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";

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

  // Find existing thread (ordered by the trigger).
  const a = user.id < other.id ? user.id : other.id;
  const b = user.id < other.id ? other.id : user.id;

  const { data: existing } = await supabase
    .from("chat_threads")
    .select("id")
    .eq("participant_a", a)
    .eq("participant_b", b)
    .maybeSingle();

  if (existing) return { ok: true, threadId: existing.id };

  const { data: thread, error } = await supabase
    .from("chat_threads")
    .insert({ participant_a: user.id, participant_b: other.id })
    .select("id")
    .single();

  if (error || !thread) return { ok: false, error: "Couldn't start conversation." };

  return { ok: true, threadId: thread.id };
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

  const a = user.id < other.id ? user.id : other.id;
  const b = user.id < other.id ? other.id : user.id;

  const { data: existing } = await supabase
    .from("chat_threads")
    .select("id")
    .eq("participant_a", a)
    .eq("participant_b", b)
    .maybeSingle();

  if (existing) redirect(`/chat/${existing.id}`);

  const { data: thread } = await supabase
    .from("chat_threads")
    .insert({ participant_a: user.id, participant_b: other.id })
    .select("id")
    .single();

  if (!thread) redirect(`/u/${handle}?error=chat`);
  redirect(`/chat/${thread.id}`);
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
