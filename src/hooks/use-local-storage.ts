import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const item = await AsyncStorage.getItem(key);
        setStoredValue(item ? JSON.parse(item) : initialValue);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Storage read error"));
        setStoredValue(initialValue);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [key]);

  const setValue = useCallback(
    async (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        setStoredValue(valueToStore);
        await AsyncStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Storage write error"));
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Storage delete error"));
    }
  }, [key, initialValue]);

  return { storedValue, setValue, removeValue, error, loading } as const;
}