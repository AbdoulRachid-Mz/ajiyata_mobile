// src/configs/i18n.ts

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { I18nManager } from 'react-native';

// Importer les traductions
import fr from '../locales/fr/translation.json';
import en from '../locales/en/translation.json';
import ha from '../locales/ha/translation.json';
import zrm from '../locales/zrm/translation.json';
import ar from '../locales/ar/translation.json';

// Définir les ressources
const resources = {
  fr: { translation: fr },
  en: { translation: en },
  ha: { translation: ha },
  zrm: { translation: zrm },
  ar: { translation: ar },
};

// Langues supportées
export const SUPPORTED_LANGUAGES = ['fr', 'en', 'ha', 'zrm', 'ar'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// Noms des langues
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  fr: 'Français',
  en: 'English',
  ha: 'Hausa',
  zrm: 'Zarma',
  ar: 'العربية',
};

// Drapeaux des langues
export const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
  ha: '🇳🇪',
  zrm: '🇳🇪',
  ar: '🇸🇦',
};

// Détecter la langue de l'appareil
export const getDeviceLanguage = (): SupportedLanguage => {
  try {
    const locales = Localization.getLocales();
    if (locales && locales.length > 0) {
      const code = locales[0].languageCode?.toLowerCase();
      if (code && SUPPORTED_LANGUAGES.includes(code as SupportedLanguage)) {
        return code as SupportedLanguage;
      }
      const tag = locales[0].languageTag?.toLowerCase();
      if (tag) {
        const prefix = tag.split('-')[0];
        if (SUPPORTED_LANGUAGES.includes(prefix as SupportedLanguage)) {
          return prefix as SupportedLanguage;
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Erreur lors de la détection de la langue:', error);
  }
  return 'fr';
};

// Vérifier si la langue est RTL
const isRTL = (lang: string): boolean => {
  return lang === 'ar';
};

// Initialiser i18n
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDeviceLanguage(),
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    compatibilityJSON: 'v4',
  });

// Appliquer le support RTL
const initialLang = i18n.language || 'fr';
if (isRTL(initialLang)) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
} else {
  I18nManager.allowRTL(false);
  I18nManager.forceRTL(false);
}

export default i18n;