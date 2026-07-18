import "server-only";
import type { createServerSupabase } from "@/lib/supabase/server";

type Supa = NonNullable<Awaited<ReturnType<typeof createServerSupabase>>>;

export type NotificationType =
  | "favorite"
  | "share"
  | "mention"
  | "comment"
  | "claim_approved"
  | "follow"
  | "quality_stamp"
  | "creator_approved"
  | "creator_rejected"
  | "curated"
  | "hero_like"
  | "event_join";

/**
 * Best-effort notification insert. No-op when notifying yourself, and silently
 * tolerant if the 0017 table isn't there yet — a notification never blocks the
 * action that triggered it.
 */
export async function notify(
  supabase: Supa,
  n: {
    actorId: string;
    recipientId: string;
    type: NotificationType;
    subjectType?: "post" | "profile" | "hero" | "event";
    subjectId?: string | null;
  },
): Promise<void> {
  if (!n.recipientId || n.recipientId === n.actorId) return;
  try {
    await supabase.from("notifications").insert({
      recipient_id: n.recipientId,
      actor_id: n.actorId,
      type: n.type,
      subject_type: n.subjectType ?? "post",
      subject_id: n.subjectId ?? null,
    });
  } catch {
    // best-effort — ignore
  }
}
