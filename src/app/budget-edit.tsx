// src/app/budget-edit.tsx

import Button from "@/components/ui/button";
import KeyboardAvoidingView from "@/components/ui/keyboard-avoiding-view";
import SafeAreaView from "@/components/ui/safe-area-view";
import Spacer from "@/components/ui/spacer";
import ThemedText from "@/components/ui/text";
import TextInput from "@/components/ui/text-input";
import ThemedView from "@/components/ui/view";
import { useTheme } from "@/contexts/theme-context";
import { useUpdateBudget, useBudgets } from "@/features/budgets/hooks";
import { CategoryPicker } from "@/features/categories/components/category-picker";
import {
  BudgetFormData,
  BudgetFormInput,
  budgetFormSchema,
} from "@/lib/validation";
import { useAppStore } from "@/stores/app-store";
import { getCurrentTimestamp } from "@/utils/uuid";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo } from "react";
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
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";
import { Budget } from "@/types";

export default function BudgetEdit() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const budgetId = params.id as string;
  const { currentAccount } = useAppStore();

  const accountId = currentAccount?.id || "";
  const { data: bgResult } = useBudgets(accountId);
  const bgList = useMemo(() => bgResult?.data || (Array.isArray(bgResult) ? bgResult : []), [bgResult]);
  const budget = useMemo(() => {
    return bgList.find((b: Budget) => b.id === budgetId);
  }, [bgList, budgetId]);

  const updateBudget = useUpdateBudget();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormInput, any, BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      categoryId: "",
      limit: "",
      period: "monthly",
    },
  });

  useEffect(() => {
    if (budget) {
      reset({
        categoryId: budget.categoryId,
        limit: budget.limit.toString(),
        period: budget.period as typeof budget.period._.data,
      });
    }
  }, [budget, reset]);

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
   * Vérifier si un budget existe déjà pour la même période (hors celui en cours d'édition)
   */
  const isDuplicateBudget = (categoryId: string, period: string): boolean => {
    if (!bgList || bgList.length === 0) return false;

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

    return bgList.some((b: Budget) => {
      // Ignorer le budget en cours d'édition
      if (b.id === budgetId) return false;

      // Vérifier si le budget est actif
      if (b.status !== "active") return false;

      // Vérifier si c'est la même catégorie
      if (b.categoryId !== categoryId) return false;

      // Vérifier si c'est la même période
      if (b.period !== period) return false;

      // Vérifier si les dates se chevauchent
      const bStart = new Date(b.startDate);
      const bEnd = new Date(b.endDate);

      return (
        isWithinInterval(periodStart, { start: bStart, end: bEnd }) ||
        isWithinInterval(periodEnd, { start: bStart, end: bEnd })
      );
    });
  };

  const onSubmit = async (data: BudgetFormData) => {
    if (!currentAccount) return;

    const hasDuplicate = isDuplicateBudget(data.categoryId, data.period);

    const performUpdate = async () => {
      try {
        // Recalculer les dates de la période
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

        await updateBudget.mutateAsync({
          id: budgetId,
          data: {
            categoryId: data.categoryId,
            limit: data.limit,
            period: data.period,
            startDate: startDate,
            endDate: endDate,
            updatedAt: getCurrentTimestamp(),
            syncStatus: "pending",
          },
        });
        Toast.show({ type: "success", text1: t("budgets.edit_success") });
        router.back();
      } catch (error) {
        console.error("Failed to update budget:", error);
        Alert.alert(t("common.error"), t("errors.update_failed"));
      }
    };

    if (hasDuplicate) {
      Alert.alert(
        t("budgets.duplicate_title"),
        t("budgets.duplicate_edit_message"),
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("budgets.update_anyway"), onPress: performUpdate },
        ],
      );
    } else {
      await performUpdate();
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
            <ThemedText variant="2xl" weight="bold">
              {t("budgets.edit")}
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
            {isSubmitting ? t("common.loading") : t("common.save")}
          </Button>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}