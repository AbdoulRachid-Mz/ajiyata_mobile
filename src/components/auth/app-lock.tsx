import React, { useEffect, useState, useRef } from 'react';
import { View, AppState, AppStateStatus, StyleSheet } from 'react-native';
import { useAppStore } from '@/stores/app-store';
import { useBiometricAuth } from '@/hooks/use-biometric-auth';
import { useTheme } from '@/contexts/theme-context';
import { Ionicons } from '@expo/vector-icons';
import ThemedText from '@/components/ui/text';
import Button from '@/components/ui/button';

export function AppLock() {
  const { theme } = useTheme();
  const { 
    isAppLockEnabled, 
    lastBackgroundTime, 
    setLastBackgroundTime,
    lockTimeoutMinutes,
  } = useAppStore();
  const { authenticate, isBiometricAvailable } = useBiometricAuth();
  const [isLocked, setIsLocked] = useState(false);
  const appState = useRef(AppState.currentState);

  // Convertir les minutes en millisecondes
  const lockTimeoutMs = lockTimeoutMinutes * 60 * 1000;

  useEffect(() => {
    // Si la sécurité n'est pas activée ou la biométrie non disponible, on ne fait rien
    if (!isAppLockEnabled || !isBiometricAvailable) return;

    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      // Passage en arrière-plan
      if (
        appState.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        setLastBackgroundTime(Date.now());
      }

      // Retour au premier plan
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        const now = Date.now();
        const backgroundTime = useAppStore.getState().lastBackgroundTime;
        
        // Si l'application a été en arrière-plan plus que le temps défini
        if (backgroundTime && (now - backgroundTime) >= lockTimeoutMs) {
          setIsLocked(true);
          await handleUnlock();
        }
        
        // Reset the background time once we process the active state
        setLastBackgroundTime(null);
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isAppLockEnabled, isBiometricAvailable, setLastBackgroundTime, lockTimeoutMs]);

  const handleUnlock = async () => {
    const success = await authenticate('Veuillez vous authentifier pour déverrouiller Ajiya Ta');
    if (success) {
      setIsLocked(false);
    }
  };

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