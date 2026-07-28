// Fichier: src/app/(tabs)/budgets.tsx

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  View,
  TouchableOpacity,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleSheet,
  TextInput,
  SectionList,
  RefreshControl,
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
  differenceInDays,
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
  useBudgetsWithPeriod,
  useCreateBudget,
  useDeleteBudget,
  useExpiredBudgets,
} from "@/features/budgets/hooks";
import { useCategories } from "@/features/categories/hooks";
import { useTransactions } from "@/features/transactions/hooks";
import { BudgetCard } from "@/components/finance/budget-card";
import { ScreenSkeleton } from "@/components/ui/screen-skeleton";
import { BudgetWithRelations } from "@/types";
import Toast from "react-native-toast-message";
import { Storage } from "@/lib/storage";
import {
  budgetIntelligence,
  BudgetSuggestion,
} from "@/services/budget-intelligence.service";
import { ScrollView } from "@/components/ui";

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
  const [refreshing, setRefreshing] = useState(false);

  // Données
  const { data: budgets, isLoading, refetch } = useBudgetsWithPeriod(accountId);
  const { data: categories } = useCategories(accountId);
  const { data: transactions } = useTransactions(accountId);
  const deleteBudget = useDeleteBudget(accountId);
  const createBudget = useCreateBudget();

  // Suggestions
  const [suggestions, setSuggestions] = useState<BudgetSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Charger les suggestions
  // const loadSuggestions = useCallback(async () => {
  //   if (!accountId) return;
  //   setIsLoadingSuggestions(true);
  //   try {
  //     const result = await budgetIntelligence.suggestBudgets(accountId);
  //     // Filtrer les suggestions qui n'ont pas déjà un budget
  //     const filtered = result.filter((s) => !s.hasExistingBudget);
  //     setSuggestions(filtered);
  //     setShowSuggestions(filtered.length > 0);
  //     console.log(`📊 Suggestions chargées: ${filtered.length}`);
  //   } catch (error) {
  //     console.error("Error loading suggestions:", error);
  //   } finally {
  //     setIsLoadingSuggestions(false);
  //   }
  // }, [accountId]);

  const loadSuggestions = useCallback(async () => {
  if (!accountId) return;
  setIsLoadingSuggestions(true);
  try {
    const result = await budgetIntelligence.suggestBudgets(accountId);
    const filtered = result.filter((s) => !s.hasExistingBudget);
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  } catch (error) {
    console.error("Error loading suggestions:", error);
  } finally {
    setIsLoadingSuggestions(false);
  }
}, [accountId, transactions]);

  // Charger les suggestions au montage
  useEffect(() => {
    // refresh suggestions
    loadSuggestions();
  }, [loadSuggestions]);

  // Pull to Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
      await loadSuggestions();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Refresh error:", error);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible de rafraîchir",
      });
    } finally {
      setRefreshing(false);
    }
  }, [refetch, loadSuggestions]);

  // Créer un budget depuis une suggestion
  const handleCreateFromSuggestion = useCallback(
    async (suggestion: BudgetSuggestion) => {
      if (!currentAccount) return;

      const deviceId = (await Storage.getCurrentDeviceId()) || "unknown-device";
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      switch (suggestion.period) {
        case "daily":
          startDate = startOfDay(now);
          endDate = endOfDay(now);
          break;
        case "weekly":
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          endDate = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case "monthly":
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        default:
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
      }

      try {
        await createBudget.mutateAsync({
          id: generateUUID(),
          accountId: currentAccount.id,
          categoryId: suggestion.categoryId,
          limit: suggestion.suggestedLimit,
          spent: 0,
          period: suggestion.period,
          startDate,
          endDate,
          status: "active",
          createdAt: getCurrentTimestamp(),
          updatedAt: getCurrentTimestamp(),
          deviceId,
          version: 1,
          syncStatus: "pending",
          metadata: {},
        });

        Toast.show({ type: "success", text1: "Budget créé avec succès" });

        // Retirer la suggestion de la liste
        setSuggestions((prev) =>
          prev.filter((s) => s.categoryId !== suggestion.categoryId),
        );
        if (suggestions.length <= 1) {
          setShowSuggestions(false);
        }

        // Rafraîchir la liste
        refetch();
      } catch (error) {
        console.error("Error creating budget from suggestion:", error);
        Toast.show({ type: "error", text1: "Erreur lors de la création" });
      }
    },
    [currentAccount, createBudget, refetch],
  );

  // Gestionnaires CRUD
  const handleDelete = useCallback(
    (budgetId: string) => {
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
                refetch();
              } catch (e) {
                console.error("Delete error", e);
                Alert.alert("Erreur", "Impossible de supprimer le budget.");
              }
            },
          },
        ],
      );
    },
    [deleteBudget, refetch],
  );

  const handleDuplicate = useCallback(
    async (budget: BudgetWithRelations) => {
      try {
        const deviceId =
          (await Storage.getCurrentDeviceId()) || "unknown-device";
        const accountId = budget.accountId || currentAccount?.id;

        if (!accountId) {
          Toast.show({
            type: "error",
            text1: "Erreur",
            text2: "Compte manquant",
          });
          return;
        }

        const newBudget = {
          id: generateUUID(),
          accountId: accountId,
          categoryId: budget.categoryId,
          limit: budget.limit,
          spent: 0,
          period: budget.period,
          startDate: new Date(budget.startDate),
          endDate: new Date(budget.endDate),
          status: "active" as const,
          createdAt: getCurrentTimestamp(),
          updatedAt: getCurrentTimestamp(),
          deviceId: deviceId,
          version: 1,
          syncStatus: "pending" as const,
          metadata: {},
        };

        await createBudget.mutateAsync(newBudget);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show({ type: "success", text1: "Budget dupliqué avec succès" });
        refetch();
      } catch (e) {
        console.error("Duplication error:", e);
        Toast.show({ type: "error", text1: "Erreur lors de la duplication" });
      }
    },
    [currentAccount, createBudget, refetch],
  );

  // UI - Gestion du scroll
  const lastScrollY = useRef(0);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentScrollY = event.nativeEvent.contentOffset.y;
      if (currentScrollY < 0) return;
      if (currentScrollY > lastScrollY.current + 10) {
        setTabBarVisible(false);
      } else if (currentScrollY < lastScrollY.current - 10) {
        setTabBarVisible(true);
      }
      lastScrollY.current = currentScrollY;
    },
    [setTabBarVisible],
  );

  // Mapping des catégories
  const categoryMap = useMemo(() => {
    const map: Record<string, any> = {};
    if (!categories) return map;
    for (const cat of categories) {
      map[cat.id] = cat;
    }
    return map;
  }, [categories]);

  // Calcul des dépenses par budget et tri
  const budgetsWithSpent = useMemo(() => {
    if (!budgets) return [];

    const now = new Date();

    const processed = budgets.map((budget) => {
      let start, end;
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

      let status = budget.status;
      if (status === "active" && spent > budget.limit) {
        status = "exceeded";
      }

      // Calculer le nombre de jours restants
      const daysUntilEnd = differenceInDays(end, now);
      const daysUntilStart = differenceInDays(start, now);
      const totalDays = differenceInDays(end, start);

      // Score pour le tri : priorité aux budgets actifs les plus proches
      const priorityScore =
        status === "active" ? 0 : status === "exceeded" ? 1 : 2;

      return {
        ...budget,
        spent,
        status,
        category: categoryMap[budget.categoryId],
        periodStart: start,
        periodEnd: end,
        daysUntilEnd,
        daysUntilStart,
        totalDays,
        progress: totalDays > 0 ? daysUntilStart / totalDays : 0,
        priorityScore,
      };
    });

    // Tri par date de début la plus proche d'aujourd'hui
    return processed.sort((a, b) => {
      // D'abord par statut (active > exceeded > completed)
      if (a.priorityScore !== b.priorityScore) {
        return a.priorityScore - b.priorityScore;
      }

      // Ensuite par date de début la plus proche (ascendant)
      const aStart = new Date(a.startDate).getTime();
      const bStart = new Date(b.startDate).getTime();
      return aStart - bStart;
    });
  }, [budgets, transactions, categoryMap]);

  // Filtrage et recherche
  const filteredBudgets = useMemo(() => {
    let result = budgetsWithSpent;

    if (statusFilter !== "all") {
      result = result.filter((b) => b.status === statusFilter);
    }

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

    filteredBudgets.forEach((budget) => {
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

  const statusTabs = [
    {
      label: "Tous",
      value: "all" as BudgetStatusFilter,
      icon: "apps-outline",
      count: stats.total,
    },
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

  const currency = currentAccount?.currency || "XOF";

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

        {/* Search Bar */}
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

        {/* Status Filter Tabs */}
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
                setStatusFilter(tab.value as BudgetStatusFilter);
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

        {/* Budget Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <View
            style={{
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.sm,
            }}
          >
            <Card
              style={{
                padding: theme.spacing.md,
                backgroundColor: theme.colors.primary + "10",
                borderWidth: 1,
                borderColor: theme.colors.primary + "30",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: theme.spacing.sm,
                }}
              >
                <ThemedText
                  variant="sm"
                  weight="bold"
                  style={{ color: theme.colors.primary }}
                >
                  💡 Suggestions de budgets
                </ThemedText>
                <TouchableOpacity onPress={() => setShowSuggestions(false)}>
                  <Ionicons
                    name="close"
                    size={20}
                    color={theme.colors.mutedForeground}
                  />
                </TouchableOpacity>
              </View>

              {suggestions.slice(0, 3).map((suggestion) => (
                <View
                  key={suggestion.categoryId}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: theme.spacing.xs,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border + "50",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <ThemedText variant="sm" weight="semibold">
                      {suggestion.categoryName}
                    </ThemedText>
                    <ThemedText variant="xs" color="mutedForeground">
                      {formatCurrency(suggestion.suggestedLimit)} /{" "}
                      {suggestion.period === "daily"
                        ? "jour"
                        : suggestion.period === "weekly"
                          ? "semaine"
                          : "mois"}
                      {" · "}
                      {Math.round(suggestion.confidence * 100)}% confiance
                    </ThemedText>
                    <ThemedText variant="xs" color="mutedForeground">
                      {suggestion.reason}
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleCreateFromSuggestion(suggestion)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: theme.colors.primary,
                      borderRadius: theme.borderRadius.sm,
                    }}
                  >
                    <ThemedText
                      variant="xs"
                      style={{ color: "#fff", fontWeight: "600" }}
                    >
                      Créer
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              ))}

              {suggestions.length > 3 && (
                <TouchableOpacity
                  onPress={() => setShowSuggestions(false)}
                  style={{ marginTop: theme.spacing.sm }}
                >
                  <ThemedText
                    variant="xs"
                    color="mutedForeground"
                    style={{ textAlign: "center" }}
                  >
                    Voir toutes les suggestions ({suggestions.length})
                  </ThemedText>
                </TouchableOpacity>
              )}
            </Card>
          </View>
        )}

        {/* Content */}
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
              <ThemedView
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <TouchableOpacity
                  onPress={() => router.push("/budget-create")}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingHorizontal: 20,
                    paddingVertical: 8,
                    backgroundColor: theme.colors.primary,
                    borderRadius: theme.borderRadius.lg,
                  }}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <ThemedText weight="semibold" style={{ color: "#fff" }}>
                    Créer un budget
                  </ThemedText>
                </TouchableOpacity>

                {/* refresh data */}
                <TouchableOpacity
                  onPress={() => onRefresh()}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingHorizontal: 20,
                    paddingVertical: 8,
                    backgroundColor: theme.colors.primary,
                    borderRadius: theme.borderRadius.lg,
                  }}
                >
                  <Ionicons name="refresh" size={20} color="#fff" />
                  <ThemedText weight="semibold" style={{ color: "#fff" }}>
                    Actualiser
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
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
                  onDuplicate={(budget) => handleDuplicate(budget)}
                />
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 120 }}
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
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}
