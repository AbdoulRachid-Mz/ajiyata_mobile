import React from 'react';
import { View, StyleSheet } from 'react-native';
import Card from '@/components/ui/card';
import ThemedText from '@/components/ui/text';
import { useTheme } from '@/contexts/theme-context';
import { formatCurrency } from '@/lib/formatters/currency';
import { Budget, Category } from '@/types';

interface BudgetCardProps {
  budget: Budget;
  category?: Category;
}

export const BudgetCard = ({ budget, category }: BudgetCardProps) => {
  const { theme } = useTheme();

  const progress = Math.min(budget.spent / budget.limit, 1);
  const isExceeded = budget.spent > budget.limit;

  return (
    <Card style={{ marginBottom: theme.spacing.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
        <ThemedText weight="semibold">{category?.name || 'Catégorie'}</ThemedText>
        <ThemedText variant="sm" color="mutedForeground">{budget.period}</ThemedText>
      </View>

      <View style={styles.progressContainer}>
        <View style={[
          styles.progressBar,
          {
            width: `${progress * 100}%`,
            backgroundColor: isExceeded ? theme.colors.destructive : theme.financialColors.budget
          }
        ]} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.sm }}>
        <ThemedText variant="sm">
          {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
        </ThemedText>
        <ThemedText variant="xs" style={{ color: isExceeded ? theme.colors.destructive : theme.colors.mutedForeground }}>
          {Math.round(progress * 100)}%
        </ThemedText>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  progressContainer: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
});
