import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/contexts/theme-context";
import { useAuth } from "@/contexts/auth-context";
import SafeAreaView from "@/components/ui/safe-area-view";
import ThemedText from "@/components/ui/text";
import TextInput from "@/components/ui/text-input";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalide"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { resetPassword, isLoading } = useAuth();
  const [isSent, setIsSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    const response = await resetPassword(data.email);
    if (response.success) {
      setIsSent(true);
    } else {
      Alert.alert("Erreur", response.error || "Échec de l'envoi");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <View style={{ flex: 1, padding: theme.spacing.lg }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: theme.spacing.lg }}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>

          <View style={{ marginBottom: theme.spacing.xl }}>
            <LinearGradient
              colors={[theme.colors.primary + "20", theme.colors.primary + "05"]}
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                justifyContent: "center",
                alignItems: "center",
                alignSelf: "center",
                marginBottom: theme.spacing.lg,
              }}
            >
              <Ionicons name="key-outline" size={50} color={theme.colors.primary} />
            </LinearGradient>
            <ThemedText variant="3xl" weight="bold" style={{ textAlign: "center" }}>
              Mot de passe oublié
            </ThemedText>
            <ThemedText variant="base" color="mutedForeground" style={{ textAlign: "center", marginTop: 8 }}>
              Entrez votre email pour recevoir un lien de réinitialisation
            </ThemedText>
          </View>

          {isSent ? (
            <Card style={{ padding: theme.spacing.xl, borderRadius: theme.borderRadius.xl, alignItems: "center" }}>
              <View style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: theme.financialColors.income + "20",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: theme.spacing.lg,
              }}>
                <Ionicons name="checkmark-circle" size={60} color={theme.financialColors.income} />
              </View>
              <ThemedText variant="2xl" weight="bold" style={{ textAlign: "center" }}>
                Email envoyé !
              </ThemedText>
              <ThemedText variant="sm" color="mutedForeground" style={{ textAlign: "center", marginTop: theme.spacing.sm }}>
                Vérifiez votre boîte mail pour réinitialiser votre mot de passe
              </ThemedText>
              <Button
                style={{ marginTop: theme.spacing.xl, borderRadius: theme.borderRadius.xl }}
                onPress={() => router.push("/auth/login")}
              >
                Retour à la connexion
              </Button>
            </Card>
          ) : (
            <Card style={{ padding: theme.spacing.xl, borderRadius: theme.borderRadius.xl }}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    label="Email"
                    placeholder="votre@email.com"
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
                  {errors.email.message}
                </ThemedText>
              )}

              <Button
                size="lg"
                onPress={handleSubmit(onSubmit)}
                disabled={isLoading}
                style={{ borderRadius: theme.borderRadius.xl }}
              >
                {isLoading ? "Envoi..." : "Envoyer le lien"}
              </Button>
            </Card>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
