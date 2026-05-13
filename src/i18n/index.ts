import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import en from "./locales/en.json";
import de from "./locales/de.json";
import fr from "./locales/fr.json";
import es from "./locales/es.json";
import it from "./locales/it.json";
import perksDe from "./locales/perks-de.json";
import perksFr from "./locales/perks-fr.json";
import perksEs from "./locales/perks-es.json";
import perksIt from "./locales/perks-it.json";

export const SUPPORTED_LOCALES = ["en", "de", "fr", "es", "it"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const FALLBACK_LOCALE: SupportedLocale = "en";

export function detectDeviceLocale(): SupportedLocale {
  const locales = getLocales();
  for (const l of locales) {
    const code = (l.languageCode ?? "").toLowerCase();
    if ((SUPPORTED_LOCALES as readonly string[]).includes(code)) {
      return code as SupportedLocale;
    }
  }
  return FALLBACK_LOCALE;
}

const initialLocale = detectDeviceLocale();

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    de: { translation: { ...de, perks: perksDe } },
    fr: { translation: { ...fr, perks: perksFr } },
    es: { translation: { ...es, perks: perksEs } },
    it: { translation: { ...it, perks: perksIt } },
  },
  lng: initialLocale,
  fallbackLng: FALLBACK_LOCALE,
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
