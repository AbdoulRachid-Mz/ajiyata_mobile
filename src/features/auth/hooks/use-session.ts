import { useState, useEffect } from 'react';
import { authManager } from '@/services/auth/auth-manager';
import { AuthSession } from '@/features/auth/repositories/session.repository';

export function useSession() {
  const [session, setSession] = useState<AuthSession | null>(authManager.getCurrentSession());
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(session?.biometricEnabled || false);

  useEffect(() => {
    // Dans une app React Native réelle, on écouterait des événements de changement d'état.
    // Ici, on synchronise avec AuthManager
    const current = authManager.getCurrentSession();
    setSession(current);
    setIsBiometricEnabled(current?.biometricEnabled || false);
  }, [authManager.getCurrentSession()?.id]);

  const toggleBiometric = async (enable: boolean) => {
    const success = await authManager.toggleBiometric(enable);
    if (success) {
      setIsBiometricEnabled(enable);
    }
    return success;
  };

  return {
    session,
    isLocal: session?.isLocal ?? true,
    isBiometricEnabled,
    toggleBiometric,
  };
}
