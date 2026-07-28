// Fichier: src/services/budget-intelligence.service.ts

import { db } from "@/db";
import { budgets, categories, transactions } from "@/db/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
  startOfDay,
  endOfDay,
  isWithinInterval,
} from "date-fns";
import { notificationService } from "@/configs/notifications";
import { Category, Transaction } from "@/types";
import { transactionRepository } from "@/features/transactions/repositories";

export interface BudgetSuggestion {
  categoryId: string;
  categoryName: string;
  suggestedLimit: number;
  period: "daily" | "weekly" | "monthly";
  confidence: number;
  reason: string;
  hasExistingBudget: boolean;
}

export class BudgetIntelligenceService {
  private static instance: BudgetIntelligenceService;

  static getInstance(): BudgetIntelligenceService {
    if (!BudgetIntelligenceService.instance) {
      BudgetIntelligenceService.instance = new BudgetIntelligenceService();
    }
    return BudgetIntelligenceService.instance;
  }

  /**
   * Suggérer des budgets basés sur l'historique des transactions
   */
 async suggestBudgets(accountId: string): Promise<BudgetSuggestion[]> {
  try {
    // 1. Récupérer les budgets existants
    const existingBudgets = await db
      .select()
      .from(budgets)
      .where(eq(budgets.accountId, accountId));

    const existingCategoryIds = new Set(
      existingBudgets.map((b) => b.categoryId),
    );

    // 2. Récupérer et filtrer les transactions récentes
    const threeMonthsAgo = subMonths(new Date(), 3);
    const allTransactions = await transactionRepository.getAllForAccount(accountId);

    const recentTransactions = allTransactions.filter((tx) => {
      if (tx.type !== "expense") return false;

      // 💡 Correction : convertir tx.date en objet Date pour la comparaison
      const txDate = typeof tx.date === "string" ? new Date(tx.date) : tx.date;
      return txDate >= threeMonthsAgo;
    });

    if (recentTransactions.length === 0) {
      console.log("📊 Aucune transaction de dépense récente trouvée");
      return [];
    }

    // 3. Map des catégories
    const categoryMap = new Map<string, Category>();
    for (const tx of allTransactions) {
      if (tx.category && !categoryMap.has(tx.category.id)) {
        categoryMap.set(tx.category.id, tx.category as Category);
      }
    }

    // 4. Analyser les dépenses par catégorie
    const categorySpending: Record<
      string,
      {
        total: number;
        count: number;
        transactions: Transaction[];
      }
    > = {};

    for (const tx of recentTransactions) {
      const categoryId = tx.categoryId || tx.category?.id;
      if (!categoryId || !categoryMap.has(categoryId)) continue;

      if (!categorySpending[categoryId]) {
        categorySpending[categoryId] = {
          total: 0,
          count: 0,
          transactions: [],
        };
      }
      categorySpending[categoryId].total += Number(tx.amount);
      categorySpending[categoryId].count++;
      categorySpending[categoryId].transactions.push(tx);
    }

    // 5. Générer des suggestions
    const suggestions: BudgetSuggestion[] = [];

    for (const [categoryId, data] of Object.entries(categorySpending)) {
      // 💡 Optionnel : Accepter à partir d'1 transaction si besoin (ex: count < 1)
      if (data.count < 1) continue; 

      const category = categoryMap.get(categoryId);
      if (!category) continue;

      const hasExistingBudget = existingCategoryIds.has(categoryId);

      // Calculer les moyennes
      const avgMonthly = data.total / 3;
      const avgWeekly = avgMonthly / 4.33;

      // Confiance ajustable selon le nombre de transactions
      const confidence = Math.min((data.count / 5) * 0.6 + 0.2, 1);

      if (!hasExistingBudget) {
        suggestions.push({
          categoryId,
          categoryName: category.name,
          suggestedLimit: Math.ceil(avgMonthly * 1.1),
          period: "monthly",
          confidence,
          reason: `Basé sur ${data.count} dépense(s) récente(s) (${Math.round(data.total)} FCFA)`,
          hasExistingBudget: false,
        });
      }

      if (data.count >= 5 && !hasExistingBudget) {
        suggestions.push({
          categoryId,
          categoryName: category.name,
          suggestedLimit: Math.ceil(avgWeekly * 1.1),
          period: "weekly",
          confidence: confidence * 0.8,
          reason: `${data.count} transactions sur 3 mois (${Math.round(avgWeekly)} FCFA/semaine)`,
          hasExistingBudget: false,
        });
      }
    }

    suggestions.sort((a, b) => b.confidence - a.confidence);

    console.log(`📊 ${suggestions.length} suggestions générées`);
    return suggestions;
  } catch (error) {
    console.error("Error in suggestBudgets:", error);
    return [];
  }
}

  /**
   * Détecter les anomalies (budgets dépassés, nouvelles catégories)
   */
  async detectAnomalies(accountId: string): Promise<void> {
    try {
      const now = new Date();
      const monthStart = startOfMonth(now);

      // 1. Vérifier les budgets actifs
      const activeBudgets = await db
        .select()
        .from(budgets)
        .where(
          and(eq(budgets.accountId, accountId), eq(budgets.status, "active")),
        );

      for (const budget of activeBudgets) {
        const spent = await this.getCategorySpent(
          accountId,
          budget.categoryId,
          monthStart,
          now,
        );

        // Si dépassé de plus de 20%
        if (spent > budget.limit * 1.2) {
          const percentage = Math.round(
            ((spent - budget.limit) / budget.limit) * 100,
          );
          await notificationService.sendNotification({
            title: "⚠️ Budget dépassé !",
            body: `Vous avez dépassé votre budget de ${percentage}% pour cette catégorie.`,
            data: { type: "budget_alert", budgetId: budget.id },
          });
        }
      }
    } catch (error) {
      console.error("Error in detectAnomalies:", error);
    }
  }

  // Helpers
  private async getCategorySpent(
    accountId: string,
    categoryId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    const txs = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.accountId, accountId),
          eq(transactions.categoryId, categoryId),
          eq(transactions.type, "expense"),
          gte(transactions.date, start),
          lte(transactions.date, end),
        ),
      );

    return txs.reduce((sum, tx) => sum + Number(tx.amount), 0);
  }
}

export const budgetIntelligence = BudgetIntelligenceService.getInstance();
