// src/app/saving-goal-create.tsx

import Button from "@/components/ui/button";
import KeyboardAvoidingView from "@/components/ui/keyboard-avoiding-view";
import SafeAreaView from "@/components/ui/safe-area-view";
import Spacer from "@/components/ui/spacer";
import ThemedText from "@/components/ui/text";
import TextInput from "@/components/ui/text-input";
import ThemedView from "@/components/ui/view";
import { useTheme } from "@/contexts/theme-context";
import { useCreateSavingGoal } from "@/features/saving-goals/hooks";
import { useDevice } from "@/hooks/use-device";
import {
  SavingGoalFormData,
  SavingGoalFormInput,
  savingGoalFormSchema,
} from "@/lib/validation";
import { useAppStore } from "@/stores/app-store";
import { generateUUID, getCurrentTimestamp } from "@/utils/uuid";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, TouchableOpacity, View, Alert } from "react-native";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";

export default function SavingGoalCreate() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { currentAccount } = useAppStore();
  const createGoal = useCreateSavingGoal();

  const { deviceId } = useDevice();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SavingGoalFormInput, any, SavingGoalFormData>({
    resolver: zodResolver(savingGoalFormSchema),
    defaultValues: {
      title: "",
      targetAmount: "",
    },
  });

  const onSubmit = async (data: SavingGoalFormData) => {
    if (!currentAccount) {
      Alert.alert(t("common.error"), t("errors.account_missing"));
      return;
    }

    try {
      await createGoal.mutateAsync({
        id: generateUUID(),
        accountId: currentAccount.id,
        title: data.title,
        targetAmount: data.targetAmount,
        currentAmount: 0,
        status: "active",
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
        deviceId,
        version: 1,
        syncStatus: "pending",
        metadata: {},
      });
      Toast.show({ type: "success", text1: t("goals.create_success") });
      router.back();
    } catch (error) {
      console.error("Failed to create saving goal:", error);
      Alert.alert(t("common.error"), t("errors.create_failed"));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: theme.spacing.lg }}
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
              {t("goals.create")}
            </ThemedText>
            <View style={{ width: 44 }} />
          </ThemedView>

          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label={t("goals.title_label")}
                placeholder={t("goals.title_placeholder")}
                onChangeText={onChange}
                value={value}
                error={!!errors.title}
              />
            )}
          />
          {errors.title && (
            <ThemedText
              variant="xs"
              style={{ color: theme.colors.destructive }}
            >
              {errors.title.message}
            </ThemedText>
          )}

          <Spacer height={theme.spacing.lg} />

          <Controller
            control={control}
            name="targetAmount"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label={t("goals.target_label")}
                placeholder={t("common.amount_placeholder")}
                keyboardType="decimal-pad"
                onChangeText={onChange}
                value={value}
                error={!!errors.targetAmount}
              />
            )}
          />
          {errors.targetAmount && (
            <ThemedText
              variant="xs"
              style={{ color: theme.colors.destructive }}
            >
              {errors.targetAmount.message}
            </ThemedText>
          )}
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
            {isSubmitting ? t("common.loading") : t("goals.create")}
          </Button>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}