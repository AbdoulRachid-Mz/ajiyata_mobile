// Fichier: src/services/goal-intelligence.service.ts

import { db } from '@/db';
import { savingGoals, transactions, categories } from '@/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { notificationService } from '@/configs/notifications';

export interface GoalSuggestion {
  title: string;
  suggestedTarget: number;
  categoryId?: string;
  categoryName?: string;
  confidence: number;
  reason: string;
  deadline?: Date;
}

export class GoalIntelligenceService {
  private static instance: GoalIntelligenceService;

  static getInstance(): GoalIntelligenceService {
    if (!GoalIntelligenceService.instance) {
      GoalIntelligenceService.instance = new GoalIntelligenceService();
    }
    return GoalIntelligenceService.instance;
  }

  /**
   * Suggérer des objectifs d'épargne basés sur l'historique
   */
  async suggestGoals(accountId: string): Promise<GoalSuggestion[]> {
    try {
      const suggestions: GoalSuggestion[] = [];

      // 1. Récupérer les objectifs existants
      const existingGoals = await db
        .select()
        .from(savingGoals)
        .where(eq(savingGoals.accountId, accountId));

      const existingGoalTitles = new Set(existingGoals.map(g => g.title.toLowerCase()));

      // 2. Récupérer les transactions des 3 derniers mois
      const threeMonthsAgo = subMonths(new Date(), 3);
      
      const recentTransactions = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.accountId, accountId),
            gte(transactions.date, threeMonthsAgo)
          )
        );

      if (recentTransactions.length === 0) {
        console.log('📊 Aucune transaction trouvée pour les suggestions d\'objectifs');
        return [];
      }

      // 3. Analyser les dépenses par catégorie
      const categorySpending: Record<string, { total: number; count: number; name: string }> = {};

      // Récupérer les noms des catégories
      const allCategories = await db
        .select()
        .from(categories)
        .where(eq(categories.accountId, accountId));

      const categoryMap = new Map<string, string>();
      for (const cat of allCategories) {
        categoryMap.set(cat.id, cat.name);
      }

      // Calculer les dépenses par catégorie
      for (const tx of recentTransactions) {
        if (!tx.categoryId || tx.type !== 'expense') continue;
        
        if (!categorySpending[tx.categoryId]) {
          categorySpending[tx.categoryId] = { 
            total: 0, 
            count: 0, 
            name: categoryMap.get(tx.categoryId) || 'Inconnue' 
          };
        }
        categorySpending[tx.categoryId].total += Number(tx.amount);
        categorySpending[tx.categoryId].count++;
      }

      // 4. Générer des suggestions
      const now = new Date();
      const sixMonthsLater = new Date(now);
      sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

      // Suggestion 1: Épargne d'urgence (3 mois de dépenses)
      const totalMonthlyExpenses = Object.values(categorySpending)
        .reduce((sum, data) => sum + (data.total / 3), 0);

      if (totalMonthlyExpenses > 0) {
        const emergencyFund = Math.round(totalMonthlyExpenses * 3);
        if (!existingGoalTitles.has('fonds d\'urgence')) {
          suggestions.push({
            title: 'Fonds d\'urgence',
            suggestedTarget: emergencyFund,
            confidence: 0.9,
            reason: `3 mois de dépenses (${Math.round(totalMonthlyExpenses)} FCFA/mois)`,
            deadline: sixMonthsLater,
          });
        }
      }

      // Suggestion 2: Épargne par catégorie
      for (const [categoryId, data] of Object.entries(categorySpending)) {
        if (data.count < 3) continue;

        const avgMonthly = data.total / 3;
        const suggestionTitle = `Épargne - ${data.name}`;
        
        if (!existingGoalTitles.has(suggestionTitle.toLowerCase())) {
          const targetAmount = Math.round(avgMonthly * 2);
          suggestions.push({
            title: suggestionTitle,
            suggestedTarget: targetAmount,
            categoryId: categoryId,
            categoryName: data.name,
            confidence: Math.min(data.count / 10, 0.8),
            reason: `Moyenne de ${data.count} transactions sur 3 mois (${Math.round(avgMonthly)} FCFA/mois)`,
            deadline: new Date(now.setMonth(now.getMonth() + 3)),
          });
        }
      }

      // Suggestion 3: Épargne vacances si assez de dépenses de loisirs
      const leisureCategories = ['divertissement', 'voyage', 'restaurant', 'loisirs'];
      let leisureTotal = 0;
      for (const [categoryId, data] of Object.entries(categorySpending)) {
        const catName = data.name.toLowerCase();
        if (leisureCategories.some(k => catName.includes(k))) {
          leisureTotal += data.total / 3;
        }
      }

      if (leisureTotal > 10000 && !existingGoalTitles.has('vacances')) {
        suggestions.push({
          title: 'Vacances',
          suggestedTarget: Math.round(leisureTotal * 2),
          confidence: 0.6,
          reason: `Basé sur vos dépenses de loisirs (${Math.round(leisureTotal)} FCFA/mois)`,
          deadline: new Date(now.setMonth(now.getMonth() + 6)),
        });
      }

      // Trier par confiance
      suggestions.sort((a, b) => b.confidence - a.confidence);

      console.log(`📊 ${suggestions.length} suggestions d'objectifs générées`);

      return suggestions;
    } catch (error) {
      console.error('Error in suggestGoals:', error);
      return [];
    }
  }

  /**
   * Détecter les objectifs qui approchent de l'échéance
   */
  async detectUpcomingDeadlines(accountId: string): Promise<void> {
    try {
      const now = new Date();
      const twoWeeksLater = new Date(now);
      twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

      const activeGoals = await db
        .select()
        .from(savingGoals)
        .where(
          and(
            eq(savingGoals.accountId, accountId),
            eq(savingGoals.status, 'active')
          )
        );

      for (const goal of activeGoals) {
        if (!goal.deadline) continue;

        const deadline = new Date(goal.deadline);
        const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Si l'échéance est dans moins de 14 jours et l'objectif n'est pas atteint
        if (daysUntilDeadline <= 14 && daysUntilDeadline > 0) {
          const progress = goal.currentAmount / goal.targetAmount;
          if (progress < 0.8) {
            await notificationService.sendNotification({
              title: `⏰ Échéance bientôt : ${goal.title}`,
              body: `Il vous reste ${daysUntilDeadline} jours et ${Math.round((1 - progress) * 100)}% de l'objectif à atteindre.`,
              data: { type: 'goal_deadline', goalId: goal.id },
            });
          }
        }
      }
    } catch (error) {
      console.error('Error in detectUpcomingDeadlines:', error);
    }
  }
}

export const goalIntelligence = GoalIntelligenceService.getInstance();