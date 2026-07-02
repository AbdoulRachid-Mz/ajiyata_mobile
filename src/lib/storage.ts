import AsyncStorage from "@react-native-async-storage/async-storage";
import { InferModel } from "drizzle-orm";
import { 
  users, accounts, categories, transactions, attachments, 
  budgets, savingGoals, exchangeRates, devices, syncLogs, settings 
} from "@/db/schema"; // Update import path to match your project structure

// Type definitions for database entities
export type User = InferModel<typeof users>;
export type Account = InferModel<typeof accounts>;
export type Category = InferModel<typeof categories>;
export type Transaction = InferModel<typeof transactions>;
export type Attachment = InferModel<typeof attachments>;
export type Budget = InferModel<typeof budgets>;
export type SavingGoal = InferModel<typeof savingGoals>;
export type ExchangeRate = InferModel<typeof exchangeRates>;
export type Device = InferModel<typeof devices>;
export type SyncLog = InferModel<typeof syncLogs>;
export type Setting = InferModel<typeof settings>;

// Storage keys for finance app
const STORAGE_KEYS = {
  SESSION: "@finance_app:session",
  IS_FIRST_VISIT: "@finance_app:first_visit",
  PENDING_SYNC: "@finance_app:pending_sync",
  CURRENT_DEVICE_ID: "@finance_app:current_device_id",
} as const;



export async function getStorageItem<T>(key: string): Promise<T | null> {
  try {
    const item = await AsyncStorage.getItem(key);
    if (item) return JSON.parse(item) as T;
    return null;
  } catch (error) {
    console.error("Error getting storage item:", error);
    return null;
  }
}



export async function setStorageItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error setting storage item:", error);
  }
}

export async function removeStorageItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error("Error removing storage item:", error);
  }
}

// Pending sync operation type for offline-first sync tracking
type PendingSyncOperation = {
  id: string;
  action: "create" | "update" | "delete";
  entity: string;
  entityId: string;
  data?: Record<string, unknown>;
  timestamp: number;
};

export const Storage = {
  // Session management
  getSession: () => getStorageItem<string>(STORAGE_KEYS.SESSION),
  setSession: (userId: string) => setStorageItem(STORAGE_KEYS.SESSION, userId),
  removeSession: () => removeStorageItem(STORAGE_KEYS.SESSION),
  
  // First visit tracking
  isFirstVisit: async (): Promise<boolean> => {
    const value = await getStorageItem<boolean>(STORAGE_KEYS.IS_FIRST_VISIT);
    console.log("IS_FIRST_VISIT VALUE =", value);
    return value !== false; // If value is null or true, return true
  },
  setFirstVisit: (isFirst: boolean) => {
    console.log("Setting IS_FIRST_VISIT to", isFirst);
    return setStorageItem(STORAGE_KEYS.IS_FIRST_VISIT, isFirst);
  },

  // Current device ID management for multi-device sync
  getCurrentDeviceId: () => getStorageItem<string>(STORAGE_KEYS.CURRENT_DEVICE_ID),
  setCurrentDeviceId: (deviceId: string) => setStorageItem(STORAGE_KEYS.CURRENT_DEVICE_ID, deviceId),
  
  // Pending sync queue management for offline-first operations
  getPendingSyncOperations: () => getStorageItem<PendingSyncOperation[]>(STORAGE_KEYS.PENDING_SYNC).then(ops => ops ?? []),
  addPendingSyncOperation: async (operation: Omit<PendingSyncOperation, "id" | "timestamp">) => {
    const currentOps = await Storage.getPendingSyncOperations();
    const newOp: PendingSyncOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    await setStorageItem(STORAGE_KEYS.PENDING_SYNC, [...currentOps, newOp]);
    return newOp;
  },
  removePendingSyncOperation: async (operationId: string) => {
    const currentOps = await Storage.getPendingSyncOperations();
    const filteredOps = currentOps.filter(op => op.id !== operationId);
    await setStorageItem(STORAGE_KEYS.PENDING_SYNC, filteredOps);
  },
  clearPendingSyncOperations: () => removeStorageItem(STORAGE_KEYS.PENDING_SYNC),

  getItem: async <T>(key: string): Promise<T | null> => {
    try {
      const item = await AsyncStorage.getItem(key);
      if (item) return JSON.parse(item) as T;
      return null;
    } catch (error) {
      console.error("Error getting storage item:", error);
      return null;
    }
  },

  // Ajouter cette méthode setItem générique
  setItem: async <T>(key: string, value: T): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Error setting storage item:", error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error("Error removing storage item:", error);
    }
  },
};
