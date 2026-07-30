// src/features/categories/constants.ts

import { Category } from '@/types';
import i18n from '@/configs/i18n';

// Type pour les catégories par défaut
export interface DefaultCategory {
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  isDefault: true;
  translationKey: string; // Clé de traduction
}

// Fonction pour obtenir les catégories traduites
export const getTranslatedCategories = (
  categories: DefaultCategory[],
  t: (key: string) => string
): DefaultCategory[] => {
  return categories.map(cat => ({
    ...cat,
    name: t(cat.translationKey),
  }));
};

// --- CATÉGORIES PAR DÉFAUT (Français comme fallback) ---

// Revenus - Personnel
export const DEFAULT_INCOME_CATEGORIES: DefaultCategory[] = [
  {
    name: "Salaire",
    type: "income" as const,
    color: "#22c55e",
    icon: "cash-outline",
    isDefault: true,
    translationKey: "categories.income.salary",
  },
  {
    name: "Freelance",
    type: "income" as const,
    color: "#16a34a",
    icon: "briefcase-outline",
    isDefault: true,
    translationKey: "categories.income.freelance",
  },
  {
    name: "Investissements",
    type: "income" as const,
    color: "#8b5cf6",
    icon: "trending-up-outline",
    isDefault: true,
    translationKey: "categories.income.investments",
  },
  {
    name: "Rentes",
    type: "income" as const,
    color: "#06b6d4",
    icon: "home-outline",
    isDefault: true,
    translationKey: "categories.income.rent",
  },
  {
    name: "Allocations",
    type: "income" as const,
    color: "#f59e0b",
    icon: "people-outline",
    isDefault: true,
    translationKey: "categories.income.allowances",
  },
  {
    name: "Ventes",
    type: "income" as const,
    color: "#ec4899",
    icon: "cart-outline",
    isDefault: true,
    translationKey: "categories.income.sales",
  },
  {
    name: "Primes",
    type: "income" as const,
    color: "#14b8a6",
    icon: "gift-outline",
    isDefault: true,
    translationKey: "categories.income.bonuses",
  },
  {
    name: "Autres revenus",
    type: "income" as const,
    color: "#64748b",
    icon: "wallet-outline",
    isDefault: true,
    translationKey: "categories.income.other",
  },
];

// Dépenses - Personnel
export const DEFAULT_EXPENSE_CATEGORIES: DefaultCategory[] = [
  {
    name: "Alimentation",
    type: "expense" as const,
    color: "#ef4444",
    icon: "restaurant-outline",
    isDefault: true,
    translationKey: "categories.expense.food",
  },
  {
    name: "Transport",
    type: "expense" as const,
    color: "#f59e0b",
    icon: "bus-outline",
    isDefault: true,
    translationKey: "categories.expense.transport",
  },
  {
    name: "Loyer",
    type: "expense" as const,
    color: "#3b82f6",
    icon: "home-outline",
    isDefault: true,
    translationKey: "categories.expense.rent",
  },
  {
    name: "Santé",
    type: "expense" as const,
    color: "#ec4899",
    icon: "medical-outline",
    isDefault: true,
    translationKey: "categories.expense.health",
  },
  {
    name: "Divertissement",
    type: "expense" as const,
    color: "#06b6d4",
    icon: "game-controller-outline",
    isDefault: true,
    translationKey: "categories.expense.entertainment",
  },
  {
    name: "Factures",
    type: "expense" as const,
    color: "#8b5cf6",
    icon: "document-text-outline",
    isDefault: true,
    translationKey: "categories.expense.bills",
  },
  {
    name: "Courses",
    type: "expense" as const,
    color: "#f43f5e",
    icon: "bag-outline",
    isDefault: true,
    translationKey: "categories.expense.shopping",
  },
  {
    name: "Éducation",
    type: "expense" as const,
    color: "#10b981",
    icon: "school-outline",
    isDefault: true,
    translationKey: "categories.expense.education",
  },
  {
    name: "Voyage",
    type: "expense" as const,
    color: "#0ea5e9",
    icon: "airplane-outline",
    isDefault: true,
    translationKey: "categories.expense.travel",
  },
  {
    name: "Assurances",
    type: "expense" as const,
    color: "#6366f1",
    icon: "shield-outline",
    isDefault: true,
    translationKey: "categories.expense.insurance",
  },
  {
    name: "Abonnements",
    type: "expense" as const,
    color: "#a855f7",
    icon: "phone-portrait-outline",
    isDefault: true,
    translationKey: "categories.expense.subscriptions",
  },
  {
    name: "Animaux",
    type: "expense" as const,
    color: "#84cc16",
    icon: "paw-outline",
    isDefault: true,
    translationKey: "categories.expense.pets",
  },
  {
    name: "Cadeaux",
    type: "expense" as const,
    color: "#f97316",
    icon: "gift-outline",
    isDefault: true,
    translationKey: "categories.expense.gifts",
  },
  {
    name: "Beauté",
    type: "expense" as const,
    color: "#f0abfc",
    icon: "color-palette-outline",
    isDefault: true,
    translationKey: "categories.expense.beauty",
  },
  {
    name: "Sport",
    type: "expense" as const,
    color: "#22d3ee",
    icon: "basketball-outline",
    isDefault: true,
    translationKey: "categories.expense.sports",
  },
  {
    name: "Rénovations",
    type: "expense" as const,
    color: "#78716c",
    icon: "construct-outline",
    isDefault: true,
    translationKey: "categories.expense.renovations",
  },
  {
    name: "Impôts",
    type: "expense" as const,
    color: "#dc2626",
    icon: "stats-chart-outline",
    isDefault: true,
    translationKey: "categories.expense.taxes",
  },
  {
    name: "Autres dépenses",
    type: "expense" as const,
    color: "#64748b",
    icon: "create-outline",
    isDefault: true,
    translationKey: "categories.expense.other",
  },
];

// Revenus - Business
export const BUSINESS_INCOME_CATEGORIES: DefaultCategory[] = [
  {
    name: "Ventes",
    type: "income" as const,
    color: "#22c55e",
    icon: "cart-outline",
    isDefault: true,
    translationKey: "categories.business.income.sales",
  },
  {
    name: "Prestations de services",
    type: "income" as const,
    color: "#3b82f6",
    icon: "briefcase-outline",
    isDefault: true,
    translationKey: "categories.business.income.services",
  },
  {
    name: "Autres revenus",
    type: "income" as const,
    color: "#64748b",
    icon: "wallet-outline",
    isDefault: true,
    translationKey: "categories.business.income.other",
  },
];

// Dépenses - Business
export const BUSINESS_EXPENSE_CATEGORIES: DefaultCategory[] = [
  {
    name: "Achats marchandises",
    type: "expense" as const,
    color: "#f59e0b",
    icon: "bag-outline",
    isDefault: true,
    translationKey: "categories.business.expense.purchases",
  },
  {
    name: "Loyer commercial",
    type: "expense" as const,
    color: "#3b82f6",
    icon: "home-outline",
    isDefault: true,
    translationKey: "categories.business.expense.rent",
  },
  {
    name: "Salaires",
    type: "expense" as const,
    color: "#ec4899",
    icon: "people-outline",
    isDefault: true,
    translationKey: "categories.business.expense.salaries",
  },
  {
    name: "Marketing",
    type: "expense" as const,
    color: "#8b5cf6",
    icon: "megaphone-outline",
    isDefault: true,
    translationKey: "categories.business.expense.marketing",
  },
  {
    name: "Impôts",
    type: "expense" as const,
    color: "#dc2626",
    icon: "stats-chart-outline",
    isDefault: true,
    translationKey: "categories.business.expense.taxes",
  },
  {
    name: "Autres dépenses",
    type: "expense" as const,
    color: "#64748b",
    icon: "create-outline",
    isDefault: true,
    translationKey: "categories.business.expense.other",
  },
];

// Revenus - Family
export const FAMILY_INCOME_CATEGORIES: DefaultCategory[] = [
  {
    name: "Salaires combinés",
    type: "income" as const,
    color: "#22c55e",
    icon: "cash-outline",
    isDefault: true,
    translationKey: "categories.family.income.combined_salaries",
  },
  {
    name: "Allocations",
    type: "income" as const,
    color: "#f59e0b",
    icon: "people-outline",
    isDefault: true,
    translationKey: "categories.family.income.allowances",
  },
  {
    name: "Autres revenus",
    type: "income" as const,
    color: "#64748b",
    icon: "wallet-outline",
    isDefault: true,
    translationKey: "categories.family.income.other",
  },
];

// Dépenses - Family
export const FAMILY_EXPENSE_CATEGORIES: DefaultCategory[] = [
  {
    name: "Épicerie",
    type: "expense" as const,
    color: "#ef4444",
    icon: "restaurant-outline",
    isDefault: true,
    translationKey: "categories.family.expense.groceries",
  },
  {
    name: "Éducation/École",
    type: "expense" as const,
    color: "#10b981",
    icon: "school-outline",
    isDefault: true,
    translationKey: "categories.family.expense.education",
  },
  {
    name: "Santé familiale",
    type: "expense" as const,
    color: "#ec4899",
    icon: "medical-outline",
    isDefault: true,
    translationKey: "categories.family.expense.health",
  },
  {
    name: "Loyer/Maison",
    type: "expense" as const,
    color: "#3b82f6",
    icon: "home-outline",
    isDefault: true,
    translationKey: "categories.family.expense.rent",
  },
  {
    name: "Factures",
    type: "expense" as const,
    color: "#8b5cf6",
    icon: "document-text-outline",
    isDefault: true,
    translationKey: "categories.family.expense.bills",
  },
  {
    name: "Vacances",
    type: "expense" as const,
    color: "#0ea5e9",
    icon: "airplane-outline",
    isDefault: true,
    translationKey: "categories.family.expense.vacations",
  },
  {
    name: "Animaux",
    type: "expense" as const,
    color: "#84cc16",
    icon: "paw-outline",
    isDefault: true,
    translationKey: "categories.family.expense.pets",
  },
  {
    name: "Autres dépenses",
    type: "expense" as const,
    color: "#64748b",
    icon: "create-outline",
    isDefault: true,
    translationKey: "categories.family.expense.other",
  },
];

// Fonction pour obtenir toutes les catégories par type de compte
export const getCategoriesForAccountType = (
  accountType: 'personal' | 'business' | 'family',
  t: (key: string) => string
): DefaultCategory[] => {
  let incomeCategories: DefaultCategory[];
  let expenseCategories: DefaultCategory[];

  switch (accountType) {
    case 'business':
      incomeCategories = BUSINESS_INCOME_CATEGORIES;
      expenseCategories = BUSINESS_EXPENSE_CATEGORIES;
      break;
    case 'family':
      incomeCategories = FAMILY_INCOME_CATEGORIES;
      expenseCategories = FAMILY_EXPENSE_CATEGORIES;
      break;
    case 'personal':
    default:
      incomeCategories = DEFAULT_INCOME_CATEGORIES;
      expenseCategories = DEFAULT_EXPENSE_CATEGORIES;
      break;
  }

  return [
    ...getTranslatedCategories(incomeCategories, t),
    ...getTranslatedCategories(expenseCategories, t),
  ];
};

// Fonction pour obtenir les catégories de revenus par type de compte
export const getIncomeCategoriesForAccountType = (
  accountType: 'personal' | 'business' | 'family',
  t: (key: string) => string
): DefaultCategory[] => {
  let categories: DefaultCategory[];

  switch (accountType) {
    case 'business':
      categories = BUSINESS_INCOME_CATEGORIES;
      break;
    case 'family':
      categories = FAMILY_INCOME_CATEGORIES;
      break;
    case 'personal':
    default:
      categories = DEFAULT_INCOME_CATEGORIES;
      break;
  }

  return getTranslatedCategories(categories, t);
};

// Fonction pour obtenir les catégories de dépenses par type de compte
export const getExpenseCategoriesForAccountType = (
  accountType: 'personal' | 'business' | 'family',
  t: (key: string) => string
): DefaultCategory[] => {
  let categories: DefaultCategory[];

  switch (accountType) {
    case 'business':
      categories = BUSINESS_EXPENSE_CATEGORIES;
      break;
    case 'family':
      categories = FAMILY_EXPENSE_CATEGORIES;
      break;
    case 'personal':
    default:
      categories = DEFAULT_EXPENSE_CATEGORIES;
      break;
  }

  return getTranslatedCategories(categories, t);
};

// Export des catégories non traduites (pour compatibilité)
export const RAW_CATEGORIES = {
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
  BUSINESS_INCOME_CATEGORIES,
  BUSINESS_EXPENSE_CATEGORIES,
  FAMILY_INCOME_CATEGORIES,
  FAMILY_EXPENSE_CATEGORIES,
};