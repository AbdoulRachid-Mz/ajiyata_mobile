import { useTheme } from "@/contexts/theme-context";
import { initializeAccount } from "@/features/accounts/services";
import { useAppStore } from "@/stores/app-store";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Platform, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  const router = useRouter();
  const { setCurrentUser, setCurrentAccount } = useAppStore();

  const [step, setStep] = useState(0);
  const [userName, setUserName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState<"personal" | "business" | "family">("personal");
  const [phoneNumber, setPhoneNumber] = useState<string | number>(
    "+22796021553",
  );
  const [currency, setCurrency] = useState<"XOF" | "EUR" | "USD">("XOF");
  const [initialBalance, setInitialBalance] = useState("");
  const [loading, setLoading] = useState(false);

  const steps = [
    { title: "Votre identité", icon: "person-outline" },
    { title: "Votre compte", icon: "business-outline" },
    { title: "Balance initiale", icon: "wallet-outline" },
    { title: "Devise", icon: "cash-outline" },
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
      // Marquer l'onboarding comme terminé pour ne plus le revoir
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
              Comment voulez-vous qu'on vous appelle ?
            </ThemedText>
            <TextInput
              placeholder="Entrez votre nom"
              value={userName}
              onChangeText={setUserName}
              label="Nom complet"
              leftIcon={
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={theme.colors.mutedForeground}
                />
              }
            />
            <TextInput
              placeholder="Entrez votre numéro de téléphone"
              value={phoneNumber.toString() || ""}
              onChangeText={setPhoneNumber}
              label="Numéro de téléphone"
              keyboardType="phone-pad"
              leftIcon={
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={theme.colors.mutedForeground}
                />
              }
            />
            <Spacer height={theme.spacing.sm} />
            <ThemedText variant="sm" color="mutedForeground">
              C'est le nom qui apparaîtra sur votre profil
            </ThemedText>
          </View>
        );

      case 1:
        return (
          <View style={{ gap: theme.spacing.lg }}>
            <ThemedText variant="lg" weight="semibold">
              Choisissez un nom pour votre compte
            </ThemedText>
            <TextInput
              placeholder="Ex: Mes finances"
              value={accountName}
              onChangeText={setAccountName}
              label="Nom du compte"
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
              Type de compte
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
                  Personnel
                </ThemedText>
                <ThemedText variant="xs" color="mutedForeground">
                  Pour vos finances perso
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
                  Professionnel
                </ThemedText>
                <ThemedText variant="xs" color="mutedForeground">
                  Pour votre business
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
                  Famille
                </ThemedText>
                <ThemedText variant="xs" color="mutedForeground">
                  Pour le foyer
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={{ gap: theme.spacing.lg }}>
            <ThemedText variant="lg" weight="semibold">
              Quelle est votre balance actuelle ?
            </ThemedText>
            <TextInput
              placeholder="Ex: 50000"
              value={initialBalance}
              onChangeText={setInitialBalance}
              label="Balance initiale"
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
              C'est le montant que vous avez actuellement sur vous
            </ThemedText>
          </View>
        );

      case 3:
        return (
          <View style={{ gap: theme.spacing.lg }}>
            <ThemedText variant="lg" weight="semibold">
              Quelle est votre devise préférée ?
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
              Vous pourrez changer cette devise plus tard dans les paramètres
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
            Étape {step + 1} sur {steps.length}
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
              Retour
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
              ? "Configuration..."
              : step === steps.length - 1
                ? "Terminer 🚀"
                : "Continuer"}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
