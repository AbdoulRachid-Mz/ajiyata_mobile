// src/app/(tabs)/settings.tsx

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Drawer from "@/components/ui/drawer";
import SafeAreaView from "@/components/ui/safe-area-view";
import ScrollView from "@/components/ui/scroll-view";
import ThemedText from "@/components/ui/text";
import TextInput from "@/components/ui/text-input";
import { TimePicker } from "@/components/ui/time-picker";
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
import Constants from "expo-constants";
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

// Ajouter l'import du LanguageSelector
import { LanguageSelector } from "@/components/shared/LanguageSelector";

// Importer conditionnellement expo-notifications uniquement si ce n'est pas Expo Go
const isExpoGo = Constants.appOwnership === "expo";
let Notifications: any = null;

if (!isExpoGo) {
  try {
    // @ts-ignore - Import dynamique
    Notifications = require("expo-notifications");
  } catch (e) {
    console.log("expo-notifications non disponible");
  }
}

import { useTranslation } from "react-i18next";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { theme, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const {
    currentUser,
    setCurrentUser,
    currentAccount,
    setCurrentAccount,
    isAppLockEnabled,
    setAppLockEnabled,
    reminderEnabled,
    setReminderEnabled,
    reminderTime,
    lockTimeoutMinutes,
    setLockTimeoutMinutes,
    setReminderTime,
  } = useAppStore();
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
  const [isLockTimeoutPickerOpen, setIsLockTimeoutPickerOpen] = useState(false);

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
  const [isAccountTypePickerOpen, setIsAccountTypePickerOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
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
  const [selectedCurrency, setSelectedCurrency] = useState(
    currentUser?.defaultCurrency || "XOF",
  );
  const [selectedAccountType, setSelectedAccountType] = useState<
    "personal" | "business" | "family"
  >(currentAccount?.type || "personal");

  useEffect(() => {
    if (currentUser) {
      setEditingName(currentUser.name || "");
      setEditingPhone(currentUser.phoneNumber || "");
      setSelectedCountry(getDefaultCountry(currentUser?.country || "NE"));
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
        defaultCurrency: selectedCurrency,
      },
    });
    Alert.alert(
      t("common.success"),
      t("settings.profile_updated"),
    );
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
    Alert.alert(t("common.success"), t("settings.account_type_updated"));
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
      Alert.alert(t("common.error"), t("settings.delete_select_one"));
      return;
    }

    Alert.alert(
      t("settings.delete_confirm_title"),
      t("settings.delete_confirm_message"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
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
              Alert.alert(t("common.success"), t("settings.delete_success"));
            } catch (error) {
              Alert.alert(t("common.error"), t("settings.delete_error"));
            }
          },
        },
      ],
    );
  };

  const handleBackup = async () => {
    Alert.alert(
      t("settings.backup_title"),
      t("settings.backup_message"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.backup_confirm"),
          onPress: async () => {
            const result = await backupToCloud();
            if (result.success) {
              Alert.alert(t("common.success"), result.message);
            } else {
              Alert.alert(t("common.error"), result.message);
            }
          },
        },
      ],
    );
  };

  const handleRestore = async () => {
    Alert.alert(
      t("settings.restore_title"),
      t("settings.restore_message"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.restore_confirm"),
          style: "destructive",
          onPress: async () => {
            const result = await restoreFromCloud();
            if (result.success) {
              Alert.alert(t("common.success"), result.message);
            } else {
              Alert.alert(t("common.error"), result.message);
            }
          },
        },
      ],
    );
  };

  const languages = [
    { code: "fr", name: t("language.french") || "Français" },
    { code: "en", name: t("language.english") || "English" },
    { code: "ha", name: t("language.hausa") || "Hausa" },
    { code: "zrm", name: t("language.zarma") || "Zarma" },
    { code: "ar", name: t("language.arabic") || "العربية" },
  ];

  const currencies = ["XOF", "EUR", "USD", "GBP", "CAD"];

  const accountTypes = [
    { type: "personal" as const, label: t("settings.personal"), icon: "person-outline" },
    { type: "business" as const, label: t("settings.business"), icon: "briefcase-outline" },
    { type: "family" as const, label: t("settings.family"), icon: "home-outline" },
  ];

  // Fonction pour gérer les permissions de notifications
  const handleNotificationPermission = async (value: boolean) => {
    if (!value) {
      setReminderEnabled(value);
      return;
    }

    if (isExpoGo) {
      Alert.alert(
        t("common.not_available"),
        t("notifications.expo_go_warning"),
      );
      return;
    }

    try {
      if (!Notifications) {
        Alert.alert(
          t("common.not_available"),
          t("common.not_available"),
        );
        return;
      }

      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        const { status: newStatus } =
          await Notifications.requestPermissionsAsync();
        if (newStatus !== "granted") {
          Alert.alert(
            t("common.error"),
            t("settings.permission_denied"),
          );
          return;
        }
      }
      setReminderEnabled(value);
    } catch (error) {
      console.error("Erreur de permission:", error);
      Alert.alert(t("common.error"), t("common.error"));
    }
  };

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
            {t("settings.title")}
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
            {t("settings.sync")}
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
                <ThemedText>{t("settings.cloud_connected")}</ThemedText>
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
                  {t("settings.last_backup")} :{" "}
                  {new Date(lastBackupDate).toLocaleDateString("fr-FR")}
                </ThemedText>
              )}

              {lastRestoreDate && (
                <ThemedText
                  variant="sm"
                  color="mutedForeground"
                  style={{ marginBottom: theme.spacing.md }}
                >
                  {t("settings.last_restore")} :{" "}
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
                      <ThemedText style={{ color: "white" }}>
                        {t("common.loading")}
                      </ThemedText>
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
                        {t("settings.sync_now")}
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
                      {t("settings.restore")}
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
                <ThemedText>{t("settings.offline_mode")}</ThemedText>
              </View>
              <ThemedText
                variant="sm"
                color="mutedForeground"
                style={{ marginBottom: theme.spacing.md }}
              >
                {t("settings.offline_description")}
              </ThemedText>
              <Button
                variant="default"
                isFullWidth
                onPress={() => router.push("/auth/login")}
              >
                {t("auth.login")}
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
            {t("settings.profile")}
          </ThemedText>

          <TextInput
            label={t("settings.name")}
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
            label={t("settings.phone")}
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
              <ThemedText>{t("settings.country")}</ThemedText>
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
              <ThemedText>{t("settings.currency")}</ThemedText>
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

          <Button onPress={handleSaveProfile} isFullWidth disabled={updateUser.isPending}>
            {updateUser.isPending
              ? t("common.loading")
              : t("settings.save_profile")}
          </Button>
        </Card>

        {/* Account Settings */}
        <ThemedText
          variant="lg"
          weight="semibold"
          style={{ marginBottom: theme.spacing.md }}
        >
          {t("settings.account_type")}
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
              <ThemedText>{t("settings.account_type")}</ThemedText>
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
                  ? t("settings.personal")
                  : currentAccount?.type === "business"
                    ? t("settings.business")
                    : t("settings.family")}
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
          {t("settings.preferences") || "Préférences"}
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
              <ThemedText>{t("settings.dark_mode")}</ThemedText>
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

          {/* Language Selector */}
          <LanguageSelector />

          {biometricAvailable && (
            <>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: theme.spacing.md,
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
                  <ThemedText>{t("settings.biometric")}</ThemedText>
                </View>
                <Switch
                  value={isBiometricEnabled}
                  onValueChange={async (value) => {
                    if (value) {
                      const success = await enableBiometric();
                      if (!success) {
                        Alert.alert(
                          t("common.error"),
                          t("auth.biometric_failed"),
                        );
                      }
                    } else {
                      await disableBiometric();
                      setAppLockEnabled(false);
                    }
                  }}
                  trackColor={{
                    false: theme.colors.border,
                    true: theme.colors.primary,
                  }}
                />
              </View>

              {isBiometricEnabled && (
                <>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: theme.spacing.md,
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
                        name="lock-open-outline"
                        size={20}
                        color={theme.colors.foreground}
                      />
                      <ThemedText>{t("settings.app_lock")}</ThemedText>
                    </View>
                    <Switch
                      value={isAppLockEnabled}
                      onValueChange={(value) => {
                        setAppLockEnabled(value);
                      }}
                      trackColor={{
                        false: theme.colors.border,
                        true: theme.colors.primary,
                      }}
                    />
                  </View>

                  {isAppLockEnabled && (
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: theme.spacing.md,
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
                          name="lock-closed-outline"
                          size={20}
                          color={theme.colors.foreground}
                        />
                        <ThemedText>{t("settings.lock_timeout")}</ThemedText>
                      </View>
                      <TouchableOpacity
                        onPress={() => setIsLockTimeoutPickerOpen(true)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: theme.spacing.sm,
                          paddingVertical: 4,
                          paddingHorizontal: 12,
                          borderRadius: 8,
                          backgroundColor: theme.colors.muted,
                        }}
                      >
                        <ThemedText
                          weight="bold"
                          style={{ color: theme.colors.primary, fontSize: 16 }}
                        >
                          {lockTimeoutMinutes} {t("settings.minutes")}
                        </ThemedText>
                        <Ionicons
                          name="chevron-down"
                          size={16}
                          color={theme.colors.mutedForeground}
                        />
                      </TouchableOpacity>
                    </View>
                  )}

                  <TimePicker
                    visible={isLockTimeoutPickerOpen}
                    value={`${String(lockTimeoutMinutes).padStart(2, "0")}:00`}
                    onConfirm={(time) => {
                      const minutes = parseInt(time.split(":")[0], 10);
                      if (!isNaN(minutes) && minutes > 0) {
                        setLockTimeoutMinutes(minutes);
                      }
                      setIsLockTimeoutPickerOpen(false);
                    }}
                    onClose={() => setIsLockTimeoutPickerOpen(false)}
                  />
                </>
              )}
            </>
          )}
        </Card>

        {/* Reminders */}
        <ThemedText
          variant="lg"
          weight="semibold"
          style={{ marginBottom: theme.spacing.md }}
        >
          {t("settings.reminders")}
        </ThemedText>
        <Card
          style={{ marginBottom: theme.spacing.lg, padding: theme.spacing.md }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: reminderEnabled ? theme.spacing.md : 0,
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
                name="notifications-outline"
                size={20}
                color={theme.colors.foreground}
              />
              <ThemedText>{t("settings.reminders")}</ThemedText>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={handleNotificationPermission}
              trackColor={{
                false: theme.colors.border,
                true: theme.colors.primary,
              }}
            />
          </View>
          {reminderEnabled && (
            <TouchableOpacity
              onPress={() => setIsTimePickerOpen(true)}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: theme.spacing.sm,
                paddingHorizontal: theme.spacing.md,
                borderRadius: theme.spacing.sm,
                backgroundColor: theme.colors.muted,
                marginTop: theme.spacing.xs,
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
                  name="time-outline"
                  size={20}
                  color={theme.colors.foreground}
                />
                <ThemedText>{t("settings.reminder_time")}</ThemedText>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: theme.spacing.sm,
                }}
              >
                <ThemedText
                  weight="bold"
                  style={{ color: theme.colors.primary, fontSize: 17 }}
                >
                  {reminderTime}
                </ThemedText>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={theme.colors.mutedForeground}
                />
              </View>
            </TouchableOpacity>
          )}

          <TimePicker
            visible={isTimePickerOpen}
            value={reminderTime || "09:00"}
            onConfirm={(time) => {
              setReminderTime(time);
              setIsTimePickerOpen(false);
            }}
            onClose={() => setIsTimePickerOpen(false)}
          />

          {reminderEnabled && (
            <Button
              variant="outline"
              size="sm"
              isFullWidth
              onPress={async () => {
                const { notificationService, isExpoGo } =
                  await import("@/configs/notifications");
                if (isExpoGo) {
                  Alert.alert(
                    t("common.not_available"),
                    t("notifications.expo_go_warning"),
                  );
                  return;
                }
                await notificationService.sendNotification({
                  title: t("notifications.test.title"),
                  body: t("notifications.test.body"),
                  data: { type: "test" },
                });
              }}
              style={{ marginTop: theme.spacing.sm }}
            >
              {t("settings.test_notification")}
            </Button>
          )}
        </Card>

        {/* export data */}
        <Card
          style={{ marginBottom: theme.spacing.lg, padding: theme.spacing.md }}
        >
          <ThemedText
            variant="lg"
            weight="bold"
            style={{ marginBottom: theme.spacing.md }}
          >
            {t("settings.export")}
          </ThemedText>
          <ThemedText
            variant="sm"
            color="mutedForeground"
            style={{ marginBottom: theme.spacing.md }}
          >
            {t("settings.export_description") || "Exporter vos données et votre compte"}
          </ThemedText>
          <Button
            isFullWidth
            style={{
              marginBottom: theme.spacing.md,
              borderRadius: theme.borderRadius.xl,
              paddingVertical: theme.spacing.md,
              backgroundColor: theme.colors.primary,
            }}
            onPress={() => router.push("/export")}
          >
            <Ionicons
              name="download-outline"
              size={20}
              color={theme.colors.primaryForeground}
            />
            <ThemedText
              style={{
                marginLeft: theme.spacing.sm,
                fontWeight: "600",
                color: theme.colors.primaryForeground,
              }}
            >
              {t("settings.export")}
            </ThemedText>
          </Button>
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
            {t("settings.delete_data")}
          </ThemedText>
          <ThemedText
            variant="sm"
            color="mutedForeground"
            style={{ marginBottom: theme.spacing.md }}
          >
            {t("settings.delete_description") || "Gérer vos données et votre compte"}
          </ThemedText>
          <Button
            variant="destructive"
            isFullWidth
            onPress={() => setIsDeleteModalOpen(true)}
          >
            <Ionicons
              name="trash-outline"
              size={20}
              style={{ marginRight: 8 }}
            />
            {t("settings.delete_data")}
          </Button>
        </Card>

        {/* Logout */}
        {isAuthenticated && (
          <Button variant="destructive" onPress={handleLogout}>
            {t("auth.logout")}
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
            {t("settings.country")}
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
            {t("settings.currency")}
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
            {t("settings.account_type")}
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
            isFullWidth
          >
            {updateAccount.isPending ? t("common.loading") : t("common.save")}
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
            {t("settings.delete_data")}
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
                <ThemedText>{t("settings.delete_local")}</ThemedText>
                <ThemedText variant="sm" color="mutedForeground">
                  {t("settings.delete_local_desc") || "Supprime les données stockées sur cet appareil"}
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
                  <ThemedText>{t("settings.delete_cloud")}</ThemedText>
                  <ThemedText variant="sm" color="mutedForeground">
                    {t("settings.delete_cloud_desc") || "Supprime les données sauvegardées en ligne"}
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
                  <ThemedText>{t("settings.delete_account")}</ThemedText>
                  <ThemedText variant="sm" color="mutedForeground">
                    {t("settings.delete_account_desc") || "Déconnecte et supprime votre session"}
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
              {t("common.confirm")}
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
              {t("common.cancel")}
            </Button>
          </View>
        </ThemedView>
      </Drawer>
    </SafeAreaView>
  );
}