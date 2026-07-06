import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

import SafeAreaView from '@/components/ui/safe-area-view';
import ThemedText from '@/components/ui/text';
import ThemedView from '@/components/ui/view';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import { useTheme } from '@/contexts/theme-context';
import { useAppStore } from '@/stores/app-store';
import { useTransactions } from '@/features/transactions/hooks';
import { useCategories } from '@/features/categories/hooks';
import { exportData, ExportOptions } from '@/lib/export/export-service';

type ExportFormat = 'pdf' | 'json' | 'excel';
type PeriodKey = 'week' | 'month' | 'year' | 'all';

const FORMAT_OPTIONS: { key: ExportFormat; label: string; icon: string; desc: string }[] = [
  { key: 'pdf', label: 'PDF', icon: 'document-text-outline', desc: 'Rapport formaté avec tableau' },
  { key: 'json', label: 'JSON', icon: 'code-slash-outline', desc: 'Données brutes structurées' },
  { key: 'excel', label: 'Excel', icon: 'grid-outline', desc: 'Feuille de calcul (.xlsx)' },
];

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: 'week', label: 'Cette semaine' },
  { key: 'month', label: 'Ce mois' },
  { key: 'year', label: 'Cette année' },
  { key: 'all', label: 'Tout' },
];

function formatCurrency(amount: number, currency = 'XOF') {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getPeriodRange(key: PeriodKey): { start: Date; end: Date } | undefined {
  const now = new Date();
  switch (key) {
    case 'week':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'year':
      return { start: startOfYear(now), end: endOfYear(now) };
    case 'all':
      return undefined;
  }
}

export default function ExportScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { currentAccount } = useAppStore();
  const { data: allTransactions } = useTransactions(currentAccount?.id || '');
  const { data: categories } = useCategories(currentAccount?.id || '');

  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [periodKey, setPeriodKey] = useState<PeriodKey>('month');
  const [isExporting, setIsExporting] = useState(false);

  const currency = currentAccount?.currency || 'XOF';

  const period = useMemo(() => getPeriodRange(periodKey), [periodKey]);

  const filteredTransactions = useMemo(() => {
    if (!allTransactions) return [];
    if (!period) return allTransactions;
    return allTransactions.filter(tx => {
      const d = new Date(tx.date);
      return d >= period.start && d <= period.end;
    });
  }, [allTransactions, period]);

  const summary = useMemo(() => {
    let income = 0, expense = 0;
    filteredTransactions.forEach(tx => {
      if (tx.type === 'income') income += Number(tx.amount);
      else if (tx.type === 'expense') expense += Number(tx.amount);
    });
    return { income, expense, count: filteredTransactions.length };
  }, [filteredTransactions]);

  const handleExport = async () => {
    if (filteredTransactions.length === 0) {
      Alert.alert('Aucune donnée', 'Aucune transaction à exporter pour cette période.');
      return;
    }

    setIsExporting(true);
    try {
      await exportData({
        format,
        transactions: filteredTransactions,
        period,
        accountName: currentAccount?.name,
        currency,
        categories: categories || [],
      });
    } catch (error: any) {
      Alert.alert('Erreur', error?.message || 'Impossible d\'exporter les données.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 40 }}>
        {/* Header */}
        <ThemedView
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: theme.spacing.lg,
            gap: theme.spacing.md,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: theme.colors.primary + '20',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <ThemedText variant="2xl" weight="bold">
            Exporter les données
          </ThemedText>
        </ThemedView>

        {/* Format selection */}
        <ThemedText variant="sm" weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
          Format
        </ThemedText>
        <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
          {FORMAT_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setFormat(opt.key)}
              activeOpacity={0.7}
            >
              <Card
                style={{
                  padding: theme.spacing.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing.md,
                  borderWidth: format === opt.key ? 2 : 1,
                  borderColor: format === opt.key ? theme.colors.primary : theme.colors.border,
                  backgroundColor: format === opt.key ? theme.colors.primary + '08' : theme.colors.card,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: format === opt.key ? theme.colors.primary + '20' : theme.colors.muted,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={22}
                    color={format === opt.key ? theme.colors.primary : theme.colors.mutedForeground}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText variant="base" weight="semibold">
                    {opt.label}
                  </ThemedText>
                  <ThemedText variant="xs" color="mutedForeground">
                    {opt.desc}
                  </ThemedText>
                </View>
                {format === opt.key && (
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                )}
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Period selection */}
        <ThemedText variant="sm" weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
          Période
        </ThemedText>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.lg, flexWrap: 'wrap' }}>
          {PERIOD_OPTIONS.map(opt => (
            <Button
              key={opt.key}
              variant={periodKey === opt.key ? 'default' : 'outline'}
              size="sm"
              onPress={() => setPeriodKey(opt.key)}
              style={{ minWidth: 100 }}
            >
              {opt.label}
            </Button>
          ))}
        </View>

        {/* Preview */}
        <ThemedText variant="sm" weight="semibold" style={{ marginBottom: theme.spacing.sm }}>
          Aperçu
        </ThemedText>
        <Card style={{ padding: theme.spacing.md, marginBottom: theme.spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <ThemedText variant="sm" color="mutedForeground">Transactions</ThemedText>
            <ThemedText variant="sm" weight="bold">{summary.count}</ThemedText>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <ThemedText variant="sm" color="mutedForeground">Revenus</ThemedText>
            <ThemedText variant="sm" weight="bold" style={{ color: '#16a34a' }}>
              {formatCurrency(summary.income, currency)}
            </ThemedText>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <ThemedText variant="sm" color="mutedForeground">Dépenses</ThemedText>
            <ThemedText variant="sm" weight="bold" style={{ color: '#dc2626' }}>
              {formatCurrency(summary.expense, currency)}
            </ThemedText>
          </View>
        </Card>
      </ScrollView>

      {/* Footer */}
      <ThemedView
        style={{
          padding: theme.spacing.lg,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        }}
      >
        <Button
          size="lg"
          disabled={isExporting || summary.count === 0}
          onPress={handleExport}
        >
          {isExporting ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator size="small" color="#fff" />
              <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Exportation...</ThemedText>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="download-outline" size={20} color="#fff" />
              <ThemedText style={{ color: '#fff', fontWeight: '600' }}>
                Exporter en {format.toUpperCase()}
              </ThemedText>
            </View>
          )}
        </Button>
      </ThemedView>
    </SafeAreaView>
  );
}
