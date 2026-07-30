import { useEffect, useState } from "react";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";

import Button from "@/components/ui/button";
import KeyboardAvoidingView from "@/components/ui/keyboard-avoiding-view";
import SafeAreaView from "@/components/ui/safe-area-view";
import Spacer from "@/components/ui/spacer";
import ThemedText from "@/components/ui/text";
import TextInput from "@/components/ui/text-input";
import ThemedView from "@/components/ui/view";
import { useTheme } from "@/contexts/theme-context";
import { useUpdateSavingGoal } from "@/features/saving-goals/hooks";
import { savingGoalRepository } from "@/features/saving-goals/repositories";
import {
  SavingGoalFormData,
  SavingGoalFormInput,
  savingGoalFormSchema,
} from "@/lib/validation";

import { useTranslation } from "react-i18next";

export default function SavingGoalEdit() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const updateGoal = useUpdateSavingGoal();
  const [isLoading, setIsLoading] = useState(true);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<
    SavingGoalFormInput,
    any,
    SavingGoalFormData
  >({
    resolver: zodResolver(savingGoalFormSchema),
    defaultValues: {
      title: "",
      targetAmount: "",
    },
  });

  useEffect(() => {
    const loadGoal = async () => {
      if (!id) {
        Alert.alert("Erreur", "Objectif non trouvé.");
        router.back();
        return;
      }
      const goal = await savingGoalRepository.getById(id);
      if (goal) {
        reset({
          title: goal.title,
          targetAmount: goal.targetAmount.toString(),
        });
      } else {
        Alert.alert("Erreur", "Objectif non trouvé.");
        router.back();
      }
      setIsLoading(false);
    };
    loadGoal();
  }, [id, reset, router]);

  const onSubmit = async (data: SavingGoalFormData) => {
    if (!id) return;

    try {
      await updateGoal.mutateAsync({
        goalId: id,
        data: {
          title: data.title,
          targetAmount: data.targetAmount,
        },
      });
      router.back();
    } catch (error) {
      console.error("Failed to update saving goal:", error);
      Alert.alert("Erreur", "Impossible de mettre à jour l'objectif.");
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText>Chargement...</ThemedText>
      </SafeAreaView>
    );
  }

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
              Modifier l'objectif
            </ThemedText>
            <View style={{ width: 44 }} />
          </ThemedView>

          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Titre de l'objectif"
                placeholder="Ex: Nouvelle voiture"
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
                label="Montant à épargner"
                placeholder="0.00"
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
            {isSubmitting ? "Mise à jour..." : "Enregistrer les modifications"}
          </Button>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
