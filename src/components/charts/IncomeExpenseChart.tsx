import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { useTheme } from '@/contexts/theme-context';
import ThemedText from '@/components/ui/text';
import { Transaction } from '@/types';
import { formatCurrency } from '@/lib/formatters/currency';

interface IncomeExpenseChartProps {
  transactions: Transaction[];
  currency: string;
  period: 'weekly' | 'monthly' | 'yearly';
}

type ChartData = {
  month: string;
  income: number;
  expense: number;
};

export const IncomeExpenseChart = ({ transactions, currency, period }: IncomeExpenseChartProps) => {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width - 64;

  // Grouper les transactions par période
  const getChartData = (): ChartData[] => {
    const dataMap: { [key: string]: ChartData } = {};
    const now = new Date();
    let periods = 6;

    if (period === 'weekly') {
      // Dernières 6 semaines
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i * 7);
        const key = date.toISOString().split('T')[0];
        dataMap[key] = { 
          month: `S${i + 1}`, 
          income: 0, 
          expense: 0 
        };
      }
    } else if (period === 'yearly') {
      // Derniers 6 mois
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        dataMap[key] = { 
          month: date.toLocaleString('fr-FR', { month: 'short' }), 
          income: 0, 
          expense: 0 
        };
      }
    } else {
      // Derniers 6 mois
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        dataMap[key] = { 
          month: date.toLocaleString('fr-FR', { month: 'short' }), 
          income: 0, 
          expense: 0 
        };
      }
    }

    transactions.forEach(tx => {
      const date = new Date(tx.date);
      let key: string;
      
      if (period === 'weekly') {
        const weekNumber = Math.floor((date.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
        key = `S${weekNumber}`;
      } else if (period === 'yearly') {
        key = `${date.getFullYear()}`;
      } else {
        key = `${date.getFullYear()}-${date.getMonth()}`;
      }

      if (dataMap[key]) {
        if (tx.type === 'income') {
          dataMap[key].income += tx.amount;
        } else if (tx.type === 'expense') {
          dataMap[key].expense += tx.amount;
        }
      }
    });

    return Object.values(dataMap);
  };

  const data = getChartData();

  // Préparer les données pour le BarChart
  const barData = useMemo(() => {
    const incomeBars = data.map((item, index) => ({
      value: item.income,
      label: item.month,
      frontColor: theme.financialColors.income,
      labelTextStyle: { color: theme.colors.mutedForeground, fontSize: 10 },
    }));

    const expenseBars = data.map((item, index) => ({
      value: item.expense,
      label: item.month,
      frontColor: theme.financialColors.expense,
      labelTextStyle: { color: theme.colors.mutedForeground, fontSize: 10 },
    }));

    return { incomeBars, expenseBars };
  }, [data, theme]);

  // Données pour le PieChart
  const pieData = useMemo(() => {
    const totalIncome = data.reduce((sum, d) => sum + d.income, 0);
    const totalExpense = data.reduce((sum, d) => sum + d.expense, 0);

    return [
      {
        value: totalIncome,
        color: theme.financialColors.income,
        label: 'Revenus',
        text: formatCurrency(totalIncome, currency),
      },
      {
        value: totalExpense,
        color: theme.financialColors.expense,
        label: 'Dépenses',
        text: formatCurrency(totalExpense, currency),
      },
    ];
  }, [data, theme, currency]);

  if (data.length === 0 || data.every(d => d.income === 0 && d.expense === 0)) {
    return (
      <View style={styles.emptyContainer}>
        <ThemedText color="mutedForeground" style={{ textAlign: 'center' }}>
          Aucune donnée disponible pour le graphique
        </ThemedText>
      </View>
    );
  }

  const maxValue = Math.max(
    ...data.map(d => Math.max(d.income, d.expense))
  ) * 1.2 || 100;

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.container}
    >
      <View style={{ width: Math.max(screenWidth, data.length * 60 + 40) }}>
        {/* Graphique à barres groupées */}
        <BarChart
          data={barData.incomeBars}
          barWidth={18}
          spacing={8}
          roundedTop
          roundedBottom
          hideRules
          xAxisLabelTextStyle={{
            color: theme.colors.mutedForeground,
            fontSize: 10,
          }}
          yAxisTextStyle={{
            color: theme.colors.mutedForeground,
            fontSize: 9,
          }}
          maxValue={maxValue}
          noOfSections={5}
          isAnimated
          animationDuration={800}
          yAxisOffset={0}
          renderTooltip={(item: any, index: number) => (
            <View style={[styles.tooltip, { backgroundColor: theme.colors.card }]}>
              <ThemedText variant="xs" weight="bold" style={{ color: item.frontColor }}>
                {formatCurrency(item.value, currency)}
              </ThemedText>
            </View>
          )}
        />

        {/* Graphique en camembert */}
        <View style={styles.pieContainer}>
          <View style={styles.pieChartWrapper}>
            <PieChart
              data={pieData}
              donut
              showGradient
              sectionAutoFocus
              radius={80}
              innerRadius={40}
              innerCircleColor={theme.colors.background}
              textColor={theme.colors.foreground}
              textSize={12}
              focusOnPress
              onPress={(item: any, index: number) => {
                // Haptique ou autre feedback
              }}
            />
          </View>

          <View style={styles.pieLegend}>
            {pieData.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <View>
                  <ThemedText variant="sm" weight="medium">{item.label}</ThemedText>
                  <ThemedText variant="xs" color="mutedForeground">{item.text}</ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  tooltip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pieContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 24,
    paddingVertical: 16,
  },
  pieChartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieLegend: {
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});