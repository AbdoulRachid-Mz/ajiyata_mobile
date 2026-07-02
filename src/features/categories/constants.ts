export const DEFAULT_INCOME_CATEGORIES = [
  {
    name: "Salaire",
    type: "income" as const,
    color: "#22c55e",
    icon: "💰",
    isDefault: true,
  },
  {
    name: "Freelance",
    type: "income" as const,
    color: "#16a34a",
    icon: "💼",
    isDefault: true,
  },
  {
    name: "Investissements",
    type: "income" as const,
    color: "#8b5cf6",
    icon: "📈",
    isDefault: true,
  },
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  {
    name: "Nourriture",
    type: "expense" as const,
    color: "#ef4444",
    icon: "🍔",
    isDefault: true,
  },
  {
    name: "Transport",
    type: "expense" as const,
    color: "#f59e0b",
    icon: "🚗",
    isDefault: true,
  },
  {
    name: "Loyer",
    type: "expense" as const,
    color: "#3b82f6",
    icon: "🏠",
    isDefault: true,
  },
  {
    name: "Santé",
    type: "expense" as const,
    color: "#ec4899",
    icon: "🏥",
    isDefault: true,
  },
  {
    name: "Divertissement",
    type: "expense" as const,
    color: "#06b6d4",
    icon: "🎮",
    isDefault: true,
  },
];
