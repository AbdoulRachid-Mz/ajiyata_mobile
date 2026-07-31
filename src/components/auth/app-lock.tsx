// src/components/auth/app-lock.tsx

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppStore } from '@/stores/app-store';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import ThemedText from '@/components/ui/text';
import Button from '@/components/ui/button';
import { useAppLock } from '@/hooks/use-app-lock';
import { useTranslation } from 'react-i18next';

export function AppLock() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { 
    isAppLockEnabled, 
    lockTimeoutMinutes,
    lastBackgroundTime,
    setIsLocked,
  } = useAppStore();

  const { isLocked, unlock: handleUnlock } = useAppLock();

  useEffect(() => {
    if (isAppLockEnabled && lastBackgroundTime) {
      const elapsedMinutes = (Date.now() - lastBackgroundTime) / (1000 * 60);
      if (elapsedMinutes >= lockTimeoutMinutes) {
        setIsLocked(true);
      }
    }
  }, [isAppLockEnabled, lastBackgroundTime, lockTimeoutMinutes]);

  if (!isLocked) return null;

  // Gérer le pluriel pour la description
  const plural = lockTimeoutMinutes > 1 ? 's' : '';

  return (
    <View style={[StyleSheet.absoluteFill, { 
      backgroundColor: theme.colors.background, 
      zIndex: 9999, 
      justifyContent: 'center', 
      alignItems: 'center',
      padding: theme.spacing.xl,
    }]}>
      <Ionicons name="lock-closed" size={64} color={theme.colors.primary} style={{ marginBottom: 24 }} />
      <ThemedText variant="2xl" weight="bold" style={{ marginBottom: 8, textAlign: 'center' }}>
        {t('app_lock.title')}
      </ThemedText>
      <ThemedText color="mutedForeground" style={{ marginBottom: 32, textAlign: 'center' }}>
        {t('app_lock.description', { minutes: lockTimeoutMinutes, plural })}
      </ThemedText>
      
      <Button isFullWidth onPress={handleUnlock} size="lg" style={{ minWidth: 200 }}>
        <Ionicons name="finger-print-outline" size={24} color={theme.colors.primaryForeground} style={{ marginRight: 8 }} />
        {t('app_lock.unlock')}
      </Button>
    </View>
  );
}