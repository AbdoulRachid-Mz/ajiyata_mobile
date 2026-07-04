import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Drawer from "@/components/ui/drawer";
import SafeAreaView from "@/components/ui/safe-area-view";
import ScrollView from "@/components/ui/scroll-view";
import ThemedText from "@/components/ui/text";
import TextInput from "@/components/ui/text-input";
import ThemedView from "@/components/ui/view";
import { useAuth } from "@/contexts/auth-context";
import { useSync } from "@/contexts/sync-context";
import { useTheme } from "@/contexts/theme-context";
import { useUpdateAccount } from "@/features/accounts/hooks";
import { useUpdateUser } from "@/features/users/hooks";
import type { Country } from "@/lib/countries";
import { countries, getDefaultCountry } from "@/lib/countries";
import { useAppStore } from "@/stores/app-store";
import { useUIStore } from "@/stores/ui-store";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const { currentUser, setCurrentUser, currentAccount, setCurrentAccount } =
    useAppStore();
  const {
    user,
    isAuthenticated,
    logout,
    enableBiometric,
    disableBiometric,
    isBiometricEnabled,
    isBiometricAvailable,
  } = useAuth();
  const {
    isSyncing,
    hasCloudData,
    lastBackupDate,
    lastRestoreDate,
    backupToCloud,
    restoreFromCloud,
    deleteLocalData,
    deleteCloudData,
  } = useSync();
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    const checkBiometrics = async () => {
      const result = await isBiometricAvailable();
      setBiometricAvailable(result.available);
    };
    checkBiometrics();
  }, [isBiometricAvailable]);
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteOptions, setDeleteOptions] = useState({
    local: false,
    cloud: false,
    account: false,
  });

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

  useEffect(() => {
    if (currentUser) {
      setEditingName(currentUser.name || "");
      setEditingPhone(currentUser.phoneNumber || "");
      setSelectedCountry(getDefaultCountry(currentUser.country || "NE"));
      setSelectedLanguage(currentUser.language || "fr");
      setSelectedCurrency(currentUser.defaultCurrency || "XOF");
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentAccount) {
      setSelectedAccountType(currentAccount.type || "personal");
    }
  }, [currentAccount]);

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
    }
  };

  const handleDeleteData = async () => {
    if (
      !deleteOptions.local &&
      !deleteOptions.cloud &&
      !deleteOptions.account
    ) {
      Alert.alert("Erreur", "Veuillez sélectionner au moins une option.");
      return;
    }

    Alert.alert(
      "Confirmation de suppression",
      "Êtes-vous sûr de vouloir continuer ? Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setIsDeleteModalOpen(false);

            try {
              if (deleteOptions.local) {
                await deleteLocalData();
              }

              if (deleteOptions.cloud && isAuthenticated) {
                await deleteCloudData();
              }

              if (deleteOptions.account && isAuthenticated) {
                await logout();
                setCurrentUser(null);
                setCurrentAccount(null);
              }

              setDeleteOptions({ local: false, cloud: false, account: false });
              Alert.alert(
                "Succès",
                "Les données sélectionnées ont été supprimées.",
              );
            } catch (error) {
              Alert.alert(
                "Erreur",
                "Une erreur est survenue lors de la suppression.",
              );
            }
          },
        },
      ],
    );
  };

  const handleBackup = async () => {
    Alert.alert(
      "Sauvegarder les données",
      "Êtes-vous sûr de vouloir sauvegarder vos données en ligne ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Sauvegarder",
          onPress: async () => {
            const result = await backupToCloud();
            if (result.success) {
              Alert.alert("Succès", result.message);
            } else {
              Alert.alert("Erreur", result.message);
            }
          },
        },
      ],
    );
  };

  const handleRestore = async () => {
    Alert.alert(
      "Restaurer les données",
      "Attention : Cette action remplacera toutes vos données locales par celles sauvegardées en ligne. Êtes-vous sûr ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Restaurer",
          style: "destructive",
          onPress: async () => {
            const result = await restoreFromCloud();
            if (result.success) {
              Alert.alert("Succès", result.message);
            } else {
              Alert.alert("Erreur", result.message);
            }
          },
        },
      ],
    );
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
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: 120,
        }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <ThemedView
          style={{
            marginBottom: theme.spacing.lg,
          }}
        >
          <ThemedText variant="2xl" weight="bold">
            Paramètres
          </ThemedText>
        </ThemedView>

        {/* Sync Status Card */}
        <Card
          style={{ marginBottom: theme.spacing.lg, padding: theme.spacing.md }}
        >
          <ThemedText
            variant="lg"
            weight="bold"
            style={{ marginBottom: theme.spacing.sm }}
          >
            Sauvegarde et synchronisation
          </ThemedText>

          {isAuthenticated ? (
            <View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: theme.spacing.sm,
                }}
              >
                <Ionicons
                  name="cloud-done"
                  size={20}
                  color={theme.financialColors.income}
                  style={{ marginRight: 8 }}
                />
                <ThemedText>Connecté à votre compte</ThemedText>
              </View>

              <ThemedText
                variant="sm"
                color="mutedForeground"
                style={{ marginBottom: theme.spacing.sm }}
              >
                {user?.email}
              </ThemedText>

              {lastBackupDate && (
                <ThemedText
                  variant="sm"
                  color="mutedForeground"
                  style={{ marginBottom: theme.spacing.md }}
                >
                  Dernière sauvegarde :{" "}
                  {new Date(lastBackupDate).toLocaleDateString("fr-FR")}
                </ThemedText>
              )}

              {lastRestoreDate && (
                <ThemedText
                  variant="sm"
                  color="mutedForeground"
                  style={{ marginBottom: theme.spacing.md }}
                >
                  Dernière restauration :{" "}
                  {new Date(lastRestoreDate).toLocaleDateString("fr-FR")}
                </ThemedText>
              )}

              <View
                style={{ gap: theme.spacing.sm, marginTop: theme.spacing.md }}
              >
                <Button
                  variant="default"
                  onPress={handleBackup}
                  disabled={isSyncing}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isSyncing ? (
                    <>
                      <ActivityIndicator
                        size="small"
                        color="white"
                        style={{ marginRight: 8 }}
                      />
                      <ThemedText>Sauvegarde en cours...</ThemedText>
                    </>
                  ) : (
                    <>
                      <Ionicons
                        name="cloud-upload-outline"
                        size={20}
                        color="white"
                        style={{ marginRight: 8 }}
                      />
                      <ThemedText style={{ color: "white" }}>
                        Sauvegarder dans le cloud
                      </ThemedText>
                    </>
                  )}
                </Button>

                {hasCloudData && (
                  <Button
                    variant="secondary"
                    onPress={handleRestore}
                    disabled={isSyncing}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="cloud-download-outline"
                      size={20}
                      style={{ marginRight: 8 }}
                    />
                    <ThemedText style={{ color: "white" }}>
                      Restaurer depuis le cloud
                    </ThemedText>
                  </Button>
                )}
              </View>
            </View>
          ) : (
            <View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: theme.spacing.sm,
                }}
              >
                <Ionicons
                  name="cloud-offline"
                  size={20}
                  color={theme.financialColors.expense}
                  style={{ marginRight: 8 }}
                />
                <ThemedText>Mode hors-ligne</ThemedText>
              </View>
              <ThemedText
                variant="sm"
                color="mutedForeground"
                style={{ marginBottom: theme.spacing.md }}
              >
                Vos données sont stockées localement. Connectez-vous pour les
                sauvegarder en ligne.
              </ThemedText>
              <Button
                variant="default"
                onPress={() => router.push("/auth/login")}
              >
                Se connecter pour sauvegarder
              </Button>
            </View>
          )}
        </Card>

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

          {biometricAvailable && (
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
                    const success = await enableBiometric();
                    if (!success) {
                      Alert.alert(
                        "Erreur",
                        "Authentification biométrique échouée.",
                      );
                    }
                  } else {
                    await disableBiometric();
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

        {/* Delete Data */}
        <Card
          style={{ marginBottom: theme.spacing.lg, padding: theme.spacing.md }}
        >
          <ThemedText
            variant="lg"
            weight="bold"
            style={{ marginBottom: theme.spacing.md }}
          >
            Supprimer les données
          </ThemedText>
          <ThemedText
            variant="sm"
            color="mutedForeground"
            style={{ marginBottom: theme.spacing.md }}
          >
            Gérer vos données et votre compte
          </ThemedText>
          <Button
            variant="destructive"
            onPress={() => setIsDeleteModalOpen(true)}
          >
            <Ionicons
              name="trash-outline"
              size={20}
              style={{ marginRight: 8 }}
            />
            Supprimer les données
          </Button>
        </Card>

        {/* Logout */}
        {isAuthenticated && (
          <Button variant="destructive" onPress={handleLogout}>
            Déconnexion
          </Button>
        )}
      </ScrollView>

      {/* Country Picker Drawer */}
      <Drawer
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
      </Drawer>

      {/* Currency Picker Drawer */}
      <Drawer
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
      </Drawer>

      {/* Language Picker Drawer */}
      <Drawer
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
      </Drawer>

      {/* Account Type Picker Drawer */}
      <Drawer
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
      </Drawer>

      {/* Delete Data Drawer */}
      <Drawer
        visible={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteOptions({ local: false, cloud: false, account: false });
        }}
      >
        <ThemedView style={{ padding: theme.spacing.lg }}>
          <ThemedText
            variant="lg"
            weight="bold"
            style={{ marginBottom: theme.spacing.lg }}
          >
            Supprimer les données
          </ThemedText>

          <TouchableOpacity
            onPress={() =>
              setDeleteOptions((prev) => ({ ...prev, local: !prev.local }))
            }
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: theme.spacing.md,
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
                name="phone-portrait-outline"
                size={20}
                color={theme.colors.foreground}
              />
              <View>
                <ThemedText>Données locales</ThemedText>
                <ThemedText variant="sm" color="mutedForeground">
                  Supprime les données stockées sur cet appareil
                </ThemedText>
              </View>
            </View>
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 4,
                borderWidth: 2,
                borderColor: deleteOptions.local
                  ? theme.colors.primary
                  : theme.colors.border,
                backgroundColor: deleteOptions.local
                  ? theme.colors.primary
                  : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {deleteOptions.local && (
                <Ionicons name="checkmark" size={16} color="white" />
              )}
            </View>
          </TouchableOpacity>

          {isAuthenticated && (
            <TouchableOpacity
              onPress={() =>
                setDeleteOptions((prev) => ({ ...prev, cloud: !prev.cloud }))
              }
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: theme.spacing.md,
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
                  name="cloud-outline"
                  size={20}
                  color={theme.colors.foreground}
                />
                <View>
                  <ThemedText>Données cloud</ThemedText>
                  <ThemedText variant="sm" color="mutedForeground">
                    Supprime les données sauvegardées en ligne
                  </ThemedText>
                </View>
              </View>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: deleteOptions.cloud
                    ? theme.colors.primary
                    : theme.colors.border,
                  backgroundColor: deleteOptions.cloud
                    ? theme.colors.primary
                    : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {deleteOptions.cloud && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>
            </TouchableOpacity>
          )}

          {isAuthenticated && (
            <TouchableOpacity
              onPress={() =>
                setDeleteOptions((prev) => ({
                  ...prev,
                  account: !prev.account,
                }))
              }
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: theme.spacing.md,
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
                  name="person-remove-outline"
                  size={20}
                  color={theme.colors.foreground}
                />
                <View>
                  <ThemedText>Compte utilisateur</ThemedText>
                  <ThemedText variant="sm" color="mutedForeground">
                    Déconnecte et supprime votre session
                  </ThemedText>
                </View>
              </View>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: deleteOptions.account
                    ? theme.colors.primary
                    : theme.colors.border,
                  backgroundColor: deleteOptions.account
                    ? theme.colors.primary
                    : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {deleteOptions.account && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>
            </TouchableOpacity>
          )}

          <View style={{ marginTop: theme.spacing.xl, gap: theme.spacing.sm }}>
            <Button variant="destructive" onPress={handleDeleteData}>
              Confirmer la suppression
            </Button>
            <Button
              variant="secondary"
              onPress={() => {
                setIsDeleteModalOpen(false);
                setDeleteOptions({
                  local: false,
                  cloud: false,
                  account: false,
                });
              }}
            >
              Annuler
            </Button>
          </View>
        </ThemedView>
      </Drawer>
    </SafeAreaView>
  );
}
