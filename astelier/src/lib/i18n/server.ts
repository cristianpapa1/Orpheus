import "server-only";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { getDictionary, type Dictionary } from "./dictionaries";

/** Best locale from the browser's Accept-Language header, or null. */
async function localeFromAcceptLanguage(): Promise<Locale | null> {
  const h = await headers();
  const header = h.get("accept-language");
  if (!header) return null;
  for (const part of header.split(",")) {
    const tag = part.split(";")[0].trim().slice(0, 2).toLowerCase();
    if (isLocale(tag)) return tag;
  }
  return null;
}

/**
 * The viewer's interface locale. An explicit choice (cookie) always wins;
 * otherwise sniff the browser's Accept-Language so international visitors land
 * in their language without setup; falling back to the default.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  if (isLocale(value)) return value;
  return (await localeFromAcceptLanguage()) ?? DEFAULT_LOCALE;
}

/** Locale + its dictionary in one call, for server components. */
export async function getI18n(): Promise<{ locale: Locale; t: Dictionary }> {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}
