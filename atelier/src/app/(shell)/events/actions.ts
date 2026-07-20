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

export interface OrganizerResult {
  ok: boolean;
  error?: string;
}

/**
 * Organizer confirms (or un-confirms) an attendee — the manual ticket check.
 * A confirmed, non-blocked attendee may post a Hero tied to this event. Only the
 * event owner (or the manager of the institution running it) may do this; RLS
 * enforces it too, but we check first for a clean message and to notify.
 */
export async function confirmAttendee(
  eventId: string,
  profileId: string,
  confirm: boolean,
): Promise<OrganizerResult> {
  const supabase = await createServerSupabase();
  if (!supabase) return { ok: false, error: "Unavailable." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in." };

  const { data: owns } = await supabase.rpc("is_event_owner", { uid: user.id, ev: eventId });
  if (!owns) return { ok: false, error: "Only the organizer can confirm attendees." };

  const { error } = await supabase
    .from("event_participants")
    .update({
      confirmed_at: confirm ? new Date().toISOString() : null,
      confirmed_by: confirm ? user.id : null,
    })
    .eq("event_id", eventId)
    .eq("profile_id", profileId);
  if (error) return { ok: false, error: error.message };

  if (confirm) {
    await notify(supabase, {
      actorId: user.id,
      recipientId: profileId,
      type: "event_confirmed",
      subjectType: "event",
      subjectId: eventId,
    });
  }
  revalidatePath(`/e/${eventId}`);
  return { ok: true };
}

/**
 * Organizer blocks (or unblocks) an attendee from tying Heroes to this event.
 * Anti-abuse: stops someone riding the event's name. A block overrides any
 * confirmation. Owner-only (+ RLS). Silent — no notification.
 */
export async function blockAttendee(
  eventId: string,
  profileId: string,
  block: boolean,
): Promise<OrganizerResult> {
  const supabase = await createServerSupabase();
  if (!supabase) return { ok: false, error: "Unavailable." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in." };

  const { data: owns } = await supabase.rpc("is_event_owner", { uid: user.id, ev: eventId });
  if (!owns) return { ok: false, error: "Only the organizer can block attendees." };

  const { error } = await supabase
    .from("event_participants")
    .update({
      blocked_at: block ? new Date().toISOString() : null,
      blocked_by: block ? user.id : null,
    })
    .eq("event_id", eventId)
    .eq("profile_id", profileId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/e/${eventId}`);
  return { ok: true };
}
