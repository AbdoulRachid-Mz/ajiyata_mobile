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
import { ActivityIndicator } from "@/components/ui";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Mot de passe trop court"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { theme } = useTheme();
  const router = useRouter();
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
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      
      if (response.data) {
        setCurrentUser(response.data as any);
      }
      
      // Proposer d'activer la biométrie si disponible et non activée
      if (isBiometricAvailable && !isBiometricEnabled) {
        Alert.alert(
          '🔐 Sécurisez votre compte',
          'Souhaitez-vous activer l\'authentification biométrique pour un accès plus rapide ?',
          [
            { text: 'Plus tard', style: 'cancel' },
            { 
              text: 'Activer', 
              onPress: async () => {
                const success = await toggleBiometric(true);
                if (!success) {
                  Alert.alert('Erreur', 'Impossible d\'activer la biométrie.');
                }
              }
            },
          ]
        );
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
    if (isBiometricLoading) return;
    
    setIsBiometricLoading(true);
    try {
      // Vérifier si la biométrie est disponible et activée
      if (!isBiometricAvailable) {
        Alert.alert('Non disponible', 'La biométrie n\'est pas disponible sur cet appareil.');
        return;
      }
      
      if (!isBiometricEnabled) {
        Alert.alert(
          'Biométrie désactivée',
          'Activez la biométrie dans les paramètres pour utiliser cette fonction.',
          [
            { text: 'OK', style: 'cancel' },
            { 
              text: 'Paramètres', 
              onPress: () => router.push('/(tabs)/settings') 
            },
          ]
        );
        return;
      }

      // Tenter l'authentification biométrique
      const success = await authenticate('Déverrouillez Ajiya Ta avec votre empreinte');
      
      if (success) {
        // Récupérer la session existante ou utiliser loginWithBiometric
        const response = await loginWithBiometric();
        if (response.success) {
          router.replace("/(tabs)/dashboard");
        } else {
          Alert.alert("Erreur", response.error || "Échec de la connexion biométrique");
        }
      } else {
        // L'utilisateur a annulé ou a échoué
        Alert.alert('Annulé', 'Authentification biométrique annulée.');
      }
    } catch (error) {
      console.error('Erreur biométrique:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'authentification biométrique.');
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

            {/* Bouton Biométrie - Toujours visible si disponible */}
            {isBiometricAvailable && (
              <TouchableOpacity
                onPress={handleBiometricLogin}
                disabled={isBiometricLoading || isLoading}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: theme.spacing.md,
                  paddingHorizontal: theme.spacing.lg,
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: isBiometricEnabled 
                    ? theme.colors.primary + '20' 
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
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <>
                    <Ionicons
                      name="finger-print-outline"
                      size={24}
                      color={isBiometricEnabled ? theme.colors.primary : theme.colors.mutedForeground}
                    />
                    <ThemedText
                      style={{ marginLeft: 8 }}
                      color={isBiometricEnabled ? "primary" : "mutedForeground"}
                      weight={isBiometricEnabled ? "semibold" : "normal"}
                    >
                      {isBiometricEnabled 
                        ? "Connexion avec empreinte" 
                        : "Biométrie désactivée"}
                    </ThemedText>
                    {!isBiometricEnabled && (
                      <ThemedText 
                        variant="xs" 
                        color="mutedForeground" 
                        style={{ marginLeft: 4 }}
                      >
                        (Activer dans paramètres)
                      </ThemedText>
                    )}
                  </>
                )}
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