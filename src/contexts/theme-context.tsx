// @/contexts/theme-context.tsx

import { darkTheme, lightTheme, Theme, ThemeMode } from "@/constants/theme";
import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import { Appearance } from "react-native";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface ThemeContextType {
  mode: ThemeMode;
  theme: Theme;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  themeLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getSystemTheme = (): "light" | "dark" => {
  return Appearance.getColorScheme() === "dark" ? "dark" : "light";
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { 
    storedValue: mode, 
    setValue: setMode, 
    loading: themeLoading 
  } = useLocalStorage<ThemeMode>("app-theme-mode", "system");

  const resolvedTheme = useMemo(() => {
    const activeMode = mode === "system" ? getSystemTheme() : mode;
    return activeMode === "dark" ? darkTheme : lightTheme;
  }, [mode]);

  const isDark = resolvedTheme === darkTheme;

  const toggleTheme = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Listen for system theme changes across all platforms using React Native's Appearance API
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (mode === "system") {
        setMode("system"); // Force re-evaluation of system theme
      }
    });
    return () => subscription.remove();
  }, [mode, setMode]);

  const value: ThemeContextType = {
    mode,
    theme: resolvedTheme,
    isDark,
    setMode,
    toggleTheme,
    themeLoading,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
