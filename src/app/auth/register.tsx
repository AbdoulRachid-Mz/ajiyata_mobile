// src/app/auth/register.tsx

import Button from "@/components/ui/button";
import SafeAreaView from "@/components/ui/safe-area-view";
import ThemedText from "@/components/ui/text";
import TextInput from "@/components/ui/text-input";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Image } from "@/components/ui";

const registerSchema = z
  .object({
    displayName: z.string().min(2, "auth.name_too_short"),
    email: z.string().email("auth.invalid_email"),
    password: z.string().min(6, "auth.password_too_short"),
    confirmPassword: z.string().min(6, "auth.password_too_short"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "auth.passwords_mismatch",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const { register, isLoading, loginWithGoogle } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

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

  const onSubmit = async (data: RegisterFormData) => {
    const response = await register({
      email: data.email,
      password: data.password,
      displayName: data.displayName,
    });

    if (response.success) {
      router.replace("/(tabs)/dashboard");
    } else {
      Alert.alert(t("common.error"), response.error || t("common.error"));
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
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginBottom: theme.spacing.lg,
              backgroundColor: theme.colors.primary + "20",
              width: 50,
              height: 50,
              borderRadius: 25,
              padding: 8,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.foreground}
            />
          </TouchableOpacity>

          <View
            style={{
              marginBottom: theme.spacing.xl,
              marginTop: theme.spacing.md,
            }}
          >
            <View
              style={{ alignItems: "center", marginBottom: theme.spacing.md }}
            >
              <Image
                source={require("@/assets/primary.png")}
                style={{ width: "90%", height: 180, borderRadius: 12 }}
              />
            </View>
            <ThemedText
              variant="3xl"
              weight="bold"
              style={{ textAlign: "center" }}
            >
              {t("auth.register_title")}
            </ThemedText>
            <ThemedText
              variant="base"
              color="mutedForeground"
              style={{ textAlign: "center", marginTop: 8 }}
            >
              {t("auth.register_subtitle")}
            </ThemedText>
          </View>

          <View style={{ paddingHorizontal: theme.spacing.sm }}>
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

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: theme.spacing.sm,
                marginTop: theme.spacing.sm,
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

            <Controller
              control={control}
              name="displayName"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label={t("auth.full_name")}
                  placeholder={t("auth.name_placeholder")}
                  value={value}
                  onChangeText={onChange}
                  error={!!errors.displayName}
                  style={{ marginBottom: theme.spacing.sm }}
                  leftIcon={
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color={theme.colors.mutedForeground}
                    />
                  }
                />
              )}
            />
            {errors.displayName && (
              <ThemedText
                variant="xs"
                style={{
                  color: theme.colors.destructive,
                  marginBottom: theme.spacing.sm,
                }}
              >
                {t(errors.displayName.message as string)}
              </ThemedText>
            )}

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

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label={t("auth.confirm_password")}
                  placeholder={t("auth.password_placeholder")}
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!showConfirmPassword}
                  error={!!errors.confirmPassword}
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
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      <Ionicons
                        name={
                          showConfirmPassword
                            ? "eye-outline"
                            : "eye-off-outline"
                        }
                        size={20}
                        color={theme.colors.mutedForeground}
                      />
                    </TouchableOpacity>
                  }
                />
              )}
            />
            {errors.confirmPassword && (
              <ThemedText
                variant="xs"
                style={{
                  color: theme.colors.destructive,
                  marginBottom: theme.spacing.sm,
                }}
              >
                {t(errors.confirmPassword.message as string)}
              </ThemedText>
            )}

            <Button
              size="lg"
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              style={{
                flex: 1,
                borderRadius: theme.borderRadius.xl,
                marginTop: theme.spacing.lg,
              }}
              isFullWidth
            >
              {isLoading ? t("common.loading") : t("auth.sign_up")}
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
              {t("auth.has_account")}{" "}
            </ThemedText>
            <TouchableOpacity onPress={() => router.push("/auth/login")}>
              <ThemedText color="primary" weight="bold">
                {t("auth.sign_in")}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
