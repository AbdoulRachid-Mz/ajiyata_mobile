import { useEffect } from 'react';
import { useNotifications } from '@/contexts/notification-context';
import { useBudgets } from '@/features/budgets/hooks';
import { useAppStore } from '@/stores/app-store';
import { formatCurrency } from '@/lib/formatters/currency';
import { useSavingGoals } from '@/features/saving-goals/hooks';

export const useBudgetNotifications = () => {
  const { currentAccount } = useAppStore();
  const { data: budgets } = useBudgets(currentAccount?.id || '');
  const { sendNotification } = useNotifications();

  useEffect(() => {
    if (!budgets || budgets.length === 0) return;

    // Vérifier les budgets dépassés
    budgets.forEach(budget => {
      if (budget.spent > budget.limit) {
        const percentage = ((budget.spent / budget.limit) * 100).toFixed(0);
        sendNotification({
          title: '⚠️ Budget dépassé !',
          body: `Le budget pour cette catégorie a été dépassé de ${percentage}%`,
          data: {
            type: 'budget_alert',
            budgetId: budget.id,
            categoryId: budget.categoryId,
          },
          categoryIdentifier: 'budget_alert',
        });
      } else if (budget.spent > budget.limit * 0.8) {
        const percentage = ((budget.spent / budget.limit) * 100).toFixed(0);
        sendNotification({
          title: '⚡ Budget presque atteint',
          body: `Vous avez utilisé ${percentage}% de votre budget`,
          data: {
            type: 'budget_warning',
            budgetId: budget.id,
            categoryId: budget.categoryId,
          },
          categoryIdentifier: 'budget_warning',
        });
      }
    });
  }, [budgets, sendNotification]);
};

export const useSavingsNotifications = () => {
  const { currentAccount } = useAppStore();
  const { data: goals } = useSavingGoals(currentAccount?.id || '');
  const { scheduleNotification } = useNotifications();

  useEffect(() => {
    if (!goals || goals.length === 0) return;

    // Planifier des rappels d'épargne (tous les jours à 20h)
    goals.forEach(goal => {
      if (goal.status === 'active') {
        scheduleNotification({
          title: '💾 Rappel épargne',
          body: `N'oubliez pas d'épargner pour "${goal.title}" (${formatCurrency(goal.currentAmount)}/${formatCurrency(goal.targetAmount)})`,
          data: {
            type: 'savings_reminder',
            goalId: goal.id,
          },
          trigger: {
            hour: 20,
            minute: 0,
            repeats: true,
          },
        });
      }
    });

    return () => {
      // Nettoyer les rappels planifiés
      // (Idéalement, on stocke les IDs)
    };
  }, [goals, scheduleNotification]);
};