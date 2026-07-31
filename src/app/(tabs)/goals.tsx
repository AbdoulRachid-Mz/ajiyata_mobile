// src/app/(tabs)/goals.tsx

import React, {
  useRef,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import {
  View,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableOpacity,
  TextInput as NativeTextInput,
  SectionList,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  format,
  isToday,
  isYesterday,
  parseISO,
  differenceInDays,
} from "date-fns";
import { fr } from "date-fns/locale";

import SafeAreaView from "@/components/ui/safe-area-view";
import ThemedText from "@/components/ui/text";
import ThemedView from "@/components/ui/view";
import Modal from "@/components/ui/modal";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import { useTheme } from "@/contexts/theme-context";
import { useAppStore } from "@/stores/app-store";
import { useUIStore } from "@/stores/ui-store";
import {
  useSavingGoals,
  useUpdateSavingGoal,
  useDeleteSavingGoal,
  useCreateSavingGoal,
} from "@/features/saving-goals/hooks";
import { SavingGoalCard } from "@/components/finance/saving-goal-card";
import { ScreenSkeleton } from "@/components/ui/screen-skeleton";
import { SavingGoalWithRelations } from "@/types";
import { ScrollView, TextInput } from "@/components/ui";
import Toast from "react-native-toast-message";
import {
  goalIntelligence,
  GoalSuggestion,
} from "@/services/goal-intelligence.service";
import { generateUUID, getCurrentTimestamp } from "@/utils/uuid";
import { Storage } from "@/lib/storage";
import { useTranslation } from "react-i18next";

type GoalStatusFilter = "all" | "active" | "completed" | "paused";

// ---- Helpers ----

function formatCurrency(amount: number, currency = "XOF") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ---- Main Screen ----

export default function GoalsScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { currentAccount } = useAppStore();
  const { setTabBarVisible } = useUIStore();
  const accountId = currentAccount?.id || "";

  // États
  const [statusFilter, setStatusFilter] = useState<GoalStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Données
  const { data: goalsResult, isLoading, refetch } = useSavingGoals(accountId);
  const updateGoal = useUpdateSavingGoal();
  const deleteGoal = useDeleteSavingGoal();
  const createGoal = useCreateSavingGoal();

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"add" | "withdraw">("add");
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState("");

  // Suggestions
  const [suggestions, setSuggestions] = useState<GoalSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Charger les suggestions
  const loadSuggestions = useCallback(async () => {
    if (!accountId) return;
    setIsLoadingSuggestions(true);
    try {
      const result = await goalIntelligence.suggestGoals(accountId);
      setSuggestions(result);
      setShowSuggestions(result.length > 0);
      console.log(`📊 Suggestions d'objectifs chargées: ${result.length}`);
    } catch (error) {
      console.error("Error loading goal suggestions:", error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [accountId]);

  // Charger les suggestions au montage
  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  // Pull to Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
      await loadSuggestions();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: t("common.refresh_success"),
        text2: t("goals.refresh_success"),
      });
    } catch (error) {
      console.error("Refresh error:", error);
      Toast.show({
        type: "error",
        text1: t("common.error"),
        text2: t("errors.refresh_failed"),
      });
    } finally {
      setRefreshing(false);
    }
  }, [refetch, loadSuggestions, t]);

  // Créer un objectif depuis une suggestion
  const handleCreateFromSuggestion = useCallback(
    async (suggestion: GoalSuggestion) => {
      if (!currentAccount) return;

      const deviceId = (await Storage.getCurrentDeviceId()) || "unknown-device";

      try {
        await createGoal.mutateAsync({
          id: generateUUID(),
          accountId: currentAccount.id,
          title: suggestion.title,
          targetAmount: suggestion.suggestedTarget,
          currentAmount: 0,
          deadline: suggestion.deadline || undefined,
          status: "active",
          createdAt: getCurrentTimestamp(),
          updatedAt: getCurrentTimestamp(),
          deviceId,
          version: 1,
          syncStatus: "pending",
          metadata: {},
        });

        Toast.show({ type: "success", text1: t("goals.create_success") });

        // Retirer la suggestion
        setSuggestions((prev) =>
          prev.filter((s) => s.title !== suggestion.title),
        );
        if (suggestions.length <= 1) {
          setShowSuggestions(false);
        }

        refetch();
      } catch (error) {
        console.error("Error creating goal from suggestion:", error);
        Toast.show({ type: "error", text1: t("errors.create_failed") });
      }
    },
    [currentAccount, createGoal, refetch, t, suggestions.length],
  );

  // Gestion du scroll
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

  // Transform goals with relations et tri
  const goalsWithRelations = useMemo(() => {
    const rawGoals = goalsResult?.data || (Array.isArray(goalsResult) ? goalsResult : []);
    if (!rawGoals || rawGoals.length === 0) return [];

    const now = new Date();

    return rawGoals
      .map((g) => ({
        ...g,
        account: currentAccount
          ? {
              id: currentAccount.id,
              userId: currentAccount.userId,
              name: currentAccount.name,
              type: currentAccount.type,
              currency: currentAccount.currency,
            }
          : null,
        priorityScore:
          g.status === "active" ? 0 : g.status === "paused" ? 1 : 2,
        daysUntilDeadline: g.deadline
          ? differenceInDays(new Date(g.deadline), now)
          : null,
      }))
      .sort((a, b) => {
        if (a.priorityScore !== b.priorityScore) {
          return a.priorityScore - b.priorityScore;
        }
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }) as SavingGoalWithRelations[];
  }, [goalsResult, currentAccount]);

  // Filtrage
  const filteredGoals = useMemo(() => {
    let result = goalsWithRelations;

    if (statusFilter !== "all") {
      result = result.filter((g) => g.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((g) => g.title.toLowerCase().includes(query));
    }

    return result;
  }, [goalsWithRelations, statusFilter, searchQuery]);

  // Groupement par date
  const groupedGoals = useMemo(() => {
    const groups: { [key: string]: SavingGoalWithRelations[] } = {};

    filteredGoals.forEach((goal) => {
      const dateObj =
        typeof goal.createdAt === "string"
          ? parseISO(goal.createdAt)
          : new Date(goal.createdAt);

      let dateKey = "";

      if (isToday(dateObj)) {
        dateKey = t("periods.today");
      } else if (isYesterday(dateObj)) {
        dateKey = t("periods.yesterday");
      } else {
        dateKey = format(dateObj, "EEEE d MMMM yyyy", { locale: fr });
      }

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(goal);
    });

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
      count: groups[key].length,
    }));
  }, [filteredGoals, t]);

  // Statistiques
  const stats = useMemo(() => {
    const total = goalsWithRelations.length;
    const active = goalsWithRelations.filter(
      (g) => g.status === "active",
    ).length;
    const completed = goalsWithRelations.filter(
      (g) => g.status === "completed",
    ).length;
    const paused = goalsWithRelations.filter(
      (g) => g.status === "paused",
    ).length;

    const totalTarget = goalsWithRelations.reduce(
      (sum, g) => sum + Number(g.targetAmount || 0),
      0,
    );
    const totalSaved = goalsWithRelations.reduce(
      (sum, g) => sum + Number(g.currentAmount || 0),
      0,
    );

    return { total, active, completed, paused, totalTarget, totalSaved };
  }, [goalsWithRelations]);

  // Handlers
  const handleEdit = (id: string) => {
    router.push(`/saving-goal-edit?id=${id}`);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      t("goals.delete_title"),
      t("goals.delete_confirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => {
            deleteGoal.mutate(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            refetch();
          },
        },
      ],
    );
  };

  const openFundsModal = (id: string, type: "add" | "withdraw") => {
    setSelectedGoalId(id);
    setModalType(type);
    setAmountInput("");
    setIsModalOpen(true);
  };

  const handleConfirmFunds = () => {
    if (!selectedGoalId || !amountInput) return;
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(t("common.error"), t("errors.invalid_amount"));
      return;
    }

    const goal = goalsWithRelations?.find((g: SavingGoalWithRelations) => g.id === selectedGoalId);
    if (!goal) return;

    let newAmount = goal.currentAmount;
    if (modalType === "add") {
      newAmount += amount;
    } else {
      newAmount = Math.max(0, newAmount - amount);
    }

    updateGoal.mutate({
      goalId: selectedGoalId,
      data: { currentAmount: newAmount },
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsModalOpen(false);
    refetch();
  };

  const statusTabs: {
    label: string;
    value: GoalStatusFilter;
    icon: string;
    count: number;
  }[] = [
    { label: t("common.all"), value: "all", icon: "apps-outline", count: stats.total },
    {
      label: t("goals.active"),
      value: "active",
      icon: "trending-up-outline",
      count: stats.active,
    },
    {
      label: t("goals.completed"),
      value: "completed",
      icon: "checkmark-circle-outline",
      count: stats.completed,
    },
    {
      label: t("goals.paused"),
      value: "paused",
      icon: "pause-outline",
      count: stats.paused,
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
            {t("goals.title")}
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
              onPress={() => router.push("/saving-goal-create")}
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
              <NativeTextInput
                style={{
                  flex: 1,
                  paddingVertical: theme.spacing.sm,
                  paddingHorizontal: theme.spacing.sm,
                  color: theme.colors.foreground,
                  fontSize: 16,
                }}
                placeholder={t("goals.search_placeholder")}
                placeholderTextColor={theme.colors.mutedForeground}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
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

        {/* Goal Suggestions */}
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
                backgroundColor: theme.financialColors.saving + "10",
                borderWidth: 1,
                borderColor: theme.financialColors.saving + "30",
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
                  style={{ color: theme.financialColors.saving }}
                >
                  💡 {t("goals.suggestions")}
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
                  key={suggestion.title}
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
                      {suggestion.title}
                    </ThemedText>
                    <ThemedText variant="xs" color="mutedForeground">
                      {formatCurrency(suggestion.suggestedTarget)}
                      {suggestion.deadline &&
                        ` · ${t("goals.deadline")}: ${format(new Date(suggestion.deadline), "dd/MM/yyyy")}`}
                      {" · "}
                      {Math.round(suggestion.confidence * 100)}% {t("common.confidence")}
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
                      backgroundColor: theme.financialColors.saving,
                      borderRadius: theme.borderRadius.sm,
                    }}
                  >
                    <ThemedText
                      variant="xs"
                      style={{ color: "#fff", fontWeight: "600" }}
                    >
                      {t("common.create")}
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
                    {t("common.see_all")} ({suggestions.length})
                  </ThemedText>
                </TouchableOpacity>
              )}
            </Card>
          </View>
        )}

        {/* Compact Stats */}
        {goalsWithRelations.length > 0 && (
          <View
            style={{
              flexDirection: "row",
              gap: 12,
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.sm,
              backgroundColor: theme.colors.muted + "30",
            }}
          >
            <View style={{ flex: 1 }}>
              <ThemedText variant="xs" color="mutedForeground">
                {t("goals.total_saved")}
              </ThemedText>
              <ThemedText variant="base" weight="bold">
                {formatCurrency(stats.totalSaved, currency)}
              </ThemedText>
            </View>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <ThemedText variant="xs" color="mutedForeground">
                {t("goals.total_target")}
              </ThemedText>
              <ThemedText variant="base" weight="bold">
                {formatCurrency(stats.totalTarget, currency)}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Content */}
        {isLoading ? (
          <ScreenSkeleton type="goals" />
        ) : groupedGoals.length === 0 ? (
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
                name="trophy-outline"
                size={40}
                color={theme.colors.primary}
              />
            </View>
            <ThemedText
              variant="xl"
              weight="bold"
              style={{ marginBottom: 8, textAlign: "center" }}
            >
              {searchQuery
                ? t("goals.no_results")
                : t("goals.no_goals")}
            </ThemedText>
            <ThemedText
              color="mutedForeground"
              style={{ textAlign: "center", lineHeight: 22, marginBottom: 24 }}
            >
              {searchQuery
                ? t("goals.no_results_description", { query: searchQuery })
                : t("goals.create_first_description")}
            </ThemedText>
            {!searchQuery && (
              <TouchableOpacity
                onPress={() => router.push("/saving-goal-create")}
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
                  {t("goals.create")}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <SectionList
            sections={groupedGoals}
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
                  {count} {t("goals.goal")}{count > 1 ? "s" : ""}
                </ThemedText>
              </View>
            )}
            renderItem={({ item }) => (
              <View style={{ paddingHorizontal: theme.spacing.lg }}>
                <SavingGoalCard
                  goal={item}
                  onEdit={() => handleEdit(item.id)}
                  onDelete={() => handleDelete(item.id)}
                  onAddFunds={() => openFundsModal(item.id, "add")}
                  onWithdraw={() => openFundsModal(item.id, "withdraw")}
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

        {/* FAB */}
        <TouchableOpacity
          style={{
            position: "absolute",
            bottom: 100,
            right: theme.spacing.lg,
            backgroundColor: theme.colors.primary,
            width: 56,
            height: 56,
            borderRadius: 28,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
          }}
          onPress={() => router.push("/saving-goal-create")}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>

        {/* Modal Add/Withdraw Funds */}
        <Modal visible={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <ThemedView style={{ padding: theme.spacing.lg }}>
            <ThemedText
              variant="lg"
              weight="bold"
              style={{ marginBottom: theme.spacing.md }}
            >
              {modalType === "add"
                ? t("goals.add_funds_title")
                : t("goals.withdraw_title")}
            </ThemedText>
            <TextInput
              label={t("finance.amount")}
              placeholder={t("common.amount_placeholder")}
              keyboardType="numeric"
              value={amountInput}
              onChangeText={setAmountInput}
              style={{ marginBottom: theme.spacing.lg }}
            />
            <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
              <Button
                variant="outline"
                style={{ flex: 1 }}
                onPress={() => setIsModalOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button style={{ flex: 1 }} onPress={handleConfirmFunds}>
                {t("common.confirm")}
              </Button>
            </View>
          </ThemedView>
        </Modal>
      </ThemedView>
    </SafeAreaView>
  );
}