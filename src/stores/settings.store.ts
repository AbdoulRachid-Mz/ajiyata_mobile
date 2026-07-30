// src/stores/settings.store.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { SupportedLanguage } from '@/configs/i18n';

interface SettingsState {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  isLoading: boolean;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: (i18n.language as SupportedLanguage) || 'fr',
      isLoading: true,
      setLanguage: (lang: SupportedLanguage) => {
        // Changer la langue dans i18n
        i18n.changeLanguage(lang);
        set({ language: lang });
        
        // Gérer RTL
        const isRTL = lang === 'ar';
        // Use i18n.dir() to get current text direction instead of accessing non-existent isRTL property
        const currentIsRTL = i18n.dir() === 'rtl';
        if (currentIsRTL !== isRTL) {
          // Note: Le changement RTL nécessite un rechargement de l'application
          // Nous stockons la préférence et l'appliquerons au prochain démarrage
        }
      },
    }),
    {
      name: 'ajiya-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => {
        console.log('📱 Settings Store - Rehydrating...');
        return (state) => {
          if (state) {
            console.log('📱 Settings Store - Rehydrated:', state.language);
            // Appliquer la langue sauvegardée
            if (state.language) {
              i18n.changeLanguage(state.language);
            }
          }
        };
      },
    }
  )
);