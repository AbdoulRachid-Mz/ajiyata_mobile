import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import SafeAreaView from "@/components/ui/safe-area-view";
import Spacer from "@/components/ui/spacer";
import ThemedText from "@/components/ui/text";
import ThemedView from "@/components/ui/view";
import { useTheme } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, View, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { useRef } from "react";

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
import { CategoryBreakdownChart } from "@/components/charts/CategoryBreakdownChart";
import { IncomeExpenseChart } from "@/components/charts/IncomeExpenseChart";
import { BalanceCard } from "@/components/finance/balance-card";
import { QuickStats } from "@/components/finance/QuickStats";
import { TransactionItem } from "@/components/finance/transaction-item";

// Utilitaires
import { calculateFinancialSummary } from "@/lib/finance/calculations";
import { Transaction } from "@/types";

export default function Dashboard() {
  const { theme } = useTheme();
  const router = useRouter();
  const { currentAccount } = useAppStore();
  const accountId = currentAccount?.id || "";

  // États
  const [period, setPeriod] = useState<"weekly" | "monthly" | "yearly">(
    "monthly",
  );

  // Données
  const { data: allTransactions, isLoading: isLoadingAll } =
    useTransactions(accountId);
  const { data: categories } = useCategories(accountId);
  const { data: recentTransactions, isLoading: isLoadingRecent } =
    useRecentTransactions(accountId);
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

  const isLoading = isLoadingAll || isLoadingRecent;

  // Gestionnaires d'actions
  const handleDeleteTransaction = (transaction: Transaction) => {
    Alert.alert(
      "Supprimer la transaction",
      `Voulez-vous vraiment supprimer "${transaction.title}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
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
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
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
              Bonjour,
            </ThemedText>
            <ThemedText variant="2xl" weight="bold">
              {currentAccount?.name || "Tableau de bord"}
            </ThemedText>
          </ThemedView>
          {/* <Button
            variant="ghost"
            size="sm"
            onPress={() => router.push("/settings")}
          >
            <Ionicons
              name="settings-outline"
              size={22}
              color={theme.colors.foreground}
            />
          </Button> */}
        </ThemedView>

        {/* Balance Card */}
        <BalanceCard
          balance={summary.totalBalance}
          income={summary.totalIncome}
          expense={summary.totalExpense}
          currency={currentAccount?.currency || "XOF"}
          transactionsCount={allTransactions?.length || 0}
        />

        {/* Quick Stats */}
        {/* <QuickStats
          totalIncome={summary.totalIncome}
          totalExpense={summary.totalExpense}
          balance={summary.totalBalance}
          currency={currentAccount?.currency || "XOF"}
          transactionCount={allTransactions?.length || 0}
        /> */}

                {/* Actions rapides */}
        <ThemedText
          variant="lg"
          weight="semibold"
          style={{ marginBottom: theme.spacing.md }}
        >
          Actions rapides
        </ThemedText>
        <View
          style={{
            flexDirection: "row",
            gap: theme.spacing.md,
            marginBottom: theme.spacing.lg,
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="default"
            style={{
              flex: 1,
              minWidth: "45%",
              backgroundColor: theme.financialColors.income,
              borderRadius: theme.borderRadius.xl,
              paddingVertical: theme.spacing.lg,
            }}
            onPress={() =>
              router.push({
                pathname: "/transaction-create",
                params: { type: "income" },
              })
            }
          >
            <Ionicons
              name="add-circle"
              size={24}
              color={theme.colors.primaryForeground}
            />
            <ThemedText
              style={{
                marginLeft: theme.spacing.sm,
                color: theme.colors.primaryForeground,
                fontWeight: "600",
              }}
            >
              Revenu
            </ThemedText>
          </Button>
          <Button
            variant="default"
            style={{
              flex: 1,
              minWidth: "45%",
              backgroundColor: theme.financialColors.expense,
              borderRadius: theme.borderRadius.xl,
              paddingVertical: theme.spacing.lg,
            }}
            onPress={() =>
              router.push({
                pathname: "/transaction-create",
                params: { type: "expense" },
              })
            }
          >
            <Ionicons
              name="remove-circle"
              size={24}
              color={theme.colors.primaryForeground}
            />
            <ThemedText
              style={{
                marginLeft: theme.spacing.sm,
                color: theme.colors.primaryForeground,
                fontWeight: "600",
              }}
            >
              Dépense
            </ThemedText>
          </Button>
          <Button
            variant="outline"
            style={{
              flex: 1,
              minWidth: "45%",
              borderRadius: theme.borderRadius.xl,
              paddingVertical: theme.spacing.lg,
              borderWidth: 1.5,
            }}
            onPress={() => router.push("/budget-create")}
          >
            <Ionicons
              name="wallet-outline"
              size={24}
              color={theme.colors.foreground}
            />
            <ThemedText
              style={{ marginLeft: theme.spacing.sm, fontWeight: "600" }}
            >
              Budget
            </ThemedText>
          </Button>
          <Button
            variant="outline"
            style={{
              flex: 1,
              minWidth: "45%",
              borderRadius: theme.borderRadius.xl,
              paddingVertical: theme.spacing.lg,
              borderWidth: 1.5,
            }}
            onPress={() => router.push("/saving-goal-create")}
          >
            <Ionicons
              name="trending-up-outline"
              size={24}
              color={theme.colors.foreground}
            />
            <ThemedText
              style={{ marginLeft: theme.spacing.sm, fontWeight: "600" }}
            >
              Épargne
            </ThemedText>
          </Button>
          <Button
            variant="secondary"
            style={{
              flex: 1,
              width: "100%",
              borderRadius: theme.borderRadius.xl,
              paddingVertical: theme.spacing.lg,
            }}
            // Calculatrice
            // @ts-ignore
            onPress={() => router.push("/calculator")}
          >
            <Ionicons
              name="calculator-outline"
              size={24}
              color={theme.colors.foreground}
            />
            <ThemedText
              style={{ marginLeft: theme.spacing.sm, fontWeight: "600" }}
            >
              Calculatrice
            </ThemedText>
          </Button>
        </View>

        {/* Graphiques */}
        <Card
          style={{ marginBottom: theme.spacing.md, padding: theme.spacing.md }}
        >
          <ThemedView
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: theme.spacing.sm,
            }}
          >
            <ThemedText variant="lg" weight="semibold">
              Évolution
            </ThemedText>
            <View style={{ flexDirection: "row", gap: theme.spacing.xs }}>
              {(["weekly", "monthly", "yearly"] as const).map((p) => (
                <Button
                  key={p}
                  variant={period === p ? "default" : "ghost"}
                  size="sm"
                  onPress={() => setPeriod(p)}
                  style={{ paddingHorizontal: theme.spacing.sm }}
                >
                  {p === "weekly" ? "Sem." : p === "monthly" ? "Mois" : "An"}
                </Button>
              ))}
            </View>
          </ThemedView>

          {isLoading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : (
            <IncomeExpenseChart
              transactions={allTransactions || []}
              currency={currentAccount?.currency || "XOF"}
              period={period}
            />
          )}
        </Card>

        {/* Catégories */}
        <Card
          style={{ marginBottom: theme.spacing.md, padding: theme.spacing.md }}
        >
          <CategoryBreakdownChart
            transactions={allTransactions || []}
            categories={categories || []}
            currency={currentAccount?.currency || "XOF"}
          />
        </Card>


        {/* Transactions récentes */}
        <ThemedView
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: theme.spacing.md,
          }}
        >
          <ThemedText variant="lg" weight="semibold">
            Transactions récentes
          </ThemedText>
          {recentTransactions && recentTransactions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onPress={() => router.push("/transactions")}
            >
              Voir tout
            </Button>
          )}
        </ThemedView>

        {isLoading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        ) : recentTransactions && recentTransactions.length > 0 ? (
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
              Aucune operation pour le moment
            </ThemedText>
            <Spacer height={theme.spacing.md} />
            <Button
              variant="outline"
              onPress={() => router.push("/transaction-create")}
            >
              Ajouter ma première operation
            </Button>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
