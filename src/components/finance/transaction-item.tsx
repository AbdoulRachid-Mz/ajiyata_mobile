import React from 'react';
import { View, StyleSheet } from 'react-native';
import ThemedText from '@/components/ui/text';
import { useTheme } from '@/contexts/theme-context';
import { Transaction } from '@/types';
import { formatCurrency, formatAmountWithSign } from '@/lib/formatters/currency';
import { Ionicons } from '@expo/vector-icons';

interface TransactionItemProps {
  transaction: Transaction;
}

export const TransactionItem = ({ transaction }: TransactionItemProps) => {
  const { theme } = useTheme();

  const isIncome = transaction.type === 'income';

  return (
    <View style={[styles.container, { borderBottomColor: theme.colors.border }]}>
      <View style={[
        styles.iconContainer,
        { backgroundColor: isIncome ? theme.financialColors.income + '20' : theme.financialColors.expense + '20' }
      ]}>
        <Ionicons
          name={isIncome ? 'arrow-up' : 'arrow-down'}
          size={20}
          color={isIncome ? theme.financialColors.income : theme.financialColors.expense}
        />
      </View>

      <View style={styles.content}>
        <ThemedText weight="semibold">{transaction.title}</ThemedText>
        <ThemedText variant="sm" color="mutedForeground">
          {new Date(transaction.date).toLocaleDateString()}
        </ThemedText>
      </View>

      <ThemedText
        weight="bold"
        style={{ color: isIncome ? theme.financialColors.income : theme.financialColors.expense }}
      >
        {formatAmountWithSign(transaction.amount, transaction.type, transaction.currency)}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
});
