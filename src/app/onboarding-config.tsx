// src/app/onboarding-config.tsx

import { useTheme } from "@/contexts/theme-context";
import { initializeAccount } from "@/features/accounts/services";
import { useAppStore } from "@/stores/app-store";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Platform, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// i18n
import { useTranslation } from "react-i18next";

// Ajouter l'import du LanguageSelector
import { LanguageSelector } from "@/components/shared/LanguageSelector";

// Composants UI
import Button from "@/components/ui/button";
import SafeAreaView from "@/components/ui/safe-area-view";
import Spacer from "@/components/ui/spacer";
import ThemedText from "@/components/ui/text";
import TextInput from "@/components/ui/text-input";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native-gesture-handler";
import { ScrollView } from "@/components/ui";

export default function OnboardingConfig() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { setCurrentUser, setCurrentAccount } = useAppStore();

  const [step, setStep] = useState(0);
  const [userName, setUserName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState<
    "personal" | "business" | "family"
  >("personal");
  const [phoneNumber, setPhoneNumber] = useState<string | number>(
    "+22796021553",
  );
  const [currency, setCurrency] = useState<"XOF" | "EUR" | "USD">("XOF");
  const [initialBalance, setInitialBalance] = useState("");
  const [loading, setLoading] = useState(false);

  const steps = [
    { title: t('onboarding_config.step_identity'), icon: "person-outline" },
    { title: t('onboarding_config.step_account'), icon: "business-outline" },
    { title: t('onboarding_config.step_balance'), icon: "wallet-outline" },
    { title: t('onboarding_config.step_currency'), icon: "cash-outline" },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!userName.trim() || !accountName.trim()) return;
    try {
      setLoading(true);
      const parsedInitialBalance = parseFloat(initialBalance) || 0;
      const { user, account } = await initializeAccount(
        userName,
        accountName,
        phoneNumber.toString(),
        accountType,
        currency,
        parsedInitialBalance,
      );
      setCurrentUser(user);
      setCurrentAccount(account);
      await AsyncStorage.setItem("hasCompletedOnboarding", "true");
      router.replace("/(tabs)/dashboard");
    } catch (error) {
      console.error("Setup error:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={{ gap: theme.spacing.lg }}>
            <ThemedText variant="lg" weight="semibold">
              {t('onboarding_config.whats_your_name')}
            </ThemedText>
            <TextInput
              placeholder={t('onboarding_config.name_placeholder')}
              value={userName}
              onChangeText={setUserName}
              label={t('auth.full_name')}
              leftIcon={
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={theme.colors.mutedForeground}
                />
              }
            />
            <TextInput
              placeholder={t('onboarding_config.phone_placeholder')}
              value={phoneNumber.toString() || ""}
              onChangeText={setPhoneNumber}
              label={t('settings.phone')}
              keyboardType="phone-pad"
              leftIcon={
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={theme.colors.mutedForeground}
                />
              }
            />
            {/* Sélecteur de langue dans l'onboarding */}
            <View style={{ marginTop: theme.spacing.sm }}>
              <ThemedText
                variant="sm"
                weight="medium"
                style={{ marginBottom: theme.spacing.xs }}
              >
                {t('settings.language')}
              </ThemedText>
              <LanguageSelector />
            </View>
            
            <Spacer height={theme.spacing.sm} />
            <ThemedText variant="sm" color="mutedForeground">
              {t('onboarding_config.name_hint')}
            </ThemedText>
          </View>
        );

      case 1:
        return (
          <View style={{ gap: theme.spacing.lg }}>
            <ThemedText variant="lg" weight="semibold">
              {t('onboarding_config.choose_account_name')}
            </ThemedText>
            <TextInput
              placeholder={t('onboarding_config.account_name_placeholder')}
              value={accountName}
              onChangeText={setAccountName}
              label={t('onboarding_config.account_name')}
              leftIcon={
                <Ionicons
                  name="business-outline"
                  size={20}
                  color={theme.colors.mutedForeground}
                />
              }
            />

            <Spacer height={theme.spacing.sm} />

            <ThemedText
              variant="sm"
              weight="medium"
              style={{ marginBottom: theme.spacing.xs }}
            >
              {t('settings.account_type')}
            </ThemedText>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: theme.spacing.md,
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: theme.spacing.md,
                  borderRadius: theme.borderRadius.md,
                  borderWidth: 2,
                  borderColor:
                    accountType === "personal"
                      ? theme.colors.primary
                      : theme.colors.border,
                  backgroundColor:
                    accountType === "personal"
                      ? theme.colors.primary + "10"
                      : "transparent",
                }}
                onPress={() => setAccountType("personal")}
              >
                <Ionicons
                  name="person"
                  size={24}
                  color={
                    accountType === "personal"
                      ? theme.colors.primary
                      : theme.colors.mutedForeground
                  }
                />
                <ThemedText weight="semibold" style={{ marginTop: 4 }}>
                  {t('settings.personal')}
                </ThemedText>
                <ThemedText variant="xs" color="mutedForeground">
                  {t('onboarding_config.personal_desc')}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: theme.spacing.md,
                  borderRadius: theme.borderRadius.md,
                  borderWidth: 2,
                  borderColor:
                    accountType === "business"
                      ? theme.colors.primary
                      : theme.colors.border,
                  backgroundColor:
                    accountType === "business"
                      ? theme.colors.primary + "10"
                      : "transparent",
                }}
                onPress={() => setAccountType("business")}
              >
                <Ionicons
                  name="briefcase"
                  size={24}
                  color={
                    accountType === "business"
                      ? theme.colors.primary
                      : theme.colors.mutedForeground
                  }
                />
                <ThemedText weight="semibold" style={{ marginTop: 4 }}>
                  {t('settings.business')}
                </ThemedText>
                <ThemedText variant="xs" color="mutedForeground">
                  {t('onboarding_config.business_desc')}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: theme.spacing.md,
                  borderRadius: theme.borderRadius.md,
                  borderWidth: 2,
                  minWidth: "50%",
                  borderColor:
                    accountType === "family"
                      ? theme.colors.primary
                      : theme.colors.border,
                  backgroundColor:
                    accountType === "family"
                      ? theme.colors.primary + "10"
                      : "transparent",
                }}
                onPress={() => setAccountType("family")}
              >
                <Ionicons
                  name="home"
                  size={24}
                  color={
                    accountType === "family"
                      ? theme.colors.primary
                      : theme.colors.mutedForeground
                  }
                />
                <ThemedText weight="semibold" style={{ marginTop: 4 }}>
                  {t('settings.family')}
                </ThemedText>
                <ThemedText variant="xs" color="mutedForeground">
                  {t('onboarding_config.family_desc')}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={{ gap: theme.spacing.lg }}>
            <ThemedText variant="lg" weight="semibold">
              {t('onboarding_config.whats_your_balance')}
            </ThemedText>
            <TextInput
              placeholder={t('onboarding_config.balance_placeholder')}
              value={initialBalance}
              onChangeText={setInitialBalance}
              label={t('onboarding_config.initial_balance')}
              keyboardType="numeric"
              leftIcon={
                <Ionicons
                  name="wallet-outline"
                  size={20}
                  color={theme.colors.mutedForeground}
                />
              }
            />
            <Spacer height={theme.spacing.sm} />
            <ThemedText variant="sm" color="mutedForeground">
              {t('onboarding_config.balance_hint')}
            </ThemedText>
          </View>
        );

      case 3:
        return (
          <View style={{ gap: theme.spacing.lg }}>
            <ThemedText variant="lg" weight="semibold">
              {t('onboarding_config.choose_currency')}
            </ThemedText>

            <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
              {["XOF", "EUR", "USD"].map((curr) => (
                <TouchableOpacity
                  key={curr}
                  style={{
                    flex: 1,
                    padding: theme.spacing.lg,
                    borderRadius: theme.borderRadius.md,
                    borderWidth: 2,
                    borderColor:
                      currency === curr
                        ? theme.colors.primary
                        : theme.colors.border,
                    backgroundColor:
                      currency === curr
                        ? theme.colors.primary + "10"
                        : "transparent",
                    alignItems: "center",
                  }}
                  onPress={() => setCurrency(curr as any)}
                >
                  <Ionicons
                    name={
                      currency === curr ? "checkmark-circle" : "ellipse-outline"
                    }
                    size={24}
                    color={
                      currency === curr
                        ? theme.colors.primary
                        : theme.colors.mutedForeground
                    }
                  />
                  <ThemedText
                    variant="xl"
                    weight="bold"
                    style={{ marginTop: 8 }}
                  >
                    {curr}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <ThemedText
              variant="sm"
              color="mutedForeground"
              style={{ textAlign: "center" }}
            >
              {t('onboarding_config.currency_hint')}
            </ThemedText>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.xl * 2,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Indicateur de progression */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.sm,
            marginBottom: theme.spacing.xl,
            marginTop: Platform.OS === "ios" ? 0 : theme.spacing.md,
          }}
        >
          {steps.map((_, index) => (
            <View
              key={index}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                backgroundColor:
                  index <= step ? theme.colors.primary : theme.colors.border,
              }}
            />
          ))}
        </View>

        {/* Header */}
        <View style={{ marginBottom: theme.spacing.xl }}>
          <ThemedText variant="2xl" weight="bold">
            {steps[step].title}
          </ThemedText>
          <ThemedText variant="base" color="mutedForeground">
            {t('onboarding_config.step_prefix')} {step + 1} {t('onboarding_config.step_of')} {steps.length}
          </ThemedText>
        </View>

        {/* Contenu */}
        {renderStep()}

        <Spacer height={theme.spacing.xl} />

        {/* Boutons */}
        <View
          style={{
            marginTop: "auto",
            flexDirection: "row",
            gap: theme.spacing.md,
          }}
        >
          {step > 0 && (
            <Button
              variant="outline"
              style={{ flex: 1 }}
              onPress={() => setStep(step - 1)}
            >
              {t('common.back')}
            </Button>
          )}
          <Button
            style={{ flex: step > 0 ? 2 : 1 }}
            onPress={handleNext}
            disabled={
              loading ||
              (step === 0 && !userName.trim()) ||
              (step === 1 && !accountName.trim())
            }
          >
            {loading
              ? t('common.loading')
              : step === steps.length - 1
                ? t('common.finish')
                : t('common.continue')}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}