import React from 'react';
import { View } from 'react-native';
import Card from '@/components/ui/card';
import ThemedText from '@/components/ui/text';
import Spacer from '@/components/ui/spacer';
import { useTheme } from '@/contexts/theme-context';
import { formatCurrency } from '@/lib/formatters/currency';

interface BalanceCardProps {
  balance: number;
  income: number;
  expense: number;
  currency: string;
}

export const BalanceCard = ({ balance, income, expense, currency }: BalanceCardProps) => {
  const { theme } = useTheme();

  return (
    <Card style={{ marginBottom: theme.spacing.lg, padding: theme.spacing.lg }}>
      <ThemedText variant="sm" color="mutedForeground">
        Solde total
      </ThemedText>
      <ThemedText variant="4xl" weight="bold" style={{ marginTop: theme.spacing.xs }}>
        {formatCurrency(balance, currency)}
      </ThemedText>

      <Spacer height={theme.spacing.md} />

      <View style={{ flexDirection: 'row', gap: theme.spacing.lg }}>
        <View style={{ flex: 1 }}>
          <ThemedText variant="sm" color="mutedForeground">
            Revenus
          </ThemedText>
          <ThemedText variant="lg" weight="semibold" style={{ color: theme.financialColors.income }}>
            + {formatCurrency(income, currency)}
          </ThemedText>
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText variant="sm" color="mutedForeground">
            Dépenses
          </ThemedText>
          <ThemedText variant="lg" weight="semibold" style={{ color: theme.financialColors.expense }}>
            - {formatCurrency(expense, currency)}
          </ThemedText>
        </View>
      </View>
    </Card>
  );
};
