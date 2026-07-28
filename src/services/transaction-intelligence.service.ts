// src/services/transaction-intelligence.service.ts

import { db } from '@/db';
import { transactions, categories } from '@/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  subDays,
  isWithinInterval,
  differenceInDays,
} from 'date-fns';
import { notificationService } from '@/configs/notifications';
import { Transaction, Category } from '@/types';

export interface TransactionInsight {
  type: 'weekly_summary' | 'monthly_summary' | 'spike' | 'unusual_pattern' | 'category_suggestion';
  title: string;
  description: string;
  data?: any;
  severity: 'info' | 'warning' | 'danger';
  actionable: boolean;
  action?: {
    label: string;
    route: string;
    params?: any;
  };
}

export interface CategorySuggestion {
  transactionId: string;
  transactionTitle: string;
  suggestedCategoryId: string;
  suggestedCategoryName: string;
  confidence: number;
  reason: string;
}

export interface SpendingPattern {
  categoryId: string;
  categoryName: string;
  averageAmount: number;
  frequency: number; // jours entre chaque transaction
  totalAmount: number;
  transactionCount: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
}

export class TransactionIntelligenceService {
  private static instance: TransactionIntelligenceService;

  private constructor() {}

  static getInstance(): TransactionIntelligenceService {
    if (!TransactionIntelligenceService.instance) {
      TransactionIntelligenceService.instance = new TransactionIntelligenceService();
    }
    return TransactionIntelligenceService.instance;
  }

  /**
   * Analyse les transactions pour générer des insights
   */
  async generateInsights(accountId: string): Promise<TransactionInsight[]> {
    const insights: TransactionInsight[] = [];
    const now = new Date();

    try {
      // Récupérer les transactions des 3 derniers mois
      const threeMonthsAgo = subMonths(now, 3);
      const allTransactions = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.accountId, accountId),
            gte(transactions.date, threeMonthsAgo)
          )
        );

      if (allTransactions.length === 0) {
        return insights;
      }

      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      // 1. Résumé hebdomadaire
      const weekAgo = subDays(now, 7);
      const weekTransactions = allTransactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= weekAgo && txDate <= now;
      });

      if (weekTransactions.length > 0) {
        const weekIncome = weekTransactions
          .filter(tx => tx.type === 'income')
          .reduce((sum, tx) => sum + Number(tx.amount), 0);
        const weekExpense = weekTransactions
          .filter(tx => tx.type === 'expense')
          .reduce((sum, tx) => sum + Number(tx.amount), 0);
        const weekBalance = weekIncome - weekExpense;

        insights.push({
          type: 'weekly_summary',
          title: '📊 Résumé de la semaine',
          description: `${weekTransactions.length} transactions cette semaine · ${weekExpense > 0 ? `Dépenses: ${weekExpense.toFixed(0)} FCFA` : 'Aucune dépense'}`,
          data: { income: weekIncome, expense: weekExpense, balance: weekBalance, count: weekTransactions.length },
          severity: weekBalance < 0 ? 'warning' : 'info',
          actionable: true,
          action: {
            label: 'Voir les détails',
            route: '/(tabs)/transactions',
            params: { presetDate: 'week' },
          },
        });
      }

      // 2. Détection des pics de dépenses
      const monthTransactions = allTransactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= monthStart && txDate <= monthEnd && tx.type === 'expense';
      });

      if (monthTransactions.length > 0) {
        const avgDaily = monthTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0) / 30;
        const maxTransaction = monthTransactions.reduce((max, tx) => 
          Number(tx.amount) > Number(max.amount) ? tx : max
        );

        if (Number(maxTransaction.amount) > avgDaily * 3) {
          const category = await this.getCategoryName(maxTransaction.categoryId);
          insights.push({
            type: 'spike',
            title: '⚠️ Grosse dépense détectée',
            description: `${maxTransaction.title} · ${Number(maxTransaction.amount).toFixed(0)} FCFA (${category || 'Catégorie inconnue'})`,
            data: { transaction: maxTransaction, avgDaily },
            severity: 'warning',
            actionable: true,
            action: {
              label: 'Voir la transaction',
              route: '/transaction-details',
              params: { id: maxTransaction.id },
            },
          });
        }
      }

      // 3. Détection des patterns inhabituels
      const unusualPatterns = await this.detectUnusualPatterns(accountId, allTransactions as Transaction[]);
      insights.push(...unusualPatterns);

      // 4. Suggestions de catégories pour les transactions non catégorisées
      const uncategorized = allTransactions.filter(tx => !tx.categoryId);
      if (uncategorized.length > 0) {
        const suggestions = await this.suggestCategories(accountId, uncategorized as Transaction[]);
        if (suggestions.length > 0) {
          insights.push({
            type: 'category_suggestion',
            title: '💡 Catégorisation automatique',
            description: `${suggestions.length} transactions peuvent être catégorisées automatiquement`,
            data: { suggestions: suggestions.slice(0, 5) },
            severity: 'info',
            actionable: true,
            action: {
              label: 'Voir les suggestions',
              route: '/(tabs)/transactions',
            },
          });
        }
      }

      // 5. Résumé mensuel
      if (monthTransactions.length > 0) {
        const monthIncome = allTransactions
          .filter(tx => tx.type === 'income' && new Date(tx.date) >= monthStart)
          .reduce((sum, tx) => sum + Number(tx.amount), 0);
        const monthExpense = monthTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
        const monthBalance = monthIncome - monthExpense;

        insights.push({
          type: 'monthly_summary',
          title: '📈 Résumé du mois',
          description: `Revenus: ${monthIncome.toFixed(0)} FCFA · Dépenses: ${monthExpense.toFixed(0)} FCFA · Solde: ${monthBalance.toFixed(0)} FCFA`,
          data: { income: monthIncome, expense: monthExpense, balance: monthBalance, count: monthTransactions.length },
          severity: monthBalance < 0 ? 'danger' : 'info',
          actionable: true,
          action: {
            label: 'Voir les détails',
            route: '/(tabs)/transactions',
          },
        });
      }

      // Trier les insights par sévérité
      insights.sort((a, b) => {
        const severityOrder = { danger: 0, warning: 1, info: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });

      return insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      return [];
    }
  }

  /**
   * Détecte les patterns de dépenses inhabituels
   */
  private async detectUnusualPatterns(
    accountId: string,
    transactions: Transaction[]
  ): Promise<TransactionInsight[]> {
    const insights: TransactionInsight[] = [];
    const now = new Date();

    // Analyser par catégorie
    const categoryGroups: Record<string, Transaction[]> = {};
    for (const tx of transactions) {
      if (!tx.categoryId || tx.type !== 'expense') continue;
      if (!categoryGroups[tx.categoryId]) {
        categoryGroups[tx.categoryId] = [];
      }
      categoryGroups[tx.categoryId].push(tx);
    }

    for (const [categoryId, txs] of Object.entries(categoryGroups)) {
      if (txs.length < 5) continue;

      // Calculer la moyenne
      const total = txs.reduce((sum, tx) => sum + Number(tx.amount), 0);
      const avg = total / txs.length;

      // Vérifier les dépenses récentes (7 derniers jours)
      const recent = txs.filter(tx => {
        const txDate = new Date(tx.date);
        return differenceInDays(now, txDate) <= 7;
      });

      if (recent.length > 0) {
        const recentAvg = recent.reduce((sum, tx) => sum + Number(tx.amount), 0) / recent.length;
        const ratio = recentAvg / avg;

        // Si la moyenne récente est 50% plus élevée que la moyenne historique
        if (ratio > 1.5) {
          const categoryName = await this.getCategoryName(categoryId);
          insights.push({
            type: 'unusual_pattern',
            title: `📈 Dépenses en hausse pour "${categoryName}"`,
            description: `Moyenne récente: ${recentAvg.toFixed(0)} FCFA vs ${avg.toFixed(0)} FCFA (${Math.round((ratio - 1) * 100)}% d'augmentation)`,
            data: { categoryId, categoryName, recentAvg, avg, ratio },
            severity: 'warning',
            actionable: true,
            action: {
              label: 'Voir les transactions',
              route: '/(tabs)/transactions',
              params: { categoryId },
            },
          });
        }
      }
    }

    return insights;
  }

  /**
   * Suggère des catégories pour les transactions non catégorisées
   */
  async suggestCategories(
    accountId: string,
    transactions: Transaction[]
  ): Promise<CategorySuggestion[]> {
    const suggestions: CategorySuggestion[] = [];

    if (transactions.length === 0) return suggestions;

    // Récupérer toutes les catégories
    const allCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.accountId, accountId));

    if (allCategories.length === 0) return suggestions;

    // Mots-clés par catégorie
    const categoryKeywords: Record<string, string[]> = {
      'Alimentation': ['super', 'marché', 'alimentation', 'épicerie', 'nourriture', 'restaurant', 'fast food', 'pizza', 'burger', 'pain', 'lait', 'fromage', 'viande', 'poisson', 'fruits', 'légumes'],
      'Transport': ['essence', 'station', 'service', 'parking', 'taxi', 'bus', 'train', 'péage', 'carburant', 'véhicule', 'réparation'],
      'Shopping': ['magasin', 'boutique', 'habillement', 'vêtement', 'chaussure', 'accessoire', 'électronique', 'amazon', 'decathlon'],
      'Santé': ['pharmacie', 'médicament', 'clinique', 'hôpital', 'docteur', 'dentiste', 'ordonnance', 'mutuelle'],
      'Divertissement': ['cinéma', 'théâtre', 'concert', 'bar', 'restaurant', 'boîte de nuit', 'jeux', 'netflix', 'spotify'],
      'Factures': ['électricité', 'eau', 'internet', 'téléphone', 'gaz', 'assurance', 'abonnement', 'orange', 'mtn'],
      'Éducation': ['école', 'université', 'formation', 'cours', 'livre', 'scolaire', 'éducation'],
      'Loyer': ['loyer', 'appartement', 'maison', 'location', 'immeuble'],
    };

    // Analyser chaque transaction non catégorisée
    for (const tx of transactions) {
      const title = tx.title.toLowerCase();
      let bestMatch: { categoryId: string; categoryName: string; score: number } | null = null;

      for (const category of allCategories) {
        // Ignorer les catégories de revenus pour les dépenses
        if (tx.type === 'expense' && category.type === 'income') continue;
        if (tx.type === 'income' && category.type === 'expense') continue;

        const keywords = categoryKeywords[category.name] || [];
        let score = 0;

        // Vérifier les mots-clés
        for (const keyword of keywords) {
          if (title.includes(keyword.toLowerCase())) {
            score += 0.2;
          }
        }

        // Bonus si le nom de la catégorie apparaît dans le titre
        if (title.includes(category.name.toLowerCase())) {
          score += 0.3;
        }

        if (score > 0 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = {
            categoryId: category.id,
            categoryName: category.name,
            score: Math.min(score, 1),
          };
        }
      }

      // Si une correspondance est trouvée avec une confiance suffisante
      if (bestMatch && bestMatch.score > 0.3) {
        suggestions.push({
          transactionId: tx.id,
          transactionTitle: tx.title,
          suggestedCategoryId: bestMatch.categoryId,
          suggestedCategoryName: bestMatch.categoryName,
          confidence: bestMatch.score,
          reason: `Le titre "${tx.title}" correspond à la catégorie "${bestMatch.categoryName}"`,
        });
      }
    }

    // Trier par confiance décroissante
    suggestions.sort((a, b) => b.confidence - a.confidence);

    return suggestions;
  }

  /**
   * Applique automatiquement les suggestions de catégories avec une confiance élevée
   */
  async autoApplyCategorySuggestions(
    accountId: string,
    threshold: number = 0.7
  ): Promise<{ applied: number; failed: number }> {
    let applied = 0;
    let failed = 0;

    try {
      // Récupérer les transactions non catégorisées
      const uncategorized = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.accountId, accountId),
            sql`${transactions.categoryId} IS NULL`
          )
        );

      if (uncategorized.length === 0) {
        return { applied, failed };
      }

      const suggestions = await this.suggestCategories(accountId, uncategorized as Transaction[]);

      for (const suggestion of suggestions) {
        if (suggestion.confidence >= threshold) {
          try {
            await db
              .update(transactions)
              .set({
                categoryId: suggestion.suggestedCategoryId,
                updatedAt: new Date(),
                syncStatus: 'pending',
              })
              .where(eq(transactions.id, suggestion.transactionId));
            applied++;
          } catch (error) {
            failed++;
          }
        }
      }

      console.log(`✅ ${applied} transactions catégorisées automatiquement, ${failed} échecs`);
    } catch (error) {
      console.error('Error auto-applying category suggestions:', error);
    }

    return { applied, failed };
  }

  /**
   * Analyse les patterns de dépenses par catégorie
   */
  async analyzeSpendingPatterns(accountId: string): Promise<SpendingPattern[]> {
    const patterns: SpendingPattern[] = [];
    const now = new Date();
    const threeMonthsAgo = subMonths(now, 3);

    try {
      const allTransactions = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.accountId, accountId),
            eq(transactions.type, 'expense'),
            gte(transactions.date, threeMonthsAgo)
          )
        );

      if (allTransactions.length === 0) return patterns;

      // Grouper par catégorie
      const categoryGroups: Record<string, Transaction[]> = {};
      for (const tx of allTransactions) {
        if (!tx.categoryId) continue;
        if (!categoryGroups[tx.categoryId]) {
          categoryGroups[tx.categoryId] = [];
        }
        categoryGroups[tx.categoryId].push(tx as Transaction);
      }

      for (const [categoryId, txs] of Object.entries(categoryGroups)) {
        if (txs.length < 3) continue;

        const totalAmount = txs.reduce((sum, tx) => sum + Number(tx.amount), 0);
        const avgAmount = totalAmount / txs.length;

        // Calculer la fréquence (jours entre chaque transaction)
        const sortedDates = txs.map(tx => new Date(tx.date)).sort((a, b) => a.getTime() - b.getTime());
        let totalDays = 0;
        for (let i = 1; i < sortedDates.length; i++) {
          totalDays += differenceInDays(sortedDates[i], sortedDates[i - 1]);
        }
        const frequency = sortedDates.length > 1 ? totalDays / (sortedDates.length - 1) : 30;

        // Calculer la tendance
        const firstHalf = txs.slice(0, Math.floor(txs.length / 2));
        const secondHalf = txs.slice(Math.floor(txs.length / 2));
        const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((sum, tx) => sum + Number(tx.amount), 0) / firstHalf.length : 0;
        const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((sum, tx) => sum + Number(tx.amount), 0) / secondHalf.length : 0;

        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        let trendPercentage = 0;

        if (firstAvg > 0) {
          trendPercentage = ((secondAvg - firstAvg) / firstAvg) * 100;
          if (trendPercentage > 20) trend = 'increasing';
          else if (trendPercentage < -20) trend = 'decreasing';
        }

        const categoryName = await this.getCategoryName(categoryId);

        patterns.push({
          categoryId,
          categoryName,
          averageAmount: avgAmount,
          frequency,
          totalAmount,
          transactionCount: txs.length,
          trend,
          trendPercentage,
        });
      }

      // Trier par montant total décroissant
      patterns.sort((a, b) => b.totalAmount - a.totalAmount);

      return patterns;
    } catch (error) {
      console.error('Error analyzing spending patterns:', error);
      return [];
    }
  }

  /**
   * Envoie des notifications pour les insights importants
   */
  async sendInsightNotifications(accountId: string): Promise<void> {
    try {
      const insights = await this.generateInsights(accountId);

      // Filtrer les insights importants
      const importantInsights = insights.filter(
        i => i.severity === 'danger' || i.severity === 'warning'
      );

      for (const insight of importantInsights) {
        await notificationService.sendNotification({
          title: insight.title,
          body: insight.description,
          data: {
            type: 'transaction_insight',
            insightType: insight.type,
            severity: insight.severity,
          },
        });
      }

      console.log(`📬 ${importantInsights.length} notifications d'insights envoyées`);
    } catch (error) {
      console.error('Error sending insight notifications:', error);
    }
  }

  /**
   * Helper: Récupère le nom d'une catégorie
   */
  private async getCategoryName(categoryId: string | null): Promise<string> {
    if (!categoryId) return 'Inconnue';
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId));
    return category?.name || 'Inconnue';
  }
}

export const transactionIntelligence = TransactionIntelligenceService.getInstance();