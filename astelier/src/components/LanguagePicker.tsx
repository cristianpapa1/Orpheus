"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/lib/i18n/actions";
import { LOCALES, type Locale } from "@/lib/i18n/config";

/** Compact native <select> language switcher for the nav. Sets the locale cookie,
 *  then refreshes so the server-rendered UI re-renders in the chosen language. */
export function LanguagePicker({ current }: { current: Locale }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <select
      aria-label="Language"
      defaultValue={current}
      disabled={pending}
      data-language-picker
      onChange={(e) =>
        start(async () => {
          await setLocale(e.target.value);
          router.refresh();
        })
      }
      className="border-2 border-ink bg-paper px-2 py-1 text-caption font-bold uppercase outline-none focus:border-blue disabled:opacity-50"
    >
      {LOCALES.map((l) => (
        // Show the short CODE (EN / PT / …) so the closed picker stays compact
        // in the mobile header; the full name rides along as the option title.
        <option key={l.code} value={l.code} title={l.label}>
          {l.code.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
