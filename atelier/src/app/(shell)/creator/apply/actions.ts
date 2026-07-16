"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  fileCreatorApplication,
  type CreatorApplyResult,
} from "@/lib/creator/apply";

/** File a creator application from the standalone page (also reused conceptually
 *  by onboarding). Validation + the privileged status flip live in the helper. */
export async function submitCreatorApplication(input: {
  statement: string;
  links: string[];
}): Promise<CreatorApplyResult> {
  const supabase = await createServerSupabase();
  if (!supabase) return { ok: false, error: "Supabase is not configured." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const res = await fileCreatorApplication(supabase, user.id, input);
  if (res.ok) {
    revalidatePath("/creator/apply");
    revalidatePath("/feed");
    revalidatePath("/post/new");
  }
  return res;
}
