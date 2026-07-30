// src/hooks/use-language.ts

import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings.store';
import { useAppStore } from '@/stores/app-store';
import { useUpdateUser } from '@/features/users/hooks';
import { I18nManager, Platform } from 'react-native';
import { SupportedLanguage, SUPPORTED_LANGUAGES, LANGUAGE_NAMES, LANGUAGE_FLAGS } from '@/configs/i18n';
import { useCallback } from 'react';

interface UseLanguageReturn {
  t: (key: string, options?: any) => string;
  currentLanguage: SupportedLanguage;
  changeLanguage: (lang: SupportedLanguage) => void;
  isRTL: boolean;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
  languageNames: Record<SupportedLanguage, string>;
  languageFlags: Record<SupportedLanguage, string>;
  reloadApp: () => void;
}

export const useLanguage = (): UseLanguageReturn => {
  const { t, i18n } = useTranslation();
  const { language, setLanguage } = useSettingsStore();
  const { currentUser } = useAppStore();
  const updateUser = useUpdateUser();

  const changeLanguage = useCallback(async (lang: SupportedLanguage) => {
    if (lang === language && currentUser?.language === lang) return;
    
    // Changer dans i18n et le store de paramètres
    i18n.changeLanguage(lang);
    setLanguage(lang);

    // Synchroniser avec le profil utilisateur si connecté
    if (currentUser?.id) {
      try {
        await updateUser.mutateAsync({
          userId: currentUser.id,
          updates: { language: lang },
        });
      } catch (err) {
        console.warn('⚠️ Échec de la mise à jour de la langue du profil:', err);
      }
    }
    
    // Gérer RTL pour l'arabe
    const isRTL = lang === 'ar';
    if (I18nManager.isRTL !== isRTL) {
      if (Platform.OS === 'ios') {
        console.log('🔄 Redémarrage requis pour appliquer RTL');
      }
    }
  }, [language, i18n, setLanguage, currentUser, updateUser]);

  const reloadApp = useCallback(() => {
    // Forcer le rechargement de l'application
    // Pour les changements RTL, c'est nécessaire
    console.log('🔄 Rechargement de l\'application...');
    // @ts-ignore - reloadAsync est disponible dans expo-updates
    if (typeof Updates !== 'undefined' && Updates.reloadAsync) {
      // @ts-ignore
      Updates.reloadAsync();
    } else {
      // Fallback: redémarrer manuellement
      // Sur Android, nous pouvons utiliser react-native-restart
    }
  }, []);

  return {
    t,
    currentLanguage: language,
    changeLanguage,
    isRTL: language === 'ar',
    supportedLanguages: SUPPORTED_LANGUAGES,
    languageNames: LANGUAGE_NAMES,
    languageFlags: LANGUAGE_FLAGS,
    reloadApp,
  };
};