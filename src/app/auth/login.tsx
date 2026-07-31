// src/app/auth/login.tsx

import Button from "@/components/ui/button";
import SafeAreaView from "@/components/ui/safe-area-view";
import ThemedText from "@/components/ui/text";
import TextInput from "@/components/ui/text-input";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { useBiometricAuth } from "@/hooks/use-biometric-auth";
import { useAppStore } from "@/stores/app-store";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { z } from "zod";
import { ActivityIndicator, Image } from "@/components/ui";
import { useTranslation } from "react-i18next";
import { User } from "@/types";

const loginSchema = z.object({
  email: z.string().email("auth.invalid_email"),
  password: z.string().min(6, "auth.password_too_short"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { login, loginWithGoogle, loginWithBiometric, isLoading } = useAuth();
  const { setCurrentUser } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);
  const {
    isBiometricAvailable,
    isBiometricEnabled,
    authenticate,
    toggleBiometric,
  } = useBiometricAuth();
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    const response = await login(data);
    if (response.success) {
      await AsyncStorage.setItem("hasCompletedOnboarding", "true");

      if (response.data) {
        setCurrentUser(response.data as User);
      }

      if (isBiometricAvailable && !isBiometricEnabled) {
        Alert.alert(t("auth.secure_account"), t("auth.biometric_prompt"), [
          { text: t("common.later"), style: "cancel" },
          {
            text: t("auth.enable"),
            onPress: async () => {
              const success = await toggleBiometric(true);
              if (!success) {
                Alert.alert(t("common.error"), t("common.error"));
              }
            },
          },
        ]);
      }

      router.replace("/(tabs)/dashboard");
    } else {
      Alert.alert(t("common.error"), response.error || t("auth.login_failed"));
    }
  };

  const handleGoogleLogin = async () => {
    const response = await loginWithGoogle();
    if (response.success) {
      router.replace("/(tabs)/dashboard");
    } else {
      Alert.alert(
        t("common.error"),
        response.error || t("auth.google_login_failed"),
      );
    }
  };

  const handleBiometricLogin = async () => {
    if (isBiometricLoading) return;

    setIsBiometricLoading(true);
    try {
      if (!isBiometricAvailable) {
        Alert.alert(t("common.not_available"), t("common.not_available"));
        return;
      }

      if (!isBiometricEnabled) {
        Alert.alert(
          t("auth.biometric_disabled"),
          t("auth.enable_in_settings"),
          [
            { text: "OK", style: "cancel" },
            {
              text: t("tabs.settings"),
              onPress: () => router.push("/(tabs)/settings"),
            },
          ],
        );
        return;
      }

      const success = await authenticate(t("auth.biometric_login"));

      if (success) {
        const response = await loginWithBiometric();
        if (response.success) {
          router.replace("/(tabs)/dashboard");
        } else {
          Alert.alert(
            t("common.error"),
            response.error || t("auth.login_failed"),
          );
        }
      } else {
        Alert.alert(t("common.canceled"), t("auth.biometric_canceled"));
      }
    } catch (error) {
      console.error("Erreur biométrique:", error);
      Alert.alert(t("common.error"), t("common.error"));
    } finally {
      setIsBiometricLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: theme.spacing.lg }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              marginBottom: theme.spacing.xl,
              marginTop: theme.spacing.xl,
            }}
          >
            <View
              style={{ alignItems: "center", marginBottom: theme.spacing.lg }}
            >
               <Image
              source={require("@/assets/primary.png")}
              style={{ width: "100%", height: 215, borderRadius: 12 }}
            />
            </View>
            <ThemedText
              variant="3xl"
              weight="bold"
              style={{ textAlign: "center" }}
            >
              {t("auth.login_title")}
            </ThemedText>
            <ThemedText
              variant="base"
              color="mutedForeground"
              style={{ textAlign: "center", marginTop: 8 }}
            >
              {t("auth.login_subtitle")}
            </ThemedText>
          </View>

          <View style={{ paddingHorizontal: theme.spacing.sm }}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label={t("auth.email")}
                  placeholder={t("auth.email_placeholder")}
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={!!errors.email}
                  style={{ marginBottom: theme.spacing.sm }}
                  leftIcon={
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={theme.colors.mutedForeground}
                    />
                  }
                />
              )}
            />
            {errors.email && (
              <ThemedText
                variant="xs"
                style={{
                  color: theme.colors.destructive,
                  marginBottom: theme.spacing.sm,
                }}
              >
                {t(errors.email.message as string)}
              </ThemedText>
            )}

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label={t("auth.password")}
                  placeholder={t("auth.password_placeholder")}
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!showPassword}
                  error={!!errors.password}
                  style={{ marginBottom: theme.spacing.sm }}
                  leftIcon={
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={theme.colors.mutedForeground}
                    />
                  }
                  rightIcon={
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color={theme.colors.mutedForeground}
                      />
                    </TouchableOpacity>
                  }
                />
              )}
            />
            {errors.password && (
              <ThemedText
                variant="xs"
                style={{
                  color: theme.colors.destructive,
                  marginBottom: theme.spacing.sm,
                }}
              >
                {t(errors.password.message as string)}
              </ThemedText>
            )}

            <TouchableOpacity
              onPress={() => router.push("/auth/forgot-password")}
              style={{ alignSelf: "flex-end", marginBottom: theme.spacing.lg }}
            >
              <ThemedText variant="sm" color="primary" weight="semibold">
                {t("auth.forgot_password")}
              </ThemedText>
            </TouchableOpacity>

            <Button
              size="lg"
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              style={{
                marginBottom: theme.spacing.md,
                borderRadius: theme.borderRadius.xl,
                flex: 1,
              }}
              isFullWidth
            >
              {isLoading ? t("common.loading") : t("auth.sign_in")}
            </Button>

            {/* {isBiometricAvailable && (
              <TouchableOpacity
                onPress={handleBiometricLogin}
                disabled={isBiometricLoading || isLoading}
                style={{
                  width: "100%",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: theme.spacing.md,
                  paddingHorizontal: theme.spacing.lg,
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: isBiometricEnabled
                    ? theme.colors.primary + "20"
                    : theme.colors.muted,
                  borderWidth: 1,
                  borderColor: isBiometricEnabled
                    ? theme.colors.primary
                    : theme.colors.border,
                  marginBottom: theme.spacing.lg,
                  opacity: isBiometricLoading || isLoading ? 0.5 : 1,
                }}
              >
                {isBiometricLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primary}
                  />
                ) : (
                  <>
                    <Ionicons
                      name="finger-print-outline"
                      size={24}
                      color={
                        isBiometricEnabled
                          ? theme.colors.primary
                          : theme.colors.mutedForeground
                      }
                    />
                    <ThemedText
                      style={{ marginLeft: 8 }}
                      color={isBiometricEnabled ? "primary" : "mutedForeground"}
                      weight={isBiometricEnabled ? "semibold" : "normal"}
                    >
                      {isBiometricEnabled
                        ? t("auth.biometric_login")
                        : t("auth.biometric_disabled")}
                    </ThemedText>
                    {!isBiometricEnabled && (
                      <ThemedText
                        variant="xs"
                        color="mutedForeground"
                        style={{ marginLeft: 2 }}
                      >
                        {t("auth.enable_in_settings")}
                      </ThemedText>
                    )}
                  </>
                )}
              </TouchableOpacity>
            )} */}

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: theme.spacing.lg,
              }}
            >
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: theme.colors.border,
                }}
              />
              <ThemedText
                variant="sm"
                color="mutedForeground"
                style={{ marginHorizontal: theme.spacing.md }}
              >
                {t("auth.or_continue_with")}
              </ThemedText>
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: theme.colors.border,
                }}
              />
            </View>

            <Button
              variant="outline"
              onPress={handleGoogleLogin}
              disabled={isLoading}
              style={{
                borderRadius: theme.borderRadius.xl,
                height: 60,
              }}
              isFullWidth={true}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <Ionicons
                  name="logo-google"
                  size={30}
                  color={theme.colors.foreground}
                />
                <ThemedText style={{ fontSize: theme.typography["xl"] }} weight="semibold">{t("auth.google")}</ThemedText>
              </View>
            </Button>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginTop: theme.spacing.xl,
            }}
          >
            <ThemedText color="mutedForeground">
              {t("auth.no_account")}{" "}
            </ThemedText>
            <TouchableOpacity onPress={() => router.push("/auth/register")}>
              <ThemedText color="primary" weight="bold">
                {t("auth.create_account")}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
