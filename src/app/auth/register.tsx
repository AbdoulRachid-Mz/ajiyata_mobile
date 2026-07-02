import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import SafeAreaView from "@/components/ui/safe-area-view";
import ThemedText from "@/components/ui/text";
import TextInput from "@/components/ui/text-input";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { LinearGradient } from "expo-linear-gradient";
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

const registerSchema = z
  .object({
    displayName: z.string().min(2, "Nom trop court"),
    email: z.string().email("Email invalide"),
    password: z.string().min(6, "Mot de passe trop court"),
    confirmPassword: z.string().min(6, "Mot de passe trop court"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { register, isLoading } = useAuth();
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

  const onSubmit = async (data: RegisterFormData) => {
    const response = await register({
      email: data.email,
      password: data.password,
      displayName: data.displayName,
    });

    if (response.success) {
      Alert.alert(
        "Inscription réussie !",
        "Un email de vérification a été envoyé à votre adresse. Veuillez vérifier votre email avant de vous connecter.",
      );
      router.push("/auth/login");
    } else {
      Alert.alert("Erreur", response.error || "Échec de l'inscription");
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
            style={{ marginBottom: theme.spacing.lg }}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.foreground}
            />
          </TouchableOpacity>

          <View style={{ marginBottom: theme.spacing.xl, marginTop: theme.spacing.md }}>
            <View style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
              <Ionicons name="person-add-outline" size={80} color={theme.colors.primary} />
            </View>
            <ThemedText
              variant="3xl"
              weight="bold"
              style={{ textAlign: "center" }}
            >
              Créer un compte
            </ThemedText>
            <ThemedText
              variant="base"
              color="mutedForeground"
              style={{ textAlign: "center", marginTop: 8 }}
            >
              Rejoignez Ajiya Ta et gérez vos finances
            </ThemedText>
          </View>

          <View style={{ paddingHorizontal: theme.spacing.sm }}>
            <Controller
              control={control}
              name="displayName"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Nom complet"
                  placeholder="Votre nom"
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
                {errors.displayName.message}
              </ThemedText>
            )}

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

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Mot de passe"
                  placeholder="••••••••"
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
                {errors.password.message}
              </ThemedText>
            )}

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Confirmer le mot de passe"
                  placeholder="••••••••"
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
                {errors.confirmPassword.message}
              </ThemedText>
            )}

            <Button
              size="lg"
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              style={{ borderRadius: theme.borderRadius.xl, marginTop: theme.spacing.lg }}
            >
              {isLoading ? "Inscription..." : "S'inscrire"}
            </Button>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginTop: theme.spacing.xl,
            }}
          >
            <ThemedText color="mutedForeground">Déjà un compte ? </ThemedText>
            <TouchableOpacity onPress={() => router.push("/auth/login")}>
              <ThemedText color="primary" weight="bold">
                Se connecter
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
