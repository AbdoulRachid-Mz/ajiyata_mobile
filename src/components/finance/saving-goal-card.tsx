import React from 'react';
import { View, StyleSheet } from 'react-native';
import Card from '@/components/ui/card';
import ThemedText from '@/components/ui/text';
import { useTheme } from '@/contexts/theme-context';
import { formatCurrency } from '@/lib/formatters/currency';
import { SavingGoal } from '@/types';

interface SavingGoalCardProps {
  goal: SavingGoal;
}

export const SavingGoalCard = ({ goal }: SavingGoalCardProps) => {
  const { theme } = useTheme();

  const progress = Math.min(goal.currentAmount / goal.targetAmount, 1);

  return (
    <Card style={{ marginBottom: theme.spacing.md }}>
      <ThemedText weight="semibold" style={{ marginBottom: theme.spacing.sm }}>{goal.title}</ThemedText>

      <View style={styles.progressContainer}>
        <View style={[
          styles.progressBar,
          {
            width: `${progress * 100}%`,
            backgroundColor: theme.financialColors.saving
          }
        ]} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.sm }}>
        <ThemedText variant="sm">
          {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
        </ThemedText>
        <ThemedText variant="xs" color="mutedForeground">
          {Math.round(progress * 100)}%
        </ThemedText>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  progressContainer: {
    height: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
});
