// src/app/budget-create.tsx

import Button from "@/components/ui/button";
import KeyboardAvoidingView from "@/components/ui/keyboard-avoiding-view";
import SafeAreaView from "@/components/ui/safe-area-view";
import Spacer from "@/components/ui/spacer";
import ThemedText from "@/components/ui/text";
import TextInput from "@/components/ui/text-input";
import ThemedView from "@/components/ui/view";
import { useTheme } from "@/contexts/theme-context";
import { useCreateBudget, useBudgets } from "@/features/budgets/hooks";
import { CategoryPicker } from "@/features/categories/components/category-picker";
import {
  BudgetFormData,
  BudgetFormInput,
  budgetFormSchema,
} from "@/lib/validation";
import { useAppStore } from "@/stores/app-store";
import { generateUUID, getCurrentTimestamp } from "@/utils/uuid";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, TouchableOpacity, View, Alert } from "react-native";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from "date-fns";
import { useState, useMemo } from "react";
import Toast from "react-native-toast-message";
import { budgetRepository } from "@/features/budgets/repositories";
import { useDevice } from "@/hooks/use-device";
import { useTranslation } from "react-i18next";

export default function BudgetCreate() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { currentAccount } = useAppStore();
  const createBudget = useCreateBudget();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<BudgetFormInput, any, BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      categoryId: "",
      limit: "",
      period: "monthly" as "monthly" | "weekly" | "daily",
      count: 1,
    },
  });
  // Dans le formulaire, ajouter un sélecteur de nombre
  const [budgetCount, setBudgetCount] = useState(1);
  // Ajouter watch pour count
  const count = watch("count");

  const { data: bgResult } = useBudgets(currentAccount?.id || "");
  const existingBudgets = useMemo(() => bgResult?.data || (Array.isArray(bgResult) ? bgResult : []), [bgResult]);
  const { deviceId } = useDevice();

  // Fonction de création multiple
  const createMultipleBudgets = async (data: BudgetFormData) => {
    if (!currentAccount) {
      Toast.show({
        type: "error",
        text1: t("common.error"),
        text2: t("errors.account_missing"),
      });
      return;
    }

    const now = new Date();
    const budgetsToCreate = [];

    for (let i = 0; i < data.count; i++) {
      let startDate: Date;
      let endDate: Date;

      const offset = i * getPeriodDays(data.period);
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() + offset);
      endDate = new Date(startDate);

      switch (data.period) {
        case "daily":
          endDate.setDate(endDate.getDate() + 1);
          break;
        case "weekly":
          endDate.setDate(endDate.getDate() + 7);
          break;
        case "monthly":
          endDate.setMonth(endDate.getMonth() + 1);
          break;
      }

      budgetsToCreate.push({
        id: generateUUID(),
        accountId: currentAccount.id,
        categoryId: data.categoryId,
        limit: data.limit,
        spent: 0,
        period: data.period,
        startDate: startDate,
        endDate: endDate,
        status: "active" as const,
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
        deviceId: deviceId,
        version: 1,
        syncStatus: "pending" as const,
        metadata: {},
      });
    }

    // Créer tous les budgets en parallèle
    await Promise.all(budgetsToCreate.map((b) => budgetRepository.create(b)));

    Toast.show({
      type: "success",
      text1: t("budgets.create_success", { count: budgetsToCreate.length }),
      text2: t("budgets.create_success_multiple", { count: budgetsToCreate.length }),
    });
    router.back();
  };

  // Helper function to get the number of days in a period type
  const getPeriodDays = (period: string): number => {
    switch (period) {
      case "daily":
        return 1;
      case "weekly":
        return 7;
      case "monthly":
        return 30;
      default:
        return 1;
    }
  };

  // Helper pour le libellé de la période
  const getPeriodLabel = (period: string): string => {
    switch (period) {
      case "daily":
        return t("budgets.daily");
      case "weekly":
        return t("budgets.weekly");
      case "monthly":
        return t("budgets.monthly");
      default:
        return "";
    }
  };

  /**
   * Vérifier si un budget existe déjà pour la même période
   */
  const isDuplicateBudget = (categoryId: string, period: string): boolean => {
    if (!existingBudgets) return false;

    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    switch (period) {
      case "daily":
        periodStart = startOfDay(now);
        periodEnd = endOfDay(now);
        break;
      case "weekly":
        periodStart = startOfWeek(now, { weekStartsOn: 1 });
        periodEnd = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case "monthly":
        periodStart = startOfMonth(now);
        periodEnd = endOfMonth(now);
        break;
      default:
        return false;
    }

    return existingBudgets.some((budget) => {
      if (budget.status !== "active") return false;
      if (budget.categoryId !== categoryId) return false;
      if (budget.period !== period) return false;

      const budgetStart = new Date(budget.startDate);
      const budgetEnd = new Date(budget.endDate);

      return (
        isWithinInterval(periodStart, { start: budgetStart, end: budgetEnd }) ||
        isWithinInterval(periodEnd, { start: budgetStart, end: budgetEnd })
      );
    });
  };

  const onSubmit = async (data: BudgetFormData) => {
    if (!currentAccount) {
      Alert.alert(t("common.error"), t("errors.account_missing"));
      return;
    }

    // Si plus d'un budget, utiliser la création multiple
    if (data.count > 1) {
      await createMultipleBudgets(data);
      return;
    }

    // Vérifier si un doublon existe dans la même période
    const hasDuplicate = isDuplicateBudget(data.categoryId, data.period);

    const performCreation = async () => {
      try {
        const now = new Date();
        let startDate: Date;
        let endDate: Date;

        switch (data.period) {
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
            startDate = now;
            endDate = now;
        }

        const newBudget = {
          id: generateUUID(),
          accountId: currentAccount.id,
          categoryId: data.categoryId,
          limit: data.limit,
          spent: 0,
          period: data.period,
          startDate: startDate,
          endDate: endDate,
          status: "active" as const,
          createdAt: getCurrentTimestamp(),
          updatedAt: getCurrentTimestamp(),
          deviceId: deviceId,
          version: 1,
          syncStatus: "pending" as const,
          metadata: {},
        };

        await createBudget.mutateAsync(newBudget);
        Toast.show({ type: "success", text1: t("budgets.create_success") });
        router.back();
      } catch (error) {
        console.error("Failed to create budget:", error);
        Alert.alert(t("common.error"), t("errors.create_failed"));
      }
    };

    if (hasDuplicate) {
      Alert.alert(
        t("budgets.duplicate_title"),
        t("budgets.duplicate_message"),
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("budgets.create_anyway"), onPress: performCreation },
        ],
      );
    } else {
      await performCreation();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: theme.spacing.md }}
        >
          <ThemedView
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: theme.spacing.lg,
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: theme.colors.primary + "20",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
            <ThemedText variant="base" weight="bold">
              {t("budgets.create")}
            </ThemedText>
          </ThemedView>

          <ThemedText
            variant="sm"
            weight="medium"
            style={{ marginBottom: theme.spacing.xs }}
          >
            {t("finance.category")}
          </ThemedText>
          <Controller
            control={control}
            name="categoryId"
            render={({ field: { onChange, value } }) => (
              <CategoryPicker
                accountId={currentAccount?.id || ""}
                selectedId={value}
                type="expense"
                onSelect={(cat) => onChange(cat.id)}
              />
            )}
          />
          {errors.categoryId && (
            <ThemedText
              variant="xs"
              style={{
                color: theme.colors.destructive,
                marginTop: theme.spacing.xs,
              }}
            >
              {errors.categoryId.message}
            </ThemedText>
          )}

          <Spacer height={theme.spacing.md} />

          <Controller
            control={control}
            name="limit"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label={t("budgets.limit")}
                placeholder={t("common.amount_placeholder")}
                keyboardType="decimal-pad"
                onChangeText={onChange}
                value={value}
                error={!!errors.limit}
              />
            )}
          />
          {errors.limit && (
            <ThemedText
              variant="xs"
              style={{ color: theme.colors.destructive }}
            >
              {errors.limit.message}
            </ThemedText>
          )}

          <Spacer height={theme.spacing.lg} />

          <ThemedText
            variant="sm"
            weight="medium"
            style={{ marginBottom: theme.spacing.xs }}
          >
            {t("budgets.period_type")}
          </ThemedText>
          <Controller
            control={control}
            name="period"
            render={({ field: { onChange, value } }) => (
              <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
                {(["daily", "weekly", "monthly"] as const).map((p) => (
                  <Button
                    key={p}
                    variant={value === p ? "default" : "outline"}
                    style={{ flex: 1 }}
                    size="sm"
                    onPress={() => onChange(p)}
                  >
                    {getPeriodLabel(p)}
                  </Button>
                ))}
              </View>
            )}
          />

          {/* Nombre de budgets à créer */}
          <ThemedText
            variant="sm"
            weight="medium"
            style={{ marginBottom: theme.spacing.xs, marginTop: 30 }}
          >
            {t("budgets.create_count")}
          </ThemedText>
          <Controller
            control={control}
            name="count"
            render={({ field: { onChange, value } }) => (
              <View style={{ gap: theme.spacing.sm }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: theme.spacing.md,
                    marginTop: 20,
                    justifyContent: "space-around",
                  }}
                >
                  <TouchableOpacity
                    onPress={() => onChange(Math.max(1, (value || 1) - 1))}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      backgroundColor: theme.colors.destructive + "20",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons
                      name="remove"
                      size={40}
                      color={theme.colors.destructive}
                    />
                  </TouchableOpacity>

                  <ThemedText
                    variant="3xl"
                    weight="bold"
                    style={{ minWidth: 40, textAlign: "center" }}
                  >
                    {value || 1}
                  </ThemedText>

                  <TouchableOpacity
                    onPress={() => onChange((value || 1) + 1)}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      backgroundColor: theme.colors.primary + "20",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons
                      name="add"
                      size={40}
                      color={theme.colors.primary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Info sur l'intervalle */}
                <ThemedText
                  variant="xs"
                  color="mutedForeground"
                  style={{ textAlign: "center" }}
                >
                  {value > 1
                    ? t("budgets.create_count_info", { 
                        count: value, 
                        days: getPeriodDays(watch("period")) 
                      })
                    : t("budgets.single_budget")}
                </ThemedText>
              </View>
            )}
          />
        </ScrollView>

        <ThemedView
          style={{
            padding: theme.spacing.lg,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
          }}
        >
          <Button
            size="lg"
            disabled={isSubmitting}
            isFullWidth
            onPress={handleSubmit(onSubmit)}
          >
            {isSubmitting ? t("common.loading") : t("budgets.create")}
          </Button>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}