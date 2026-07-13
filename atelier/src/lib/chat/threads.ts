import "server-only";
import type { createServerSupabase } from "@/lib/supabase/server";

type Supa = NonNullable<Awaited<ReturnType<typeof createServerSupabase>>>;

/**
 * Get-or-create the 1:1 thread between two users. A NEW thread between people
 * who don't MUTUALLY follow is created as a contact request (requested_by =
 * initiator, accepted_at = null); a mutual pair is accepted immediately.
 * Defensive: if the 0020 columns aren't there yet, falls back to a plain thread.
 */
export async function getOrCreateThread(
  supabase: Supa,
  userId: string,
  otherId: string,
): Promise<{ threadId?: string; error?: string }> {
  if (!otherId || otherId === userId) return { error: "self" };

  const a = userId < otherId ? userId : otherId;
  const b = userId < otherId ? otherId : userId;

  const { data: existing } = await supabase
    .from("chat_threads")
    .select("id")
    .eq("participant_a", a)
    .eq("participant_b", b)
    .maybeSingle();
  if (existing) return { threadId: existing.id };

  const [{ data: iFollow }, { data: followMe }] = await Promise.all([
    supabase
      .from("follows")
      .select("followee_id")
      .eq("follower_id", userId)
      .eq("followee_id", otherId)
      .maybeSingle(),
    supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", otherId)
      .eq("followee_id", userId)
      .maybeSingle(),
  ]);
  const mutual = Boolean(iFollow && followMe);

  const base = { participant_a: userId, participant_b: otherId };
  let ins = await supabase
    .from("chat_threads")
    .insert({
      ...base,
      requested_by: mutual ? null : userId,
      accepted_at: mutual ? new Date().toISOString() : null,
    })
    .select("id")
    .single();
  // Pre-0020 (no request columns) → retry as a plain thread.
  if (ins.error) {
    ins = await supabase.from("chat_threads").insert(base).select("id").single();
  }
  if (ins.error || !ins.data) return { error: "create" };
  return { threadId: ins.data.id };
}
