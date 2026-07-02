
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, Account } from '@/types';

interface AppState {
  currentUser: User | null;
  currentAccount: Account | null;
  setCurrentUser: (user: User | null) => void;
  setCurrentAccount: (account: Account | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: null,
      currentAccount: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      setCurrentAccount: (account) => set({ currentAccount: account }),
    }),
    {
      name: 'ajiya-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
