import Button from "@/components/ui/button";
import KeyboardAvoidingView from "@/components/ui/keyboard-avoiding-view";
import SafeAreaView from "@/components/ui/safe-area-view";
import Spacer from "@/components/ui/spacer";
import ThemedText from "@/components/ui/text";
import TextInput from "@/components/ui/text-input";
import ThemedView from "@/components/ui/view";
import { useTheme } from "@/contexts/theme-context";
import { useCreateBudget } from "@/features/budgets/hooks";
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
import { ScrollView, TouchableOpacity, View } from "react-native";

export default function BudgetCreate() {
  const { theme } = useTheme();
  const router = useRouter();
  const { currentAccount } = useAppStore();
  const createBudget = useCreateBudget();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormInput, any, BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      categoryId: "",
      limit: "",
      period: "monthly",
    },
  });

  const onSubmit = async (data: BudgetFormData) => {
    if (!currentAccount) return;

    try {
      await createBudget.mutateAsync({
        id: generateUUID(),
        accountId: currentAccount.id,
        categoryId: data.categoryId,
        limit: data.limit,
        spent: 0,
        period: data.period,
        startDate: new Date(),
        endDate: new Date(), // Calculation logic needed here
        status: "active",
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
        deviceId: "temp-device-id",
        version: 1,
        syncStatus: "pending",
        metadata: {},
      });
      router.back();
    } catch (error) {
      console.error("Failed to create budget:", error);
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
              Nouveau budget
            </ThemedText>
          </ThemedView>

          <ThemedText
            variant="sm"
            weight="medium"
            style={{ marginBottom: theme.spacing.xs }}
          >
            Catégorie
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
                label="Limite de dépenses"
                placeholder="0.00"
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
            Période
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
                    {p === "daily"
                      ? "Jour"
                      : p === "weekly"
                        ? "Semaine"
                        : "Mois"}
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
            onPress={handleSubmit(onSubmit)}
          >
            {isSubmitting ? "Création..." : "Créer le budget"}
          </Button>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
