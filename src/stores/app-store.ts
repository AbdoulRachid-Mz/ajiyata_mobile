import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, Account } from '@/types';

interface AppState {
  currentUser: User | null;
  currentAccount: Account | null;
  setCurrentUser: (user: User | null) => void;
  setCurrentAccount: (account: Account | null) => void;
  // Sécurité
  isAppLockEnabled: boolean;
  setAppLockEnabled: (enabled: boolean) => void;
  lockTimeoutMinutes: number; // Temps en minutes avant verrouillage
  setLockTimeoutMinutes: (minutes: number) => void;
  lastBackgroundTime: number | null;
  setLastBackgroundTime: (time: number | null) => void;
  // Rappels
  reminderEnabled: boolean;
  setReminderEnabled: (enabled: boolean) => void;
  reminderTime: string;
  setReminderTime: (time: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: null,
      currentAccount: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      setCurrentAccount: (account) => set({ currentAccount: account }),
      
      isAppLockEnabled: false,
      setAppLockEnabled: (enabled) => set({ isAppLockEnabled: enabled }),
      
      lockTimeoutMinutes: 5, // Valeur par défaut: 5 minutes
      setLockTimeoutMinutes: (minutes) => set({ lockTimeoutMinutes: minutes }),
      
      lastBackgroundTime: null,
      setLastBackgroundTime: (time) => set({ lastBackgroundTime: time }),
      
      reminderEnabled: false,
      setReminderEnabled: (enabled) => set({ reminderEnabled: enabled }),
      
      reminderTime: "08:00",
      setReminderTime: (time) => set({ reminderTime: time }),
    }),
    {
      name: 'ajiya-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);