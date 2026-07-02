import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

// Clés pour SecureStore
const BIOMETRIC_ENABLED_KEY = 'ajiya_biometric_enabled';
const SAVED_EMAIL_KEY = 'ajiya_saved_email';
const SAVED_PASSWORD_KEY = 'ajiya_saved_password';

export const useBiometricAuth = () => {
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabledState] = useState(false);

  // Vérifier la disponibilité de la biométrie
  useEffect(() => {
    const checkAvailability = async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricAvailable(hasHardware && isEnrolled);
    };
    checkAvailability();

    // Charger l'état d'activation de la biométrie
    const loadBiometricState = async () => {
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      setIsBiometricEnabledState(enabled === 'true');
    };
    loadBiometricState();
  }, []);

  // Activer/désactiver la biométrie
  const toggleBiometric = async (enabled: boolean) => {
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
    setIsBiometricEnabledState(enabled);
  };

  // Sauvegarder les informations de connexion
  const saveCredentials = async (email: string, password: string) => {
    await SecureStore.setItemAsync(SAVED_EMAIL_KEY, email);
    await SecureStore.setItemAsync(SAVED_PASSWORD_KEY, password);
  };

  // Récupérer les informations de connexion
  const getCredentials = async () => {
    const email = await SecureStore.getItemAsync(SAVED_EMAIL_KEY);
    const password = await SecureStore.getItemAsync(SAVED_PASSWORD_KEY);
    return { email, password };
  };

  // Supprimer les informations de connexion
  const clearCredentials = async () => {
    await SecureStore.deleteItemAsync(SAVED_EMAIL_KEY);
    await SecureStore.deleteItemAsync(SAVED_PASSWORD_KEY);
  };

  // Authentifier avec biométrie
  const authenticate = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authentifiez-vous',
        fallbackLabel: 'Utiliser le mot de passe',
      });

      return result.success;
    } catch (error) {
      console.error('Erreur lors de l\'authentification biométrique:', error);
      return false;
    }
  };

  return {
    isBiometricAvailable,
    isBiometricEnabled,
    toggleBiometric,
    saveCredentials,
    getCredentials,
    clearCredentials,
    authenticate,
  };
};
