"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const DISMISS_COOKIE = "atelier-appeal-dismissed";

/** Dismissal is a cookie so the banner can render (and hide) server-side. */
export async function dismissAppeal(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const cookieStore = await cookies();
  cookieStore.set(DISMISS_COOKIE, id, {
    maxAge: 60 * 60 * 24 * 90,
    path: "/",
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}

export async function getDismissedAppealId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(DISMISS_COOKIE)?.value ?? null;
}
