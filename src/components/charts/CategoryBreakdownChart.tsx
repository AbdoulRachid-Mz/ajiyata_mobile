import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { useTheme } from '@/contexts/theme-context';
import ThemedText from '@/components/ui/text';
import { Transaction, Category } from '@/types';
import { formatCurrency } from '@/lib/formatters/currency';

interface CategoryBreakdownChartProps {
  transactions: Transaction[];
  categories: Category[];
  currency: string;
}

export const CategoryBreakdownChart = ({ transactions, categories, currency }: CategoryBreakdownChartProps) => {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width - 48;

  // Grouper les transactions par catégorie
  const chartData = useMemo(() => {
    const categoryMap: { [key: string]: { amount: number; category: Category | undefined } } = {};
    
    const expenseTransactions = transactions.filter(tx => tx.type === 'expense');
    
    expenseTransactions.forEach(tx => {
      if (tx.categoryId) {
        if (!categoryMap[tx.categoryId]) {
          const category = categories.find(c => c.id === tx.categoryId);
          categoryMap[tx.categoryId] = { amount: 0, category };
        }
        categoryMap[tx.categoryId].amount += tx.amount;
      }
    });

    // Trier et prendre les 5 plus grandes catégories
    const sorted = Object.entries(categoryMap)
      .sort((a, b) => b[1].amount - a[1].amount)
      .slice(0, 5);

    const total = sorted.reduce((sum, [, data]) => sum + data.amount, 0);

    return sorted.map(([id, data]) => ({
      id,
      value: data.amount,
      color: data.category?.color || theme.colors.muted,
      label: data.category?.name || 'Autre',
      percentage: total > 0 ? (data.amount / total) * 100 : 0,
      formattedAmount: formatCurrency(data.amount, currency),
    }));
  }, [transactions, categories, theme, currency]);

  // Données pour le PieChart
  const pieData = chartData.map(item => ({
    value: item.value,
    color: item.color,
    label: item.label,
    text: item.formattedAmount,
  }));

  if (chartData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ThemedText color="mutedForeground" style={{ textAlign: 'center' }}>
          Aucune catégorie de dépense
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ThemedText variant="sm" weight="semibold" style={styles.title}>
        Dépenses par catégorie
      </ThemedText>
      
      <View style={styles.chartContainer}>
        <PieChart
          data={pieData}
          donut
          showGradient
          sectionAutoFocus
          radius={Math.min(screenWidth / 2.5, 120)}
          innerRadius={Math.min(screenWidth / 5, 60)}
          innerCircleColor={theme.colors.background}
          textColor={theme.colors.foreground}
          textSize={12}
          focusOnPress
          onPress={(item: any, index: number) => {
            // Feedback haptique ou navigation
          }}
        />
      </View>

      <View style={styles.legendContainer}>
        {chartData.map((item, index) => (
          <View key={item.id || index} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
            <View style={styles.legendTextContainer}>
              <ThemedText variant="sm" numberOfLines={1} style={styles.legendLabel}>
                {item.label}
              </ThemedText>
              <ThemedText variant="xs" color="mutedForeground">
                {item.percentage.toFixed(0)}%
              </ThemedText>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  title: {
    marginBottom: 12,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendLabel: {
    maxWidth: 80,
  },
});