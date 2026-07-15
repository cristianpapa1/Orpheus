"use server";

import { createServerSupabase } from "@/lib/supabase/server";

/** Increment a view counter. Best-effort: if the analytics migration isn't
 *  applied yet (or anything fails), it silently no-ops — never blocks a page. */
export async function bumpView(kind: "product" | "store", id: string): Promise<void> {
  const supabase = await createServerSupabase();
  if (!supabase) return;
  try {
    await supabase.rpc("astelier_bump_view", { p_kind: kind, p_id: id });
  } catch {
    /* analytics is non-critical */
  }
}
