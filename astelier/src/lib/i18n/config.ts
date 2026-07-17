// Supported interface languages, in display order. English is the default/source;
// the rest are the requested set. `dir` drives <html dir> (Arabic is RTL).
// Mirrors atelier's config so the two apps share one language set + cookie name.
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
export const LOCALE_COOKIE = "atelier_locale";

export function isLocale(x: string | undefined | null): x is Locale {
  return !!x && LOCALES.some((l) => l.code === x);
}

export function localeDir(code: Locale): Dir {
  return (LOCALES.find((l) => l.code === code)?.dir ?? "ltr") as Dir;
}
