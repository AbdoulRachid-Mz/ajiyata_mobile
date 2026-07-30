import React from 'react';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/theme-context';
import { ActionsGrid, ActionItem } from '@/components/ui/actions-grid';
import { useTranslation } from 'react-i18next';

interface QuickActionsProps {
  variant?: 'default' | 'premium' | 'minimal';
  layout?: 'carousel' | 'grid' | 'scroll';
  compact?: boolean;
  customActions?: ActionItem[];
  showAll?: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  variant = 'premium',
  layout = 'grid',
  compact = false,
  customActions,
  showAll = true,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();

  const defaultActions: ActionItem[] = [
    {
      id: 'income',
      label: t('quick_actions.income'),
      icon: 'add-circle',
      color: theme.financialColors.income,
      backgroundColor: theme.financialColors.income + '25',
      onPress: () => router.push({ pathname: '/transaction-create', params: { type: 'income' } }),
    },
    {
      id: 'expense',
      label: t('quick_actions.expense'),
      icon: 'remove-circle',
      color: theme.financialColors.expense,
      backgroundColor: theme.financialColors.expense + '25',
      onPress: () => router.push({ pathname: '/transaction-create', params: { type: 'expense' } }),
    },
    {
      id: 'budget',
      label: t('quick_actions.budget'),
      icon: 'wallet',
      color: theme.financialColors.budget,
      backgroundColor: theme.financialColors.budget + '25',
      onPress: () => router.push('/budget-create'),
    },
    {
      id: 'goal',
      label: t('quick_actions.goal'),
      icon: 'trending-up',
      color: theme.financialColors.saving,
      backgroundColor: theme.financialColors.saving + '25',
      onPress: () => router.push('/saving-goal-create'),
    },
    {
      id: 'calculator',
      label: t('quick_actions.calculator'),
      icon: 'calculator',
      color: theme.colors.primary,
      backgroundColor: theme.colors.primary + '25',
      onPress: () => router.push('/calculator'),
    },
    {
      id: 'convert',
      label: t('quick_actions.convert'),
      icon: 'swap-horizontal',
      color: '#8b5cf6',
      backgroundColor: '#8b5cf625',
      onPress: () => router.push('/currency-converter' as any),
    },
    {
      id: 'scan',
      label: t('quick_actions.scan'),
      icon: 'scan',
      color: '#06b6d4',
      backgroundColor: '#06b6d425',
      onPress: () => router.push('/receipt-scanner' as any),
    },
    {
      id: 'export',
      label: t('quick_actions.export'),
      icon: 'download',
      color: '#f59e0b',
      backgroundColor: '#f59e0b25',
      onPress: () => router.push('/export'),
    },
  ];

  const actions = customActions || defaultActions;
  const displayActions = showAll ? actions : actions.slice(0, 4);

  return (
    <ActionsGrid
      actions={displayActions}
      title={t('quick_actions.title')}
      layout={layout}
      columns={4}
      itemsPerView={4}
      variant={variant}
      compact={compact}
      showIndicators={false}
      showArrows={false}
      iconSize={compact ? 20 : 24}
    />
  );
};