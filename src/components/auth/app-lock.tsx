import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppStore } from '@/stores/app-store';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import ThemedText from '@/components/ui/text';
import Button from '@/components/ui/button';
import { useAppLock } from '@/hooks/use-app-lock';

export function AppLock() {
  const { theme } = useTheme();
  const { 
    isAppLockEnabled, 
    lockTimeoutMinutes,
    lastBackgroundTime,
    setIsLocked,
  } = useAppStore();

  const { isLocked, unlock: handleUnlock } = useAppLock();

  // Vérification au montage (Démarrage à froid)
  useEffect(() => {
    if (isAppLockEnabled && lastBackgroundTime) {
      const elapsedMinutes = (Date.now() - lastBackgroundTime) / (1000 * 60);
      if (elapsedMinutes >= lockTimeoutMinutes) {
        setIsLocked(true);
      }
    }
  }, [isAppLockEnabled, lastBackgroundTime, lockTimeoutMinutes]);

  if (!isLocked) return null;

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
        Application verrouillée
      </ThemedText>
      <ThemedText color="mutedForeground" style={{ marginBottom: 32, textAlign: 'center' }}>
        Verrouillage automatique après {lockTimeoutMinutes} minute{lockTimeoutMinutes > 1 ? 's' : ''} d'inactivité
      </ThemedText>
      
      <Button onPress={handleUnlock} size="lg" style={{ minWidth: 200 }}>
        <Ionicons name="finger-print-outline" size={24} color={theme.colors.primaryForeground} style={{ marginRight: 8 }} />
        Déverrouiller
      </Button>
    </View>
  );
}