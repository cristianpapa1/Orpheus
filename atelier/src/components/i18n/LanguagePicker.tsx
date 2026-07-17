"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/lib/i18n/actions";
import { LOCALES, type Locale } from "@/lib/i18n/config";

/** Native <select> language switcher. Sets the locale cookie, then refreshes so
 *  the whole server-rendered UI re-renders in the chosen language. */
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
      className="w-full max-w-xs border-2 border-ink bg-paper px-3 py-2 text-body font-bold outline-none focus:border-blue disabled:opacity-50"
    >
      {LOCALES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
