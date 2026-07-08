import React, { useState, useMemo } from "react";
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
  ActivityIndicator,
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SectionList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { TransactionFilters } from "@/features/transactions/types/filters";
import { filterTransactions, getFilterSummary } from "@/utils/filter-utils";
import { Transaction } from "@/types";
import { ScreenSkeleton } from "@/components/ui/screen-skeleton";
// import { filterTransactions, getFilterSummary } from '@/features/transactions/utils/filter-utils';

export default function TransactionsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { currentAccount } = useAppStore();
  const {
    data: transactions,
    isLoading,
    refetch,
  } = useTransactions(currentAccount?.id || "");
  const deleteTransaction = useDeleteTransaction(currentAccount?.id || "");
  // État des filtres
  const [filters, setFilters] = useState<TransactionFilters>({
    type: "all",
    sortField: "date",
    sortDirection: "desc",
    search: "",
    categoryIds: [],
    presetDate: "month",
  });
  const [showFilters, setShowFilters] = useState(false);

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
      // date is likely string or Date, parse it safely
      const dateObj =
        typeof tx.date === "string"
          ? parseISO(tx.date as string)
          : new Date(tx.date);
      let dateKey = "";

      if (isToday(dateObj)) {
        dateKey = "Aujourd'hui";
      } else if (isYesterday(dateObj)) {
        dateKey = "Hier";
      } else {
        // e.g. "4 juillet 2026"
        dateKey = format(dateObj, "d MMMM yyyy", { locale: fr });
      }

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(tx);
    });

    return Object.keys(groups).map((key) => ({
      title: key,
      data: groups[key],
    }));
  }, [filteredTransactions]);

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
            deleteTransaction.mutate(transaction.id, {
              onSuccess: () => {
                refetch();
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
            Transactions
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
                />
              </View>
            )}
            onRefresh={refetch}
            refreshing={isLoading}
            ListEmptyComponent={
              <View style={{ padding: 40, alignItems: "center" }}>
                <ThemedText color="mutedForeground">
                  {hasActiveFilters
                    ? "Aucune transaction ne correspond aux filtres"
                    : "Aucune transaction trouvée"}
                </ThemedText>
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
                    Réinitialiser les filtres
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
