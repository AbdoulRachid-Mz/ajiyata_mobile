import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import SafeAreaView from "@/components/ui/safe-area-view";
import Spacer from "@/components/ui/spacer";
import ThemedText from "@/components/ui/text";
import ThemedView from "@/components/ui/view";
import { useTheme } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useMemo, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  View,
  NativeSyntheticEvent,
  NativeScrollEvent,
  RefreshControl,
  BackHandler,
} from "react-native";
import { useRef } from "react";
import Toast from "react-native-toast-message";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
} from "date-fns";

// Hooks
import { useCategories } from "@/features/categories/hooks";
import {
  useDeleteTransaction,
  useRecentTransactions,
  useTransactions,
} from "@/features/transactions/hooks";
import { useAppStore } from "@/stores/app-store";
import { useUIStore } from "@/stores/ui-store";

// Composants
import { BalanceCard } from "@/components/finance/balance-card";
import { TransactionItem } from "@/components/finance/transaction-item";

// Utilitaires
import { calculateFinancialSummary } from "@/lib/finance/calculations";
import { Transaction } from "@/types";
import { ScreenSkeleton } from "@/components/ui/screen-skeleton";
import { QuickActions } from "@/components/finance/QuickActions";
import { formatCurrency } from "@/lib/formatters/currency";


import { useTranslation } from "react-i18next";

export function FamilyDashboard() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { currentAccount } = useAppStore();
  const accountId = currentAccount?.id || "";

  // États
  const [refreshing, setRefreshing] = useState(false);

  // Double back press to exit
  const lastBackPressTime = useRef(0);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        const currentTime = new Date().getTime();

        if (currentTime - lastBackPressTime.current < 2000) {
          // Si l'utilisateur appuie deux fois en moins de 2 secondes, on quitte
          BackHandler.exitApp();
          return true;
        }

        lastBackPressTime.current = currentTime;
        Toast.show({
          type: 'success',
          text1: t('dashboard.press_back_again'),
          position: "bottom",
          bottomOffset: 20,
        });

        return true; // Empêche le comportement par défaut
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, []),
  );

  // Données
  const {
    data: txResult,
    isLoading: isLoadingAll,
    refetch: refetchAll,
  } = useTransactions(accountId);

  const allTransactions = useMemo(() => {
    return txResult?.data || (Array.isArray(txResult) ? txResult : []);
  }, [txResult]);
  const { data: categories } = useCategories(accountId);
  const {
    data: recentTransactions,
    isLoading: isLoadingRecent,
    refetch: refetchRecent,
  } = useRecentTransactions(accountId);
  const deleteTransaction = useDeleteTransaction(accountId);

  const { setTabBarVisible } = useUIStore();
  const lastScrollY = useRef(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    if (currentScrollY < 0) return;
    if (currentScrollY > lastScrollY.current + 10) {
      setTabBarVisible(false);
    } else if (currentScrollY < lastScrollY.current - 10) {
      setTabBarVisible(true);
    }
    lastScrollY.current = currentScrollY;
  };

  // Rafraîchissement
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchAll(), refetchRecent()]);
    setRefreshing(false);
  };

  // Calculs
  const summary = useMemo(() => {
    if (!allTransactions) {
      return {
        totalBalance: currentAccount?.initialBalance || 0,
        totalIncome: 0,
        totalExpense: 0,
        profit: 0,
      };
    }

    return calculateFinancialSummary(
      allTransactions,
      currentAccount?.initialBalance || 0,
    );
  }, [allTransactions, currentAccount?.initialBalance]);

  const currency = currentAccount?.currency || "XOF";

  const kpiStats = useMemo(() => {
    const txs = allTransactions || [];
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthTxs = txs.filter((tx) => {
      const d = new Date(tx.date);
      return isWithinInterval(d, { start: monthStart, end: monthEnd });
    });

    const dayOfMonth = now.getDate();
    const monthExpenses = monthTxs.filter((tx) => tx.type === "expense");
    const monthIncomes = monthTxs.filter((tx) => tx.type === "income");

    const totalMonthExpense = monthExpenses.reduce(
      (s, tx) => s + Number(tx.amount),
      0,
    );
    const totalMonthIncome = monthIncomes.reduce(
      (s, tx) => s + Number(tx.amount),
      0,
    );

    const avgDailyExpense = dayOfMonth > 0 ? totalMonthExpense / dayOfMonth : 0;
    const avgDailyIncome = dayOfMonth > 0 ? totalMonthIncome / dayOfMonth : 0;

    const highestExpense =
      monthExpenses.length > 0
        ? monthExpenses.reduce((max, tx) =>
            Number(tx.amount) > Number(max.amount) ? tx : max,
          )
        : null;

    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(weekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

    const thisWeekExpenses = txs
      .filter((tx) => {
        const d = new Date(tx.date);
        return (
          tx.type === "expense" &&
          isWithinInterval(d, { start: weekStart, end: weekEnd })
        );
      })
      .reduce((s, tx) => s + Number(tx.amount), 0);

    const lastWeekExpenses = txs
      .filter((tx) => {
        const d = new Date(tx.date);
        return tx.type === "expense" && d >= lastWeekStart && d <= lastWeekEnd;
      })
      .reduce((s, tx) => s + Number(tx.amount), 0);

    const weeklyTrend =
      lastWeekExpenses > 0
        ? ((thisWeekExpenses - lastWeekExpenses) / lastWeekExpenses) * 100
        : 0;

    const catSpending: Record<string, number> = {};
    monthExpenses.forEach((tx) => {
      if (tx.categoryId) {
        catSpending[tx.categoryId] =
          (catSpending[tx.categoryId] || 0) + Number(tx.amount);
      }
    });

    const topCategories = Object.entries(catSpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([catId, total]) => {
        const cat = (categories || []).find((c) => c.id === catId);
        return {
          id: catId,
          name: cat?.name || "Inconnu",
          color: cat?.color || "#888",
          total,
        };
      });

    return {
      avgDailyExpense,
      avgDailyIncome,
      highestExpense,
      thisWeekExpenses,
      lastWeekExpenses,
      weeklyTrend,
      topCategories,
    };
  }, [allTransactions, categories]);

  const isLoading = isLoadingAll || isLoadingRecent;

  // Gestionnaires d'actions
  const handleDeleteTransaction = (transaction: Transaction) => {
    Alert.alert(
      t('transactions.delete_title'),
      t('transactions.delete_confirm', { title: transaction.title }),
      [
        { text: t('common.cancel'), style: "cancel" },
        {
          text: t('common.delete'),
          style: "destructive",
          onPress: () => {
            deleteTransaction.mutate(transaction.id);
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Header */}
        <ThemedView
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: theme.spacing.lg,
          }}
        >
          <ThemedView>
            <ThemedText variant="sm" color="mutedForeground">
              {t('dashboard.hello')}
            </ThemedText>
            <ThemedText variant="2xl" weight="bold">
              {currentAccount?.name || t('dashboard.title')}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Balance Card - Toujours visible même en chargement */}
        <BalanceCard
          balance={summary.totalBalance}
          income={summary.totalIncome}
          expense={summary.totalExpense}
          currency={currentAccount?.currency || "XOF"}
          transactionsCount={allTransactions?.length || 0}
        />

        {/* Indicateur de chargement superposé sur le reste du contenu */}
        {isLoading && (
          <ScreenSkeleton type="dashboard" />
        )}

        {/* Le reste du contenu est toujours présent, mais peut être masqué si besoin */}
        {!isLoading && (
          <>
            {/* Quick Actions */}
            {/* <ThemedText
              variant="lg"
              weight="semibold"
              style={{
                marginTop: theme.spacing.md,
                marginBottom: theme.spacing.md,
              }}
            >
              Actions rapides
            </ThemedText> */}
            <QuickActions 
              variant="premium"
              layout="grid"
              compact={false}
              showAll={true}
              
            />

            {/* Statistiques */}
            <ThemedText
              variant="lg"
              weight="semibold"
              style={{ marginBottom: theme.spacing.md }}
            >
              {t('dashboard.monthly_stats')}
            </ThemedText>

            {/* KPI Grid */}
            <View
              style={{
                flexDirection: "row",
                gap: theme.spacing.sm,
                marginBottom: theme.spacing.md,
              }}
            >
              <Card style={{ flex: 1, padding: theme.spacing.md }}>
                <ThemedText variant="xs" color="mutedForeground">
                  {t('dashboard.avg_daily_expense')}
                </ThemedText>
                <ThemedText variant="xl" weight="bold">
                  {formatCurrency(kpiStats.avgDailyExpense, currency)}
                </ThemedText>
              </Card>
              <Card style={{ flex: 1, padding: theme.spacing.md }}>
                <ThemedText variant="xs" color="mutedForeground">
                  {t('dashboard.avg_daily_income')}
                </ThemedText>
                <ThemedText
                  variant="xl"
                  weight="bold"
                  style={{ color: theme.financialColors.income }}
                >
                  {formatCurrency(kpiStats.avgDailyIncome, currency)}
                </ThemedText>
              </Card>
            </View>

            {/* Weekly trend card */}
            <Card
              style={{
                padding: theme.spacing.md,
                marginBottom: theme.spacing.md,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View>
                  <ThemedText variant="xs" color="mutedForeground">
                    {t('dashboard.weekly_trend')}
                  </ThemedText>
                  <ThemedText variant="lg" weight="semibold">
                    {formatCurrency(kpiStats.thisWeekExpenses, currency)}
                  </ThemedText>
                  <ThemedText variant="xs" color="mutedForeground">
                    {t('dashboard.previous_week')}{" "}
                    {formatCurrency(kpiStats.lastWeekExpenses, currency)}
                  </ThemedText>
                </View>
                <View style={{ alignItems: "center" }}>
                  <Ionicons
                    name={
                      kpiStats.weeklyTrend <= 0
                        ? "trending-down"
                        : "trending-up"
                    }
                    size={28}
                    color={
                      kpiStats.weeklyTrend <= 0
                        ? theme.financialColors.income
                        : theme.financialColors.expense
                    }
                  />
                  <ThemedText
                    variant="sm"
                    weight="bold"
                    style={{
                      color:
                        kpiStats.weeklyTrend <= 0
                          ? theme.financialColors.income
                          : theme.financialColors.expense,
                    }}
                  >
                    {kpiStats.weeklyTrend > 0 ? "+" : ""}
                    {kpiStats.weeklyTrend.toFixed(0)}%
                  </ThemedText>
                </View>
              </View>
            </Card>

            {/* Highest transactions */}
            {kpiStats.highestExpense && (
              <Card
                style={{
                  padding: theme.spacing.md,
                  marginBottom: theme.spacing.md,
                }}
              >
                <ThemedText variant="xs" color="mutedForeground">
                  {t('dashboard.biggest_expense')}
                </ThemedText>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 4,
                  }}
                >
                  <ThemedText
                    variant="base"
                    weight="semibold"
                    numberOfLines={1}
                    style={{ flex: 1 }}
                  >
                    {kpiStats.highestExpense.title}
                  </ThemedText>
                  <ThemedText
                    variant="base"
                    weight="bold"
                    style={{ color: theme.financialColors.expense }}
                  >
                    {formatCurrency(kpiStats.highestExpense.amount, currency)}
                  </ThemedText>
                </View>
              </Card>
            )}

            {/* Top categories */}
            {kpiStats.topCategories.length > 0 && (
              <Card
                style={{
                  padding: theme.spacing.md,
                  marginBottom: theme.spacing.md,
                }}
              >
                <ThemedText
                  variant="sm"
                  weight="semibold"
                  style={{ marginBottom: theme.spacing.sm }}
                >
                  {t('dashboard.top_categories')}
                </ThemedText>
                {kpiStats.topCategories.map((cat, i) => (
                  <View
                    key={cat.id}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingVertical: 6,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: cat.color,
                        }}
                      />
                      <ThemedText variant="sm">{cat.name}</ThemedText>
                    </View>
                    <ThemedText variant="sm" weight="semibold">
                      {formatCurrency(cat.total, currency)}
                    </ThemedText>
                  </View>
                ))}
              </Card>
            )}

            {/* Export button */}
            {/* <Button
              variant="outline"
              style={{ marginBottom: theme.spacing.md, borderRadius: theme.borderRadius.xl, paddingVertical: theme.spacing.md }}
              onPress={() => router.push('/export')}
            >
              <Ionicons name="download-outline" size={20} color={theme.colors.foreground} />
              <ThemedText style={{ marginLeft: theme.spacing.sm, fontWeight: '600' }}>
                Exporter les données
              </ThemedText>
            </Button> */}
          </>
        )}

        {/* Transactions récentes - Toujours affiché, même en chargement */}
        <ThemedView
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: theme.spacing.md,
            marginTop: isLoading ? theme.spacing.md : 0,
          }}
        >
          <ThemedText variant="lg" weight="semibold">
            {t('dashboard.recent_transactions')}
          </ThemedText>
          {recentTransactions && recentTransactions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onPress={() => router.push("/transactions")}
            >
              {t('common.see_all')}
            </Button>
          )}
        </ThemedView>

        {recentTransactions && recentTransactions.length > 0 ? (
          <Card style={{ padding: theme.spacing.sm }}>
            {recentTransactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                onPress={() => {
                  router.push({
                    pathname: "/transaction-details",
                    params: { id: tx.id },
                  });
                }}
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
                onDoubleTap={handleEditTransaction}
              />
            ))}
          </Card>
        ) : (
          <Card style={{ padding: theme.spacing.lg, alignItems: "center" }}>
            <ThemedText color="mutedForeground" style={{ textAlign: "center" }}>
              {isLoading
                ? t('common.loading')
                : t('dashboard.no_transactions')}
            </ThemedText>
            {!isLoading && (
              <>
                <Spacer height={theme.spacing.md} />
                <Button
                  isFullWidth
                  variant="outline"
                  onPress={() => router.push("/transaction-create")}
                >
                  {t('dashboard.add_first_transaction')}
                </Button>
              </>
            )}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
