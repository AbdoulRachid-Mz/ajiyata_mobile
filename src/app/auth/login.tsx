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
import { useEffect, useState } from "react";
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

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Mot de passe trop court"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { login, loginWithGoogle, isLoading } = useAuth();
  const { setCurrentUser } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);
  const {
    isBiometricAvailable,
    isBiometricEnabled,
    authenticate,
    getCredentials,
    saveCredentials,
  } = useBiometricAuth();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    const loadSavedCredentials = async () => {
      if (isBiometricEnabled) {
        const { email, password } = await getCredentials();
        if (email && password) {
          setValue("email", email);
          setValue("password", password);
        }
      }
    };
    loadSavedCredentials();
  }, [isBiometricEnabled, getCredentials, setValue]);

  const onSubmit = async (data: LoginFormData) => {
    const response = await login(data);
    if (response.success) {
      // Sauvegarder les infos biométriques si activées
      if (isBiometricEnabled) {
        await saveCredentials(data.email, data.password);
      }
      // S'assurer que l'onboarding est marqué comme terminé
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      // Sauvegarder user dans app-store si dispo
      if (response.data) {
        setCurrentUser(response.data as any);
      }
      router.replace("/(tabs)/dashboard");
    } else {
      Alert.alert("Erreur", response.error || "Échec de la connexion");
    }
  };

  const handleGoogleLogin = async () => {
    const response = await loginWithGoogle();
    if (response.success) {
      router.replace("/(tabs)/dashboard");
    } else {
      Alert.alert("Erreur", response.error || "Échec de la connexion Google");
    }
  };

  const handleBiometricLogin = async () => {
    const success = await authenticate();
    if (success) {
      const { email, password } = await getCredentials();
      if (email && password) {
        const response = await login({ email, password });
        if (response.success) {
          router.replace("/(tabs)/dashboard");
        } else {
          Alert.alert("Erreur", response.error || "Échec de la connexion");
        }
      } else {
        Alert.alert("Erreur", "Aucune information de connexion sauvegardée");
      }
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
          <View style={{ marginBottom: theme.spacing.xl, marginTop: theme.spacing.xl }}>
            <View style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
              <Ionicons name="log-in-outline" size={80} color={theme.colors.primary} />
            </View>
            <ThemedText
              variant="3xl"
              weight="bold"
              style={{ textAlign: "center" }}
            >
              Bienvenue !
            </ThemedText>
            <ThemedText
              variant="base"
              color="mutedForeground"
              style={{ textAlign: "center", marginTop: 8 }}
            >
              Connectez-vous pour continuer
            </ThemedText>
          </View>

          <View style={{ paddingHorizontal: theme.spacing.sm }}>

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

            <TouchableOpacity
              onPress={() => router.push("/auth/forgot-password")}
              style={{ alignSelf: "flex-end", marginBottom: theme.spacing.lg }}
            >
              <ThemedText variant="sm" color="primary" weight="semibold">
                Mot de passe oublié ?
              </ThemedText>
            </TouchableOpacity>

            <Button
              size="lg"
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              style={{
                marginBottom: theme.spacing.md,
                borderRadius: theme.borderRadius.xl,
              }}
            >
              {isLoading ? "Connexion..." : "Se connecter"}
            </Button>

            {isBiometricAvailable && (
              <TouchableOpacity
                onPress={handleBiometricLogin}
                disabled={isLoading || !isBiometricEnabled}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: theme.spacing.md,
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: theme.colors.secondary,
                  opacity: isLoading || !isBiometricEnabled ? 0.5 : 1,
                  marginBottom: theme.spacing.lg,
                }}
              >
                <Ionicons
                  name="finger-print-outline"
                  size={24}
                  color={theme.colors.primary}
                />
                <ThemedText
                  style={{ marginLeft: 8 }}
                  color="primary"
                  weight="semibold"
                >
                  Empreinte digitale
                </ThemedText>
              </TouchableOpacity>
            )}

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
                ou continuer avec
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
              style={{ borderRadius: theme.borderRadius.xl }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <Ionicons
                  name="logo-google"
                  size={24}
                  color={theme.colors.foreground}
                />
                <ThemedText weight="semibold">Google</ThemedText>
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
              Pas encore de compte ?{" "}
            </ThemedText>
            <TouchableOpacity onPress={() => router.push("/auth/register")}>
              <ThemedText color="primary" weight="bold">
                Créer un compte
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
