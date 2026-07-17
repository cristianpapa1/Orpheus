// Supported interface languages, in display order — mirrors the web apps.
// `dir` drives text alignment (Arabic is RTL).
export const LOCALES = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "pt", label: "Português", dir: "ltr" },
  { code: "de", label: "Deutsch", dir: "ltr" },
  { code: "ja", label: "日本語", dir: "ltr" },
  { code: "zh", label: "中文", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "ru", label: "Русский", dir: "ltr" },
  { code: "it", label: "Italiano", dir: "ltr" },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];
export type Dir = "ltr" | "rtl";

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "atelier.locale";

export function isLocale(x: string | undefined | null): x is Locale {
  return !!x && LOCALES.some((l) => l.code === x);
}

export function localeDir(code: Locale): Dir {
  return (LOCALES.find((l) => l.code === code)?.dir ?? "ltr") as Dir;
}

/**
 * The device's preferred language, via Hermes' Intl (enabled by default in
 * Expo). Returns a supported Locale or null. No native module needed.
 */
export function deviceLocale(): Locale | null {
  try {
    const tag = new Intl.DateTimeFormat().resolvedOptions().locale; // e.g. "fr-CA"
    const primary = tag.slice(0, 2).toLowerCase();
    return isLocale(primary) ? primary : null;
  } catch {
    return null;
  }
}
