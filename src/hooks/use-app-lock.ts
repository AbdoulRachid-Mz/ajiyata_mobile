import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAppStore } from '@/stores/app-store';
import { useBiometricAuth } from '@/hooks/use-biometric-auth';

export function useAppLock() {
  const {
    isAppLockEnabled,
    isLocked,
    setIsLocked,
    setLastBackgroundTime,
    lockTimeoutMinutes,
  } = useAppStore();

  const { authenticate } = useBiometricAuth();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!isAppLockEnabled) return;

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // 1. Passage en arrière-plan / inactif
      if (
        appState.current === 'active' &&
        (nextAppState === 'background' || nextAppState === 'inactive')
      ) {
        // On enregistre l'heure de départ
        useAppStore.getState().setLastBackgroundTime(Date.now());
      }

      // 2. Retour au premier plan
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // 💡 Astuce : Récupérer la valeur fraîche directement du store
        const freshLastBackgroundTime = useAppStore.getState().lastBackgroundTime;
        const freshTimeout = useAppStore.getState().lockTimeoutMinutes;

        if (freshLastBackgroundTime) {
          const elapsedMinutes = (Date.now() - freshLastBackgroundTime) / (1000 * 60);
          
          if (elapsedMinutes >= freshTimeout) {
            useAppStore.getState().setIsLocked(true);
          }
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [isAppLockEnabled]);

  const unlock = async () => {
    // Si la biométrie est dispo, on l'utilise, sinon on déverrouille
    const success = await authenticate();
    if (success) {
      setIsLocked(false);
      setLastBackgroundTime(null);
    }
  };

  return { isLocked, unlock };
}