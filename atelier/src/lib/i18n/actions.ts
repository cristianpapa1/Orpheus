"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, isLocale } from "./config";

/** Persist the viewer's language choice in a year-long cookie. The caller
 *  refreshes so server components re-render in the new language. */
export async function setLocale(code: string): Promise<void> {
  if (!isLocale(code)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, code, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
