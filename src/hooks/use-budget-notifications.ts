import { useEffect } from 'react';
import { useNotifications } from '@/contexts/notification-context';
import { useBudgets } from '@/features/budgets/hooks';
import { useAppStore } from '@/stores/app-store';
import { formatCurrency } from '@/lib/formatters/currency';
import { useSavingGoals } from '@/features/saving-goals/hooks';
import { isExpoGo } from '@/configs/notifications';

export const useBudgetNotifications = () => {
  const { currentAccount } = useAppStore();
  const { data: budgetResult } = useBudgets(currentAccount?.id || '');
  const budgets = budgetResult?.data || (Array.isArray(budgetResult) ? budgetResult : []);
  const { sendNotification, isExpoGo: isExpoGoContext } = useNotifications();

  useEffect(() => {
    if (isExpoGo || isExpoGoContext) return;
    if (!budgets || budgets.length === 0) return;

    budgets.forEach(budget => {
      const spent = budget.spent || 0;
      const limit = budget.limit || 0;
      
      if (spent > limit) {
        const percentage = ((spent / limit) * 100).toFixed(0);
        sendNotification({
          title: '⚠️ Budget dépassé !',
          body: `Le budget a été dépassé de ${percentage}%`,
          data: {
            type: 'budget_alert',
            budgetId: budget.id,
            categoryId: budget.categoryId,
          },
          categoryIdentifier: 'budget_alert',
        });
      } else if (spent > limit * 0.8) {
        const percentage = ((spent / limit) * 100).toFixed(0);
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
  }, [budgets, sendNotification, isExpoGoContext]);
};

export const useSavingsNotifications = () => {
  const { currentAccount } = useAppStore();
  const { data: goalsResult } = useSavingGoals(currentAccount?.id || '');
  const goals = goalsResult?.data || (Array.isArray(goalsResult) ? goalsResult : []);
  const { scheduleNotification, isExpoGo: isExpoGoContext } = useNotifications();

  useEffect(() => {
    if (isExpoGo || isExpoGoContext) return;
    if (!goals || goals.length === 0) return;

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

  }, [goals, scheduleNotification, isExpoGoContext]);
};