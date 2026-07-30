// src/app/(tabs)/transactions.tsx

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/theme-context";
import SafeAreaView from "@/components/ui/safe-area-view";
import ThemedView from "@/components/ui/view";
import ThemedText from "@/components/ui/text";
import Button from "@/components/ui/button";
import {
  useDeleteTransaction,
  useTransactions,
} from "@/features/transactions/hooks";
import { useAppStore } from "@/stores/app-store";
import { TransactionItem } from "@/components/finance/transaction-item";
import { TransactionFiltersModal } from "@/components/finance/TransactionFilters";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SectionList,
  RefreshControl,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { TransactionFilters } from "@/features/transactions/types/filters";
import { filterTransactions, getFilterSummary } from "@/utils/filter-utils";
import { Transaction } from "@/types";
import { ScreenSkeleton } from "@/components/ui/screen-skeleton";
import Card from "@/components/ui/card";
import { transactionIntelligence, TransactionInsight } from "@/services/transaction-intelligence.service";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";

export default function TransactionsScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { currentAccount } = useAppStore();
  const accountId = currentAccount?.id || "";
  
  const {
    data: transactions,
    isLoading,
    refetch,
  } = useTransactions(accountId);
  const deleteTransaction = useDeleteTransaction(accountId);
  
  // États des filtres
  const [filters, setFilters] = useState<TransactionFilters>({
    type: "all",
    sortField: "date",
    sortDirection: "desc",
    search: "",
    categoryIds: [],
    presetDate: "month",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // États pour les insights
  const [insights, setInsights] = useState<TransactionInsight[]>([]);
  const [showInsights, setShowInsights] = useState(true);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // Charger les insights
  const loadInsights = useCallback(async () => {
    if (!accountId) return;
    setIsLoadingInsights(true);
    try {
      const result = await transactionIntelligence.generateInsights(accountId);
      setInsights(result);
      setShowInsights(result.length > 0);
      console.log(`📊 Insights chargés: ${result.length}`);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setIsLoadingInsights(false);
    }
  }, [accountId]);

  // Charger les insights au montage
  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  // Pull to Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
      await loadInsights();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ 
        type: 'success', 
        text1: t('common.refresh_success'), 
        text2: t('transactions.refresh_success') 
      });
    } catch (error) {
      console.error('Refresh error:', error);
      Toast.show({ 
        type: 'error', 
        text1: t('common.error'), 
        text2: t('errors.refresh_failed') 
      });
    } finally {
      setRefreshing(false);
    }
  }, [refetch, loadInsights, t]);

  // Appliquer automatiquement les catégories
  const handleAutoCategorize = useCallback(async () => {
    if (!accountId) return;
    try {
      const result = await transactionIntelligence.autoApplyCategorySuggestions(accountId, 0.7);
      if (result.applied > 0) {
        Toast.show({ 
          type: 'success', 
          text1: t('transactions.auto_categorized_title', { count: result.applied }),
          text2: result.failed > 0 ? t('transactions.auto_categorized_failed', { count: result.failed }) : undefined
        });
        refetch();
        loadInsights();
      } else {
        Toast.show({ 
          type: 'info', 
          text1: t('transactions.no_auto_categorize'),
          text2: t('transactions.no_auto_categorize_desc')
        });
      }
    } catch (error) {
      console.error('Error auto-categorizing:', error);
      Toast.show({ 
        type: 'error', 
        text1: t('common.error'), 
        text2: t('errors.categorize_failed') 
      });
    }
  }, [accountId, refetch, loadInsights, t]);

  const handlePress = (transaction: Transaction) => {
    router.push({
      pathname: "/transaction-details",
      params: {
        id: transaction.id,
      },
    });
  };

  // Appliquer les filtres
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    return filterTransactions(transactions, filters);
  }, [transactions, filters]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.type !== "all" ||
      (filters.categoryIds && filters.categoryIds.length > 0) ||
      (filters.search && filters.search.trim().length > 0)
    );
  }, [filters]);

  const groupedTransactions = useMemo(() => {
    if (!filteredTransactions) return [];

    const groups: { [key: string]: Transaction[] } = {};

    filteredTransactions.forEach((tx) => {
      const dateObj =
        typeof tx.date === "string"
          ? parseISO(tx.date as string)
          : new Date(tx.date);
      let dateKey = "";

      if (isToday(dateObj)) {
        dateKey = t("periods.today");
      } else if (isYesterday(dateObj)) {
        dateKey = t("periods.yesterday");
      } else {
        dateKey = format(dateObj, "d MMMM yyyy", { locale: fr });
      }

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(tx);
    });

    // Trier les clés pour que "Aujourd'hui" et "Hier" soient en premier
    const todayKey = t("periods.today");
    const yesterdayKey = t("periods.yesterday");
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === todayKey) return -1;
      if (b === todayKey) return 1;
      if (a === yesterdayKey) return -1;
      if (b === yesterdayKey) return 1;
      return a.localeCompare(b);
    });

    return sortedKeys.map((key) => ({
      title: key,
      data: groups[key],
    }));
  }, [filteredTransactions, t]);

  // Statistiques
  const stats = useMemo(() => {
    const total = transactions?.length || 0;
    const income = transactions?.filter(tx => tx.type === 'income').length || 0;
    const expense = transactions?.filter(tx => tx.type === 'expense').length || 0;
    const transfer = transactions?.filter(tx => tx.type === 'transfer').length || 0;
    return { total, income, expense, transfer };
  }, [transactions]);

  // Gestionnaires d'actions
  const handleDeleteTransaction = (transaction: Transaction) => {
    Alert.alert(
      t("transactions.delete_title"),
      t("transactions.delete_confirm", { title: transaction.title }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => {
            deleteTransaction.mutate(transaction.id, {
              onSuccess: () => {
                refetch();
                loadInsights();
              },
            });
          },
        },
      ],
    );
  };

  const handleEditTransaction = (transaction: Transaction) => {
    router.push({
      pathname: "/transaction-edit",
      params: { id: transaction.id },
    });
  };

  // Rendu d'un insight
  const renderInsight = (insight: TransactionInsight) => {
    const colors = {
      info: theme.colors.primary,
      warning: theme.financialColors.budget,
      danger: theme.colors.destructive,
    };

    return (
      <Card
        key={`${insight.type}-${insight.title}`}
        style={{
          padding: theme.spacing.md,
          marginBottom: theme.spacing.sm,
          borderLeftWidth: 4,
          borderLeftColor: colors[insight.severity],
          backgroundColor: colors[insight.severity] + '10',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <ThemedText variant="sm" weight="semibold">
              {insight.title}
            </ThemedText>
            <ThemedText variant="xs" color="mutedForeground">
              {insight.description}
            </ThemedText>
          </View>
          {insight.actionable && insight.action && (
            <TouchableOpacity
              onPress={() => {
                if (insight.action?.route) {
                  router.push({
                    pathname: insight.action.route as any,
                    params: insight.action.params || {},
                  });
                }
              }}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: colors[insight.severity],
                borderRadius: theme.borderRadius.sm,
                marginLeft: 8,
              }}
            >
              <ThemedText variant="xs" style={{ color: '#fff', fontWeight: '600' }}>
                {insight.action.label}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ThemedView style={{ flex: 1 }}>
        {/* Header */}
        <ThemedView
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: theme.spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        >
          <ThemedText variant="xl" weight="bold">
            {t("transactions.title")}
          </ThemedText>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={() => setShowFilters(true)}
              style={{ padding: 4 }}
            >
              <Ionicons
                name="options-outline"
                size={24}
                color={
                  hasActiveFilters
                    ? theme.colors.primary
                    : theme.colors.foreground
                }
              />
              {hasActiveFilters && (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: theme.colors.primary },
                  ]}
                />
              )}
            </TouchableOpacity>
          </View>
        </ThemedView>

        {/* Statistiques rapides */}
        {transactions && transactions.length > 0 && (
          <View
            style={{
              flexDirection: 'row',
              gap: 8,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
              backgroundColor: theme.colors.muted + '30',
            }}
          >
            <View style={{ flex: 1, alignItems: 'center' }}>
              <ThemedText variant="xs" color="mutedForeground">{t('common.total')}</ThemedText>
              <ThemedText variant="sm" weight="bold">{stats.total}</ThemedText>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <ThemedText variant="xs" color="mutedForeground">{t('finance.income')}</ThemedText>
              <ThemedText variant="sm" weight="bold" style={{ color: theme.financialColors.income }}>
                {stats.income}
              </ThemedText>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <ThemedText variant="xs" color="mutedForeground">{t('finance.expense')}</ThemedText>
              <ThemedText variant="sm" weight="bold" style={{ color: theme.financialColors.expense }}>
                {stats.expense}
              </ThemedText>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <ThemedText variant="xs" color="mutedForeground">{t('finance.transfer')}</ThemedText>
              <ThemedText variant="sm" weight="bold" style={{ color: theme.financialColors.budget }}>
                {stats.transfer}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Résumé des filtres */}
        {hasActiveFilters && (
          <View
            style={[
              styles.filterSummary,
              { backgroundColor: theme.colors.muted },
            ]}
          >
            <ThemedText variant="xs" color="mutedForeground">
              {getFilterSummary(filters)}
            </ThemedText>
            <TouchableOpacity
              onPress={() =>
                setFilters({
                  type: "all",
                  sortField: "date",
                  sortDirection: "desc",
                  search: "",
                  categoryIds: [],
                  presetDate: "month",
                })
              }
            >
              <Ionicons name="close-circle" size={16} color={theme.colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        )}

        {/* Insights */}
        {showInsights && insights.length > 0 && !isLoading && (
          <View style={{ paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
              <ThemedText variant="sm" weight="bold" style={{ color: theme.colors.primary }}>
                💡 {t('transactions.insights')}
              </ThemedText>
              <TouchableOpacity onPress={() => setShowInsights(false)}>
                <Ionicons name="close" size={20} color={theme.colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {insights.slice(0, 3).map(renderInsight)}
            </ScrollView>
            {insights.length > 3 && (
              <TouchableOpacity onPress={() => setShowInsights(false)}>
                <ThemedText variant="xs" color="mutedForeground" style={{ textAlign: 'center', marginTop: 4 }}>
                  + {insights.length - 3} {t('common.others')}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Bouton de catégorisation automatique */}
        {transactions && transactions.some(tx => !tx.categoryId) && (
          <View style={{ paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.xs }}>
            <TouchableOpacity
              onPress={handleAutoCategorize}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                padding: theme.spacing.sm,
                backgroundColor: theme.colors.primary + '15',
                borderRadius: theme.borderRadius.md,
                borderWidth: 1,
                borderColor: theme.colors.primary + '30',
              }}
            >
              <Ionicons name="sparkles" size={16} color={theme.colors.primary} />
              <ThemedText variant="xs" style={{ color: theme.colors.primary, marginLeft: 6 }}>
                {t('transactions.auto_categorize')}
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Contenu */}
        {isLoading ? (
          <ScreenSkeleton type="transactions" />
        ) : (
          <SectionList
            sections={groupedTransactions}
            keyExtractor={(item) => item.id}
            renderSectionHeader={({ section: { title } }) => (
              <View
                style={{
                  paddingHorizontal: theme.spacing.lg,
                  paddingVertical: theme.spacing.sm,
                  backgroundColor: theme.colors.background,
                }}
              >
                <ThemedText variant="sm" weight="bold" color="mutedForeground">
                  {title}
                </ThemedText>
              </View>
            )}
            renderItem={({ item }) => (
              <View style={{ paddingHorizontal: theme.spacing.lg }}>
                <TransactionItem
                  transaction={item}
                  onEdit={handleEditTransaction}
                  onDelete={handleDeleteTransaction}
                  onDoubleTap={handleEditTransaction}
                  onPress={handlePress}
                />
              </View>
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={{ padding: 40, alignItems: "center" }}>
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: theme.colors.primary + '15',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: theme.spacing.lg,
                  }}
                >
                  <Ionicons name="list-outline" size={40} color={theme.colors.primary} />
                </View>
                <ThemedText variant="xl" weight="bold" style={{ marginBottom: 8, textAlign: 'center' }}>
                  {hasActiveFilters
                    ? t("transactions.no_matching")
                    : t("transactions.no_transactions")}
                </ThemedText>
                <ThemedText color="mutedForeground" style={{ textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
                  {hasActiveFilters
                    ? t("transactions.no_matching_desc")
                    : t("transactions.no_transactions_desc")}
                </ThemedText>
                {!hasActiveFilters && (
                  <TouchableOpacity
                    onPress={() => router.push("/transaction-create")}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      paddingHorizontal: 24,
                      paddingVertical: 12,
                      backgroundColor: theme.colors.primary,
                      borderRadius: theme.borderRadius.lg,
                    }}
                  >
                    <Ionicons name="add" size={20} color="#fff" />
                    <ThemedText weight="semibold" style={{ color: '#fff' }}>
                      {t("transactions.create")}
                    </ThemedText>
                  </TouchableOpacity>
                )}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={() =>
                      setFilters({
                        type: "all",
                        sortField: "date",
                        sortDirection: "desc",
                        search: "",
                        categoryIds: [],
                        presetDate: "month",
                      })
                    }
                    style={{ marginTop: 8 }}
                  >
                    {t("common.reset")}
                  </Button>
                )}
              </View>
            }
          />
        )}

        {/* Modal des filtres */}
        <TransactionFiltersModal
          visible={showFilters}
          filters={filters}
          onFiltersChange={setFilters}
          onClose={() => setShowFilters(false)}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterSummary: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});