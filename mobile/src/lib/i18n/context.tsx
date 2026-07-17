import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  deviceLocale,
  isLocale,
  localeDir,
  type Dir,
  type Locale,
} from "./config";
import { getDictionary, type Dictionary } from "./dictionaries";

interface I18nValue {
  locale: Locale;
  dir: Dir;
  t: Dictionary;
  setLocale: (code: Locale) => void;
}

const I18nContext = createContext<I18nValue>({
  locale: DEFAULT_LOCALE,
  dir: "ltr",
  t: getDictionary(DEFAULT_LOCALE),
  setLocale: () => {},
});

/**
 * App-wide i18n. Starts from the device language (Intl, sync — no flash), then
 * applies a saved override from AsyncStorage if the user picked a language.
 * setLocale persists the choice.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(
    () => deviceLocale() ?? DEFAULT_LOCALE,
  );

  useEffect(() => {
    AsyncStorage.getItem(LOCALE_STORAGE_KEY).then((saved) => {
      if (isLocale(saved)) setLocaleState(saved);
    });
  }, []);

  const setLocale = (code: Locale) => {
    setLocaleState(code);
    AsyncStorage.setItem(LOCALE_STORAGE_KEY, code).catch(() => {});
  };

  const value = useMemo<I18nValue>(
    () => ({ locale, dir: localeDir(locale), t: getDictionary(locale), setLocale }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}

/** Translations for a screen. */
export function useT(): Dictionary {
  return useContext(I18nContext).t;
}
