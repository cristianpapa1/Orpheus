import { createServerSupabase } from "@/lib/supabase/server";
import { DEMO_THREADS, DEMO_MESSAGES } from "./demo";
import type { ChatThread, ChatMessage } from "./types";

type ThreadRow = {
  id: string;
  participant_a: string;
  participant_b: string;
  created_at: string;
};

function resolveThread(
  row: ThreadRow,
  viewerId: string,
  otherProfile: { handle: string | null; display_name: string | null } | null,
  lastMessage: string | null,
  lastMessageAt: string | null,
): ChatThread {
  const isA = row.participant_a === viewerId;
  return {
    id: row.id,
    participant_a: row.participant_a,
    participant_b: row.participant_b,
    other_id: isA ? row.participant_b : row.participant_a,
    other_handle: otherProfile?.handle ?? "",
    other_name: otherProfile?.display_name ?? otherProfile?.handle ?? "Unknown",
    last_message: lastMessage,
    last_message_at: lastMessageAt,
    created_at: row.created_at,
  };
}

export async function getChatThreads(): Promise<ChatThread[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return DEMO_THREADS;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: threads } = await supabase
    .from("chat_threads")
    .select("id, participant_a, participant_b, created_at")
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (!threads) return [];

  const results: ChatThread[] = [];
  for (const t of threads as ThreadRow[]) {
    const otherId = t.participant_a === user.id ? t.participant_b : t.participant_a;
    const { data: other } = await supabase
      .from("profiles")
      .select("handle, display_name")
      .eq("id", otherId)
      .maybeSingle();

    const { data: lastMsg } = await supabase
      .from("chat_messages")
      .select("body, created_at")
      .eq("thread_id", t.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    results.push(
      resolveThread(
        t,
        user.id,
        other,
        lastMsg?.body ?? null,
        lastMsg?.created_at ?? null,
      ),
    );
  }

  return results;
}

export async function getThreadMessages(
  threadId: string,
): Promise<{ thread: ChatThread | null; messages: ChatMessage[] }> {
  const supabase = await createServerSupabase();
  if (!supabase) {
    const thread = DEMO_THREADS.find((t) => t.id === threadId) ?? null;
    return { thread, messages: DEMO_MESSAGES[threadId] ?? [] };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { thread: null, messages: [] };

  const { data: t } = await supabase
    .from("chat_threads")
    .select("id, participant_a, participant_b, created_at")
    .eq("id", threadId)
    .maybeSingle();

  if (!t) return { thread: null, messages: [] };

  const isA = t.participant_a === user.id;
  const otherId = isA ? t.participant_b : t.participant_a;

  const { data: other } = await supabase
    .from("profiles")
    .select("handle, display_name")
    .eq("id", otherId)
    .maybeSingle();

  const { data: lastMsg } = await supabase
    .from("chat_messages")
    .select("body, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const thread = resolveThread(
    t as ThreadRow,
    user.id,
    other,
    lastMsg?.body ?? null,
    lastMsg?.created_at ?? null,
  );

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  return {
    thread,
    messages: (messages ?? []) as ChatMessage[],
  };
}

export async function findThreadWithUser(
  userId: string,
): Promise<string | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id === userId) return null;

  const a = user.id < userId ? user.id : userId;
  const b = user.id < userId ? userId : user.id;

  const { data } = await supabase
    .from("chat_threads")
    .select("id")
    .eq("participant_a", a)
    .eq("participant_b", b)
    .maybeSingle();

  return data?.id ?? null;
}
