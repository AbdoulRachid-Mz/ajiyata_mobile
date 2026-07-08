import React, { useMemo, useRef, useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleSheet,
  TextInput,
  SectionList,
} from "react-native";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  isToday,
  isYesterday,
  format,
  parseISO,
} from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import SafeAreaView from "@/components/ui/safe-area-view";
import ThemedText from "@/components/ui/text";
import ThemedView from "@/components/ui/view";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { useTheme } from "@/contexts/theme-context";
import { useAppStore } from "@/stores/app-store";
import { useUIStore } from "@/stores/ui-store";
import { generateUUID, getCurrentTimestamp } from "@/utils/uuid";
import {
  useBudgets,
  useCreateBudget,
  useDeleteBudget,
} from "@/features/budgets/hooks";
import { useCategories } from "@/features/categories/hooks";
import { useTransactions } from "@/features/transactions/hooks";
import { BudgetCard } from "@/components/finance/budget-card";
import { ScreenSkeleton } from "@/components/ui/screen-skeleton";
import { Budget } from "@/types";

// ---- Helpers ----

function formatCurrency(amount: number, currency = "XOF") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

type BudgetStatusFilter = "all" | "active" | "exceeded" | "completed";

// ---- Main Screen ----

export default function BudgetsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { currentAccount } = useAppStore();
  const { setTabBarVisible } = useUIStore();
  const accountId = currentAccount?.id || "";

  // États
  const [statusFilter, setStatusFilter] = useState<BudgetStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const { data: budgets, isLoading } = useBudgets(accountId);
  const { data: categories } = useCategories(accountId);
  const { data: transactions } = useTransactions(accountId);
  const deleteBudget = useDeleteBudget(accountId);
  const createBudget = useCreateBudget();

  const { setTabBarVisible: setTabBarVisibleGlobal } = useUIStore();
  const lastScrollY = useRef(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    if (currentScrollY < 0) return;
    if (currentScrollY > lastScrollY.current + 10) {
      setTabBarVisibleGlobal(false);
    } else if (currentScrollY < lastScrollY.current - 10) {
      setTabBarVisibleGlobal(true);
    }
    lastScrollY.current = currentScrollY;
  };

  const categoryMap = useMemo(() => {
    const map: Record<string, any> = {};
    if (!categories) return map;
    for (const cat of categories) {
      map[cat.id] = cat;
    }
    return map;
  }, [categories]);

  // Calcul des dépenses par budget
  const budgetsWithSpent = useMemo(() => {
    if (!budgets) return [];

    return budgets.map((budget) => {
      let start, end;
      const now = new Date();
      if (budget.period === "daily") {
        start = startOfDay(now);
        end = endOfDay(now);
      } else if (budget.period === "weekly") {
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
      } else {
        start = startOfMonth(now);
        end = endOfMonth(now);
      }

      let spent = 0;
      if (transactions) {
        for (const tx of transactions) {
          if (tx.categoryId === budget.categoryId && tx.type === "expense") {
            const txDate = new Date(tx.date);
            if (isWithinInterval(txDate, { start, end })) {
              spent += Number(tx.amount);
            }
          }
        }
      }

      // Déterminer le statut réel
      let status = budget.status;
      if (status === "active" && spent > budget.limit) {
        status = "exceeded";
      }

      return {
        ...budget,
        spent,
        status,
        category: categoryMap[budget.categoryId],
      };
    });
  }, [budgets, transactions, categoryMap]);

  // Filtrage par statut et recherche
  const filteredBudgets = useMemo(() => {
    let result = budgetsWithSpent;

    // Filtre par statut
    if (statusFilter !== "all") {
      result = result.filter((b) => b.status === statusFilter);
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((b) => {
        const categoryName = b.category?.name || "Inconnue";
        return (
          categoryName.toLowerCase().includes(query) ||
          b.id.toLowerCase().includes(query)
        );
      });
    }

    return result;
  }, [budgetsWithSpent, statusFilter, searchQuery]);

  // Groupement par date
  const groupedBudgets = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    const now = new Date();

    filteredBudgets.forEach((budget) => {
      // Utiliser la date de début du budget pour le groupement
      const dateObj =
        typeof budget.startDate === "string"
          ? parseISO(budget.startDate)
          : new Date(budget.startDate);

      let dateKey = "";

      if (isToday(dateObj)) {
        dateKey = "Aujourd'hui";
      } else if (isYesterday(dateObj)) {
        dateKey = "Hier";
      } else {
        dateKey = format(dateObj, "EEEE d MMMM yyyy", { locale: fr });
      }

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(budget);
    });

    // Trier les groupes par date (du plus récent au plus ancien)
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === "Aujourd'hui") return -1;
      if (b === "Aujourd'hui") return 1;
      if (a === "Hier") return -1;
      if (b === "Hier") return 1;
      return a.localeCompare(b);
    });

    return sortedKeys.map((key) => ({
      title: key,
      data: groups[key],
      count: groups[key].length,
    }));
  }, [filteredBudgets]);

  // Statistiques
  const stats = useMemo(() => {
    const total = budgetsWithSpent.length;
    const active = budgetsWithSpent.filter((b) => b.status === "active").length;
    const exceeded = budgetsWithSpent.filter(
      (b) => b.status === "exceeded",
    ).length;
    const completed = budgetsWithSpent.filter(
      (b) => b.status === "completed",
    ).length;

    const totalLimit = budgetsWithSpent.reduce(
      (sum, b) => sum + Number(b.limit || 0),
      0,
    );
    const totalSpent = budgetsWithSpent.reduce(
      (sum, b) => sum + (b.spent || 0),
      0,
    );

    return { total, active, exceeded, completed, totalLimit, totalSpent };
  }, [budgetsWithSpent]);

  const currency = currentAccount?.currency || "XOF";

  // Gestionnaires
  const handleDelete = (budgetId: string) => {
    Alert.alert(
      "Supprimer le budget",
      "Êtes-vous sûr de vouloir supprimer ce budget ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteBudget.mutateAsync(budgetId);
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
            } catch (e) {
              console.error("Delete error", e);
              Alert.alert("Erreur", "Impossible de supprimer le budget.");
            }
          },
        },
      ],
    );
  };

  const handleDuplicate = async (budget: any) => {
    try {
      await createBudget.mutateAsync({
        ...budget,
        id: generateUUID(),
        spent: 0,
        status: "active",
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
        syncStatus: "pending",
      } as any);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error("Duplication error", e);
      Alert.alert("Erreur", "Impossible de dupliquer le budget.");
    }
  };

  const statusTabs: {
    label: string;
    value: BudgetStatusFilter;
    icon: string;
    count: number;
  }[] = [
    { label: "Tous", value: "all", icon: "apps-outline", count: stats.total },
    {
      label: "Actifs",
      value: "active",
      icon: "checkmark-circle-outline",
      count: stats.active,
    },
    {
      label: "Dépassés",
      value: "exceeded",
      icon: "alert-circle-outline",
      count: stats.exceeded,
    },
    {
      label: "Terminés",
      value: "completed",
      icon: "flag-outline",
      count: stats.completed,
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ThemedView style={{ flex: 1 }}>
        {/* Header */}
        <ThemedView
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}
        >
          <ThemedText variant="xl" weight="bold">
            Budgets
          </ThemedText>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={() => setShowSearch(!showSearch)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: showSearch
                  ? theme.colors.primary + "20"
                  : "transparent",
              }}
            >
              <Ionicons
                name="search-outline"
                size={22}
                color={
                  showSearch ? theme.colors.primary : theme.colors.foreground
                }
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/budget-create")}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.colors.primary + "20",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="add" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </ThemedView>

        {/* Barre de recherche */}
        {showSearch && (
          <View
            style={{
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.sm,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: theme.colors.muted,
                borderRadius: theme.borderRadius.md,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.xs,
              }}
            >
              <Ionicons
                name="search"
                size={20}
                color={theme.colors.mutedForeground}
              />
              <TextInput
                style={{
                  flex: 1,
                  paddingVertical: theme.spacing.sm,
                  paddingHorizontal: theme.spacing.sm,
                  color: theme.colors.foreground,
                  fontSize: 16,
                }}
                placeholder="Rechercher un budget..."
                placeholderTextColor={theme.colors.mutedForeground}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={theme.colors.mutedForeground}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Tabs de filtrage */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.sm,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            maxHeight: 50,
          }}
          contentContainerStyle={{ gap: theme.spacing.sm }}
        >
          {statusTabs.map((tab) => (
            <TouchableOpacity
              key={tab.value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStatusFilter(tab.value);
              }}
              style={[
                {
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.xs,
                  borderRadius: theme.borderRadius.full,
                  borderWidth: 1,
                  gap: 6,
                },
                statusFilter === tab.value
                  ? {
                      backgroundColor: theme.colors.primary,
                      borderColor: theme.colors.primary,
                    }
                  : {
                      backgroundColor: "transparent",
                      borderColor: theme.colors.border,
                    },
              ]}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={
                  statusFilter === tab.value
                    ? "#fff"
                    : theme.colors.mutedForeground
                }
              />
              <ThemedText
                variant="sm"
                style={{
                  color:
                    statusFilter === tab.value
                      ? "#fff"
                      : theme.colors.mutedForeground,
                  fontWeight: statusFilter === tab.value ? "600" : "400",
                }}
              >
                {tab.label}
              </ThemedText>
              {tab.count > 0 && (
                <View
                  style={{
                    backgroundColor:
                      statusFilter === tab.value
                        ? "rgba(255,255,255,0.2)"
                        : theme.colors.muted,
                    borderRadius: 10,
                    paddingHorizontal: 6,
                    paddingVertical: 1,
                    minWidth: 20,
                    alignItems: "center",
                  }}
                >
                  <ThemedText
                    variant="xs"
                    style={{
                      color:
                        statusFilter === tab.value
                          ? "#fff"
                          : theme.colors.mutedForeground,
                    }}
                  >
                    {tab.count}
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Contenu */}
        {isLoading ? (
          <ScreenSkeleton type="budgets" />
        ) : groupedBudgets.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              padding: theme.spacing.xl,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: theme.colors.primary + "15",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: theme.spacing.lg,
              }}
            >
              <Ionicons
                name="pie-chart-outline"
                size={40}
                color={theme.colors.primary}
              />
            </View>
            <ThemedText
              variant="xl"
              weight="bold"
              style={{ marginBottom: 8, textAlign: "center" }}
            >
              {searchQuery ? "Aucun budget trouvé" : "Aucun budget"}
            </ThemedText>
            <ThemedText
              color="mutedForeground"
              style={{ textAlign: "center", lineHeight: 22, marginBottom: 24 }}
            >
              {searchQuery
                ? `Aucun budget ne correspond à "${searchQuery}"`
                : "Créez votre premier budget pour mieux contrôler vos dépenses par catégorie."}
            </ThemedText>
            {!searchQuery && (
              <TouchableOpacity
                onPress={() => router.push("/budget-create")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.borderRadius.lg,
                }}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <ThemedText weight="semibold" style={{ color: "#fff" }}>
                  Créer un budget
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <SectionList
            sections={groupedBudgets}
            keyExtractor={(item) => item.id}
            renderSectionHeader={({ section: { title, count } }) => (
              <View
                style={{
                  paddingHorizontal: theme.spacing.lg,
                  paddingVertical: theme.spacing.sm,
                  backgroundColor: theme.colors.background,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <ThemedText variant="sm" weight="bold" color="mutedForeground">
                  {title}
                </ThemedText>
                <ThemedText variant="xs" color="mutedForeground">
                  {count} budget{count > 1 ? "s" : ""}
                </ThemedText>
              </View>
            )}
            renderItem={({ item }) => (
              <View style={{ paddingHorizontal: theme.spacing.lg }}>
                <BudgetCard
                  budget={item}
                  category={item.category}
                  onEdit={(b) => router.push(`/budget-edit?id=${b.id}`)}
                  onDelete={(budget) => handleDelete(budget.id)}
                  onDuplicate={(budget) => handleDuplicate(budget.id)}
                />
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}
