"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { notify } from "@/lib/notifications/notify";

export interface ParticipationResult {
  ok: boolean;
  going: boolean;
  count: number;
  error?: string;
}

/** Toggle the viewer's "I'm going" on an event. */
export async function toggleEventParticipation(eventId: string): Promise<ParticipationResult> {
  const supabase = await createServerSupabase();
  if (!supabase) return { ok: false, going: false, count: 0, error: "Unavailable." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, going: false, count: 0, error: "Sign in to join." };

  const { data: existing, error: selErr } = await supabase
    .from("event_participants")
    .select("event_id")
    .eq("event_id", eventId)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (selErr) return { ok: false, going: false, count: 0, error: "Unavailable." };

  if (existing) {
    await supabase.from("event_participants").delete().eq("event_id", eventId).eq("profile_id", user.id);
  } else {
    await supabase.from("event_participants").insert({ event_id: eventId, profile_id: user.id });
    // Tell the event's owner (best-effort; notify() no-ops if it's yourself).
    const { data: ev } = await supabase.from("events").select("profile_id").eq("id", eventId).maybeSingle();
    if (ev) {
      await notify(supabase, {
        actorId: user.id,
        recipientId: ev.profile_id,
        type: "event_join",
        subjectType: "event",
        subjectId: eventId,
      });
    }
  }
  const { count } = await supabase
    .from("event_participants")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);
  revalidatePath(`/e/${eventId}`);
  return { ok: true, going: !existing, count: count ?? 0 };
}

/** Record that the viewer looked at an event (idempotent per viewer). */
export async function recordEventView(eventId: string): Promise<void> {
  const supabase = await createServerSupabase();
  if (!supabase) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("event_views")
    .upsert({ event_id: eventId, viewer_id: user.id }, { onConflict: "event_id,viewer_id", ignoreDuplicates: true });
}
