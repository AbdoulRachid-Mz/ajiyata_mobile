// src/services/notification-scheduler.service.ts

import * as Notifications from 'expo-notifications';
import { notificationService } from '@/configs/notifications';

export class NotificationScheduler {
  private static instance: NotificationScheduler;

  private constructor() {}

  static getInstance(): NotificationScheduler {
    if (!NotificationScheduler.instance) {
      NotificationScheduler.instance = new NotificationScheduler();
    }
    return NotificationScheduler.instance;
  }

  /**
   * Programme un rappel de budget quotidien
   */
  async scheduleBudgetReminder(hour: number = 20, minute: number = 0): Promise<string> {
    try {
      // Annuler les anciens rappels
      await notificationService.cancelAllNotifications();

      // Programmer le rappel
      const id = await notificationService.scheduleNotification({
        title: '💡 Rappel de Budget',
        body: "C'est l'heure de vérifier ou de fixer vos budgets pour la période !",
        data: {
          type: 'budget_reminder',
          route: '/budget-create',
        },
        categoryIdentifier: 'BUDGET_REMINDER',
        trigger: {
          hour,
          minute,
          repeats: true,
        },
      });

      console.log(`⏰ Rappel de budget programmé à ${hour}h${minute}`);
      return id;
    } catch (error) {
      console.error('❌ Erreur lors de la programmation du rappel de budget:', error);
      throw error;
    }
  }

  /**
   * Programme un rappel d'épargne hebdomadaire
   */
  async scheduleSavingsReminder(dayOfWeek: number = 1, hour: number = 18, minute: number = 0): Promise<string> {
    try {
      // Calculer la prochaine date
      const now = new Date();
      const targetDate = new Date(now);
      const currentDay = now.getDay();
      const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7 || 7;
      targetDate.setDate(targetDate.getDate() + daysUntilTarget);
      targetDate.setHours(hour, minute, 0, 0);

      const id = await notificationService.scheduleNotification({
        title: '💾 Rappel d\'épargne',
        body: 'N\'oubliez pas d\'ajouter à vos objectifs d\'épargne cette semaine !',
        data: {
          type: 'savings_reminder',
          route: '/(tabs)/goals',
        },
        categoryIdentifier: 'SAVINGS_REMINDER',
        trigger: {
          date: targetDate,
        },
      });

      console.log(`⏰ Rappel d'épargne programmé pour le ${targetDate.toLocaleDateString()}`);
      return id;
    } catch (error) {
      console.error('❌ Erreur lors de la programmation du rappel d\'épargne:', error);
      throw error;
    }
  }

  /**
   * Envoie une alerte de budget dépassé
   */
  async sendBudgetAlert(budgetId: string, categoryName: string, spent: number, limit: number): Promise<void> {
    try {
      const percentage = Math.round((spent / limit) * 100);
      
      await notificationService.sendNotification({
        title: '⚠️ Budget dépassé !',
        body: `Vous avez dépassé votre budget "${categoryName}" de ${percentage}% (${spent} / ${limit})`,
        data: {
          type: 'budget_alert',
          budgetId: budgetId,
          categoryName: categoryName,
          spent: spent,
          limit: limit,
          route: '/(tabs)/budgets',
        },
        categoryIdentifier: 'BUDGET_ALERT',
      });

      console.log(`💰 Alerte budget envoyée pour "${categoryName}"`);
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'alerte budget:', error);
    }
  }

  /**
   * Envoie une notification d'objectif d'épargne atteint
   */
  async sendGoalAchieved(goalId: string, goalTitle: string, amount: number): Promise<void> {
    try {
      await notificationService.sendNotification({
        title: '🎉 Objectif d\'épargne atteint !',
        body: `Félicitations ! Vous avez atteint votre objectif "${goalTitle}" avec ${amount} FCFA.`,
        data: {
          type: 'goal_achieved',
          goalId: goalId,
          route: '/(tabs)/goals',
        },
      });

      console.log(`🎉 Notification d'objectif atteint envoyée pour "${goalTitle}"`);
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de la notification d\'objectif:', error);
    }
  }
}

export const notificationScheduler = NotificationScheduler.getInstance();