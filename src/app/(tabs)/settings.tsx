import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Modal from "@/components/ui/modal";
import SafeAreaView from "@/components/ui/safe-area-view";
import ScrollView from "@/components/ui/scroll-view";
import ThemedText from "@/components/ui/text";
import TextInput from "@/components/ui/text-input";
import ThemedView from "@/components/ui/view";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { useUpdateAccount } from "@/features/accounts/hooks";
import { useUpdateUser } from "@/features/users/hooks";
import { useBiometricAuth } from "@/hooks/use-biometric-auth";
import type { Country } from "@/lib/countries";
import { countries, getDefaultCountry } from "@/lib/countries";
import { useAppStore } from "@/stores/app-store";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Switch, TouchableOpacity, View, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { useRef } from "react";
import { useUIStore } from "@/stores/ui-store";

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const { currentUser, setCurrentUser, currentAccount, setCurrentAccount } =
    useAppStore();
    const email = currentUser?.email || 'rashwrightmz@gmail.com';
  const { logout } = useAuth();
  const { isBiometricAvailable, isBiometricEnabled, toggleBiometric, saveCredentials } =
    useBiometricAuth();
  const updateUser = useUpdateUser();
  const updateAccount = useUpdateAccount();
  const { setTabBarVisible } = useUIStore();
  const lastScrollY = useRef(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    if (currentScrollY < 0) return;
    if (currentScrollY > lastScrollY.current + 10) {
      setTabBarVisible(false);
    } else if (currentScrollY < lastScrollY.current - 10) {
      setTabBarVisible(true);
    }
    lastScrollY.current = currentScrollY;
  };

  // States for modals and editing
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
  const [isCurrencyPickerOpen, setIsCurrencyPickerOpen] = useState(false);
  const [isLanguagePickerOpen, setIsLanguagePickerOpen] = useState(false);
  const [isAccountTypePickerOpen, setIsAccountTypePickerOpen] = useState(false);
  const [isBiometricPasswordModalOpen, setIsBiometricPasswordModalOpen] = useState(false);
  const [biometricPassword, setBiometricPassword] = useState("");

  const [editingName, setEditingName] = useState(currentUser?.name || "");
  const [editingPhone, setEditingPhone] = useState(
    currentUser?.phoneNumber || "",
  );
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    getDefaultCountry(currentUser?.country || "NE"),
  );
  const [selectedLanguage, setSelectedLanguage] = useState(
    currentUser?.language || "fr",
  );
  const [selectedCurrency, setSelectedCurrency] = useState(
    currentUser?.defaultCurrency || "XOF",
  );
  const [selectedAccountType, setSelectedAccountType] = useState<
    "personal" | "business"
  >(currentAccount?.type || "personal");

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    await updateUser.mutateAsync({
      userId: currentUser.id,
      updates: {
        name: editingName,
        phoneNumber: editingPhone,
        country: selectedCountry.code,
        language: selectedLanguage,
        defaultCurrency: selectedCurrency,
      },
    });
    Alert.alert("Succès", "Vos informations ont été mises à jour !");
  };

  const handleSaveAccountType = async () => {
    if (!currentAccount) return;
    await updateAccount.mutateAsync({
      accountId: currentAccount.id,
      updates: {
        type: selectedAccountType,
      },
    });
    setIsAccountTypePickerOpen(false);
    Alert.alert("Succès", "Type de compte mis à jour !");
  };

  const handleLogout = async () => {
    const response = await logout();
    if (response.success) {
      setCurrentUser(null);
      setCurrentAccount(null);
      router.replace("/auth/login");
    }
  };

  const languages = [
    { code: "fr", name: "Français" },
    { code: "en", name: "Anglais" },
    { code: "ha", name: "Haoussa" },
  ];

  const currencies = ["XOF", "EUR", "USD", "GBP", "CAD"];

  const accountTypes = [
    { type: "personal" as const, label: "Personnel", icon: "person-outline" },
    {
      type: "business" as const,
      label: "Professionnel",
      icon: "briefcase-outline",
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 120 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <ThemedView
          style={{
            marginBottom: theme.spacing.lg,
          }}
        >
          <ThemedText
            variant="2xl"
            weight="bold"
          >
            Paramètres
          </ThemedText>
        </ThemedView>

        {/* Profile Edit Card */}
        <Card
          style={{ marginBottom: theme.spacing.lg, padding: theme.spacing.md }}
        >
          <ThemedText
            variant="lg"
            weight="bold"
            style={{ marginBottom: theme.spacing.md }}
          >
            Profil
          </ThemedText>

          <TextInput
            label="Nom complet"
            value={editingName}
            onChangeText={setEditingName}
            style={{ marginBottom: theme.spacing.sm }}
        
            leftIcon={
              <Ionicons
                name="person-outline"
                size={20}
                color={theme.colors.mutedForeground}
              />
            }
          />

          <TextInput
            label="Numéro de téléphone"
            value={editingPhone}
            onChangeText={setEditingPhone}
            keyboardType="phone-pad"
            style={{ marginBottom: theme.spacing.sm }}
            leftIcon={
              <Ionicons
                name="call-outline"
                size={20}
                color={theme.colors.mutedForeground}
              />
            }
          />

          <TouchableOpacity
            onPress={() => setIsCountryPickerOpen(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: theme.spacing.sm,
              marginBottom: theme.spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.sm,
              }}
            >
              <Ionicons
                name="globe-outline"
                size={20}
                color={theme.colors.mutedForeground}
              />
              <ThemedText>Pays</ThemedText>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.sm,
              }}
            >
              <ThemedText>{selectedCountry.flag}</ThemedText>
              <ThemedText color="mutedForeground">
                {selectedCountry.name}
              </ThemedText>
              <Ionicons
                name="chevron-forward-outline"
                size={18}
                color={theme.colors.mutedForeground}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsLanguagePickerOpen(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: theme.spacing.sm,
              marginBottom: theme.spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.sm,
              }}
            >
              <Ionicons
                name="language-outline"
                size={20}
                color={theme.colors.mutedForeground}
              />
              <ThemedText>Langue</ThemedText>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.sm,
              }}
            >
              <ThemedText color="mutedForeground">
                {languages.find((l) => l.code === selectedLanguage)?.name}
              </ThemedText>
              <Ionicons
                name="chevron-forward-outline"
                size={18}
                color={theme.colors.mutedForeground}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsCurrencyPickerOpen(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: theme.spacing.sm,
              marginBottom: theme.spacing.lg,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.sm,
              }}
            >
              <Ionicons
                name="cash-outline"
                size={20}
                color={theme.colors.mutedForeground}
              />
              <ThemedText>Devise par défaut</ThemedText>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.sm,
              }}
            >
              <ThemedText color="mutedForeground">
                {selectedCurrency}
              </ThemedText>
              <Ionicons
                name="chevron-forward-outline"
                size={18}
                color={theme.colors.mutedForeground}
              />
            </View>
          </TouchableOpacity>

          <Button onPress={handleSaveProfile} disabled={updateUser.isPending}>
            {updateUser.isPending
              ? "Enregistrement..."
              : "Enregistrer les modifications"}
          </Button>
        </Card>

        {/* Account Settings */}
        <ThemedText
          variant="lg"
          weight="semibold"
          style={{ marginBottom: theme.spacing.md }}
        >
          Compte
        </ThemedText>
        <Card
          style={{ marginBottom: theme.spacing.lg, padding: theme.spacing.md }}
        >
          <TouchableOpacity
            onPress={() => {
              setSelectedAccountType(currentAccount?.type || "personal");
              setIsAccountTypePickerOpen(true);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: theme.spacing.sm,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.sm,
              }}
            >
              <Ionicons
                name="wallet-outline"
                size={20}
                color={theme.colors.mutedForeground}
              />
              <ThemedText>Type de compte</ThemedText>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.sm,
              }}
            >
              <ThemedText color="mutedForeground">
                {currentAccount?.type === "personal"
                  ? "Personnel"
                  : "Professionnel"}
              </ThemedText>
              <Ionicons
                name="chevron-forward-outline"
                size={18}
                color={theme.colors.mutedForeground}
              />
            </View>
          </TouchableOpacity>
        </Card>

        {/* Preferences */}
        <ThemedText
          variant="lg"
          weight="semibold"
          style={{ marginBottom: theme.spacing.md }}
        >
          Préférences
        </ThemedText>
        <Card
          style={{ marginBottom: theme.spacing.lg, padding: theme.spacing.md }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: theme.spacing.md,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: theme.spacing.sm,
              }}
            >
              <Ionicons
                name="moon-outline"
                size={20}
                color={theme.colors.foreground}
              />
              <ThemedText>Mode sombre</ThemedText>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
            />
          </View>

          {isBiometricAvailable && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: theme.spacing.sm,
                }}
              >
                <Ionicons
                  name="finger-print-outline"
                  size={20}
                  color={theme.colors.foreground}
                />
                <ThemedText>Authentification biométrique</ThemedText>
              </View>
              <Switch
                value={isBiometricEnabled}
                onValueChange={async (value) => {
                  if (value) {
                    setIsBiometricPasswordModalOpen(true);
                  } else {
                    await toggleBiometric(false);
                  }
                }}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primary,
                }}
              />
            </View>
          )}
        </Card>

        {/* Logout */}
        <Button variant="destructive" onPress={handleLogout}>
          Déconnexion
        </Button>
      </ScrollView>

      {/* Country Picker Modal */}
      <Modal
        visible={isCountryPickerOpen}
        onClose={() => setIsCountryPickerOpen(false)}
      >
        <ThemedView style={{ padding: theme.spacing.lg }}>
          <ThemedText
            variant="lg"
            weight="bold"
            style={{ marginBottom: theme.spacing.md }}
          >
            Choisir un pays
          </ThemedText>
          <ScrollView style={{ maxHeight: 400 }}>
            {countries.map((country) => (
              <TouchableOpacity
                key={country.code}
                onPress={() => {
                  setSelectedCountry(country);
                  setIsCountryPickerOpen(false);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: theme.spacing.sm,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.border,
                }}
              >
                <ThemedText
                  style={{ fontSize: 24, marginRight: theme.spacing.sm }}
                >
                  {country.flag}
                </ThemedText>
                <ThemedText>{country.name}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ThemedView>
      </Modal>

      {/* Currency Picker Modal */}
      <Modal
        visible={isCurrencyPickerOpen}
        onClose={() => setIsCurrencyPickerOpen(false)}
      >
        <ThemedView style={{ padding: theme.spacing.lg }}>
          <ThemedText
            variant="lg"
            weight="bold"
            style={{ marginBottom: theme.spacing.md }}
          >
            Choisir une devise
          </ThemedText>
          {currencies.map((currency) => (
            <TouchableOpacity
              key={currency}
              onPress={() => {
                setSelectedCurrency(currency);
                setIsCurrencyPickerOpen(false);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: theme.spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
              }}
            >
              <ThemedText>{currency}</ThemedText>
            </TouchableOpacity>
          ))}
        </ThemedView>
      </Modal>

      {/* Language Picker Modal */}
      <Modal
        visible={isLanguagePickerOpen}
        onClose={() => setIsLanguagePickerOpen(false)}
      >
        <ThemedView style={{ padding: theme.spacing.lg }}>
          <ThemedText
            variant="lg"
            weight="bold"
            style={{ marginBottom: theme.spacing.md }}
          >
            Choisir une langue
          </ThemedText>
          {languages.map((language) => (
            <TouchableOpacity
              key={language.code}
              onPress={() => {
                setSelectedLanguage(language.code);
                setIsLanguagePickerOpen(false);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: theme.spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
              }}
            >
              <ThemedText>{language.name}</ThemedText>
            </TouchableOpacity>
          ))}
        </ThemedView>
      </Modal>

      {/* Account Type Picker Modal */}
      <Modal
        visible={isAccountTypePickerOpen}
        onClose={() => setIsAccountTypePickerOpen(false)}
      >
        <ThemedView style={{ padding: theme.spacing.md }}>
          <ThemedText
            variant="lg"
            weight="bold"
            style={{ marginBottom: theme.spacing.md }}
          >
            Choisir le type de compte
          </ThemedText>
          {accountTypes.map(({ type, label, icon }) => (
            <TouchableOpacity
              key={type}
              onPress={() => setSelectedAccountType(type)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: theme.spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
              }}
            >
              <Ionicons
                name={icon as any}
                size={20}
                color={theme.colors.mutedForeground}
                style={{ marginRight: theme.spacing.sm }}
              />
              <ThemedText>{label}</ThemedText>
            </TouchableOpacity>
          ))}
          <Button
            style={{ marginTop: theme.spacing.lg }}
            onPress={handleSaveAccountType}
            disabled={updateAccount.isPending}
          >
            {updateAccount.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </ThemedView>
      </Modal>

      {/* Biometric Password Modal */}
      <Modal
        visible={isBiometricPasswordModalOpen}
        onClose={() => setIsBiometricPasswordModalOpen(false)}
      >
        <ThemedView style={{ padding: theme.spacing.md }}>
          <ThemedText
            variant="lg"
            weight="bold"
            style={{ marginBottom: theme.spacing.md }}
          >
            Activer la biométrie
          </ThemedText>
          <ThemedText style={{ marginBottom: theme.spacing.md }}>
            Veuillez entrer votre mot de passe actuel pour sécuriser vos informations de connexion.
          </ThemedText>
          <TextInput
            label="Mot de passe"
            value={biometricPassword}
            onChangeText={setBiometricPassword}
            secureTextEntry
            style={{ marginBottom: theme.spacing.sm }}
          />
          <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
            <Button
              variant="outline"
              style={{ flex: 1 }}
              onPress={() => {
                setIsBiometricPasswordModalOpen(false);
                setBiometricPassword("");
              }}
            >
              Annuler
            </Button>
            <Button
              style={{ flex: 1 }}
              onPress={async () => {
                if (email && biometricPassword) {
                  await saveCredentials(email, biometricPassword);
                  await toggleBiometric(true);
                  setIsBiometricPasswordModalOpen(false);
                  setBiometricPassword("");
                  Alert.alert("Succès", "Biométrie activée avec succès !");
                } else {
                  Alert.alert("Erreur", "Veuillez entrer votre mot de passe.");
                }
              }}
            >
              Activer
            </Button>
          </View>
        </ThemedView>
      </Modal>
    </SafeAreaView>
  );
}
