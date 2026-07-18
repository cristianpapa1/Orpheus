import { createServerSupabase } from "@/lib/supabase/server";
import type { NotificationType } from "./notify";

/** Unread notification count for the nav bell. Defensive: 0 on error / signed out. */
export async function getUnreadCount(): Promise<number> {
  const supabase = await createServerSupabase();
  if (!supabase) return 0;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .is("read_at", null);
  return error ? 0 : (count ?? 0);
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  subject_type: "post" | "profile" | "hero" | "event";
  subject_id: string | null;
  read_at: string | null;
  created_at: string;
  actor_handle: string;
  actor_name: string;
}

/** The viewer's notifications, newest first. Defensive: [] pre-migration. */
export async function getNotifications(limit = 50): Promise<NotificationItem[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // notifications has TWO FKs to profiles (recipient, actor) — pin the actor one.
  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, type, subject_type, subject_id, read_at, created_at, actor:profiles!notifications_actor_id_fkey(handle, display_name)",
    )
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];

  return (data as unknown as {
    id: string;
    type: NotificationType;
    subject_type: "post" | "profile" | "hero" | "event";
    subject_id: string | null;
    read_at: string | null;
    created_at: string;
    actor: { handle: string | null; display_name: string | null } | null;
  }[]).map((n) => ({
    id: n.id,
    type: n.type,
    subject_type: n.subject_type,
    subject_id: n.subject_id,
    read_at: n.read_at,
    created_at: n.created_at,
    actor_handle: n.actor?.handle ?? "",
    actor_name: n.actor?.display_name ?? n.actor?.handle ?? "Someone",
  }));
}
