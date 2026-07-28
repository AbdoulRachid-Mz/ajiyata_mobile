import React from 'react';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/theme-context';
import { ActionsGrid, ActionItem } from '@/components/ui/actions-grid';

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
  const { theme } = useTheme();
  const router = useRouter();

  const defaultActions: ActionItem[] = [
    {
      id: 'income',
      label: 'Revenu',
      icon: 'add-circle',
      color: theme.financialColors.income,
      backgroundColor: theme.financialColors.income + '25',
      onPress: () => router.push({ pathname: '/transaction-create', params: { type: 'income' } }),
    },
    {
      id: 'expense',
      label: 'Dépense',
      icon: 'remove-circle',
      color: theme.financialColors.expense,
      backgroundColor: theme.financialColors.expense + '25',
      onPress: () => router.push({ pathname: '/transaction-create', params: { type: 'expense' } }),
    },
    {
      id: 'budget',
      label: 'Budget',
      icon: 'wallet',
      color: theme.financialColors.budget,
      backgroundColor: theme.financialColors.budget + '25',
      onPress: () => router.push('/budget-create'),
    },
    {
      id: 'goal',
      label: 'Objectif',
      icon: 'trending-up',
      color: theme.financialColors.saving,
      backgroundColor: theme.financialColors.saving + '25',
      onPress: () => router.push('/saving-goal-create'),
    },
    {
      id: 'calculator',
      label: 'Calculatrice',
      icon: 'calculator',
      color: theme.colors.primary,
      backgroundColor: theme.colors.primary + '25',
      onPress: () => router.push('/calculator'),
    },
    {
      id: 'convert',
      label: 'Conversion',
      icon: 'swap-horizontal',
      color: '#8b5cf6',
      backgroundColor: '#8b5cf625',
      onPress: () => router.push('/currency-converter' as any),
    },
    {
      id: 'scan',
      label: 'Scanner',
      icon: 'scan',
      color: '#06b6d4',
      backgroundColor: '#06b6d425',
      onPress: () => router.push('/receipt-scanner' as any),
    },
    {
      id: 'export',
      label: 'Exporter',
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
      title="Actions rapides"
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