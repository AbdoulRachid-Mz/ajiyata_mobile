
// Mobile-first theme colors - extracted from your base HSL values
export const lightTheme = {
  colors: {
    // Base
    background: "#F8FAFC",
    foreground: "#0F172A",

    // Brand
    primary: "#15803D",
    primaryForeground: "#FFFFFF",

    // Surface
    secondary: "#F1F5F9",
    secondaryForeground: "#1E293B",

    muted: "#F8FAFC",
    mutedForeground: "#64748B",

    accent: "#DCFCE7",
    accentForeground: "#166534",

    destructive: "#DC2626",
    destructiveForeground: "#FFFFFF",

    border: "#E2E8F0",
    input: "#CBD5E1",

    ring: "#22C55E",

    card: "#FFFFFF",
    cardForeground: "#0F172A",
  },

  financialColors: {
    income: "#16A34A",
    expense: "#DC2626",

    profit: "#22C55E",
    loss: "#B91C1C",

    saving: "#2563EB",
    budget: "#D97706",
    investment: "#7C3AED",

    transactionsCount: "#0891B2",

    cash: "#16A34A",
    bank: "#2563EB",
    transfer: "#7C3AED",

    pending: "#F59E0B",
    completed: "#16A34A",
    failed: "#DC2626",

    info: "#0284C7",
    warning: "#F59E0B",
    success: "#16A34A",
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    "2xl": 48,
  },

  borderRadius: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 18,
    full: 9999,
  },

  typography: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
  },

  shadows: {
    sm: "0 1px 3px rgba(15,23,42,0.08)",
    md: "0 6px 12px rgba(15,23,42,0.10)",
    lg: "0 12px 24px rgba(15,23,42,0.12)",
  },
};

export const darkTheme = {
  colors: {
    background: "#020617",
    foreground: "#F8FAFC",

    primary: "#22C55E",
    primaryForeground: "#052E16",

    secondary: "#111827",
    secondaryForeground: "#F8FAFC",

    muted: "#1E293B",
    mutedForeground: "#94A3B8",

    accent: "#14532D",
    accentForeground: "#DCFCE7",

    destructive: "#EF4444",
    destructiveForeground: "#FFFFFF",

    border: "#334155",
    input: "#334155",

    ring: "#22C55E",

    card: "#0F172A",
    cardForeground: "#F8FAFC",
  },

  financialColors: {
    income: "#4ADE80",
    expense: "#F87171",

    profit: "#22C55E",
    loss: "#EF4444",

    saving: "#60A5FA",
    budget: "#FBBF24",
    investment: "#A78BFA",

    transactionsCount: "#22D3EE",

    cash: "#4ADE80",
    bank: "#60A5FA",
    transfer: "#A78BFA",

    pending: "#FBBF24",
    completed: "#4ADE80",
    failed: "#F87171",

    info: "#38BDF8",
    warning: "#FBBF24",
    success: "#4ADE80",
  },

  spacing: { ...lightTheme.spacing },

  borderRadius: { ...lightTheme.borderRadius },

  typography: { ...lightTheme.typography },

  shadows: {
    sm: "0 1px 3px rgba(0,0,0,0.35)",
    md: "0 6px 12px rgba(0,0,0,0.40)",
    lg: "0 12px 24px rgba(0,0,0,0.45)",
  },
};

export type Theme = typeof lightTheme;
export type ThemeMode = "light" | "dark" | "system";

