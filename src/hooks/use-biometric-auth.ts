import { useState, useEffect } from 'react';
import { localAuthService } from '@/services/auth/local-auth.service';
import { useSession } from '@/features/auth/hooks/use-session';

export function useBiometricAuth() {
  const { isBiometricEnabled, toggleBiometric } = useSession();
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  useEffect(() => {
    const checkAvailability = async () => {
      const available = await localAuthService.isAvailable();
      setIsBiometricAvailable(available);
    };
    checkAvailability();
  }, []);

  const authenticate = async (promptMessage?: string) => {
    if (!isBiometricAvailable) return false;
    return await localAuthService.authenticate(promptMessage);
  };

  return {
    isBiometricAvailable,
    isBiometricEnabled,
    authenticate,
    toggleBiometric,
  };
}
