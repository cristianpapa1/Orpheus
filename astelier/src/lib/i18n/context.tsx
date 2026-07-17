"use client";

import { createContext, useContext } from "react";
import { getDictionary, type Dictionary } from "./dictionaries";

// Default to English so any client component using useT() outside a provider
// still renders (never crashes) — the provider (mounted in the root layout)
// supplies the viewer's actual locale dictionary.
const I18nContext = createContext<Dictionary>(getDictionary("en"));

export function I18nProvider({
  dict,
  children,
}: {
  dict: Dictionary;
  children: React.ReactNode;
}) {
  return <I18nContext.Provider value={dict}>{children}</I18nContext.Provider>;
}

/** Translations for client components. Server components use getI18n() instead. */
export function useT(): Dictionary {
  return useContext(I18nContext);
}
