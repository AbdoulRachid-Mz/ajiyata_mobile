import React, { useState } from 'react';
import { View, Switch, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTheme } from '@/contexts/theme-context';
import { useNotifications } from '@/contexts/notification-context';
import ThemedText from '@/components/ui/text';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import { useAppStore } from '@/stores/app-store';
import { useTranslation } from 'react-i18next';

const isExpoGo = Constants.appOwnership === 'expo';

export const NotificationSettings = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { isEnabled, setEnabled, sendNotification } = useNotifications();
  const { currentUser } = useAppStore();

  const [settings, setSettings] = useState({
    budgetAlerts: true,
    savingsReminders: true,
    syncUpdates: true,
    tips: true,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTestNotification = async () => {
    await sendNotification({
      title: t('notifications.test.title'),
      body: t('notifications.test.body'),
      data: { type: 'test' },
    });
  };

  // Dans Expo Go, afficher un message
  if (isExpoGo) {
    return (
      <Card style={styles.card}>
        <ThemedText color="mutedForeground" style={{ textAlign: 'center' }}>
          {t('notifications.expo_go_warning')}
        </ThemedText>
      </Card>
    );
  }

  if (!currentUser) {
    return (
      <Card style={styles.card}>
        <ThemedText color="mutedForeground" style={{ textAlign: 'center' }}>
          {t('notifications.login_required')}
        </ThemedText>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      {/* Activation globale */}
      <Card style={styles.card}>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications" size={24} color={theme.colors.primary} />
            <View style={styles.settingText}>
              <ThemedText weight="medium">{t('notifications.title')}</ThemedText>
              <ThemedText variant="xs" color="mutedForeground">
                {t('notifications.enable_all')}
              </ThemedText>
            </View>
          </View>
          <Switch
            value={isEnabled}
            onValueChange={setEnabled}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            ios_backgroundColor={theme.colors.border}
          />
        </View>
      </Card>

      {/* Paramètres par type */}
      {isEnabled && (
        <>
          <Card style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <View style={[styles.iconContainer, { backgroundColor: theme.financialColors.budget + '20' }]}>
                  <Ionicons name="wallet-outline" size={20} color={theme.financialColors.budget} />
                </View>
                <View style={styles.settingText}>
                  <ThemedText weight="medium">{t('notifications.budget_alerts_label')}</ThemedText>
                  <ThemedText variant="xs" color="mutedForeground">
                    {t('notifications.budget_alerts_desc')}
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={settings.budgetAlerts}
                onValueChange={() => handleToggle('budgetAlerts')}
                trackColor={{ false: theme.colors.border, true: theme.financialColors.budget }}
                ios_backgroundColor={theme.colors.border}
              />
            </View>
          </Card>

          <Card style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <View style={[styles.iconContainer, { backgroundColor: theme.financialColors.saving + '20' }]}>
                  <Ionicons name="trending-up-outline" size={20} color={theme.financialColors.saving} />
                </View>
                <View style={styles.settingText}>
                  <ThemedText weight="medium">{t('notifications.savings_reminders_label')}</ThemedText>
                  <ThemedText variant="xs" color="mutedForeground">
                    {t('notifications.savings_reminders_desc')}
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={settings.savingsReminders}
                onValueChange={() => handleToggle('savingsReminders')}
                trackColor={{ false: theme.colors.border, true: theme.financialColors.saving }}
                ios_backgroundColor={theme.colors.border}
              />
            </View>
          </Card>

          <Card style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                  <Ionicons name="sync-outline" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.settingText}>
                  <ThemedText weight="medium">{t('notifications.sync_label')}</ThemedText>
                  <ThemedText variant="xs" color="mutedForeground">
                    {t('notifications.sync_desc')}
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={settings.syncUpdates}
                onValueChange={() => handleToggle('syncUpdates')}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                ios_backgroundColor={theme.colors.border}
              />
            </View>
          </Card>

          <Card style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.accent + '20' }]}>
                  <Ionicons name="bulb-outline" size={20} color={theme.colors.accent} />
                </View>
                <View style={styles.settingText}>
                  <ThemedText weight="medium">{t('notifications.tips_label')}</ThemedText>
                  <ThemedText variant="xs" color="mutedForeground">
                    {t('notifications.tips_desc')}
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={settings.tips}
                onValueChange={() => handleToggle('tips')}
                trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
                ios_backgroundColor={theme.colors.border}
              />
            </View>
          </Card>
        </>
      )}

      {/* Test */}
      {isEnabled && (
        <Button variant="outline" onPress={handleTestNotification} style={styles.testButton}>
          {t('notifications.test_button')}
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  card: {
    padding: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingText: {
    flex: 1,
    gap: 2,
  },
  testButton: {
    marginTop: 8,
  },
});