import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/theme-context';
import ThemedText from '@/components/ui/text';
import Card from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters/currency';
import { useTranslation } from 'react-i18next';

interface QuickStatsProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  currency: string;
  transactionCount: number;
}

export const QuickStats = ({ totalIncome, totalExpense, balance, currency, transactionCount }: QuickStatsProps) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const stats = [
    {
      label: t('balance_card.income'),
      value: totalIncome,
      color: theme.financialColors.income,
      icon: 'arrow-up-circle',
      prefix: '+',
    },
    {
      label: t('balance_card.expense'),
      value: totalExpense,
      color: theme.financialColors.expense,
      icon: 'arrow-down-circle',
      prefix: '-',
    },
    {
      label: t('quick_stats.transactions'),
      value: transactionCount,
      color: theme.colors.primary,
      icon: 'list',
      prefix: '',
      isCount: true,
    },
  ];

  return (
    <View style={{ flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
      {stats.map((stat, index) => (
        <Card key={index} style={{ flex: 1, padding: theme.spacing.md, borderRadius: theme.borderRadius.xl, alignItems: 'center' }}>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: stat.color + '20',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: theme.spacing.sm,
          }}>
            <Ionicons name={stat.icon as any} size={24} color={stat.color} />
          </View>
          <ThemedText variant="xs" color="mutedForeground" style={{ textAlign: 'center', marginBottom: theme.spacing.xs }}>
            {stat.label}
          </ThemedText>
          <ThemedText 
            variant="lg" 
            weight="bold" 
            style={{ color: stat.color, textAlign: 'center' }}
          >
            {stat.isCount 
              ? stat.value 
              : `${stat.prefix} ${formatCurrency(stat.value, currency)}`
            }
          </ThemedText>
        </Card>
      ))}
    </View>
  );
};
