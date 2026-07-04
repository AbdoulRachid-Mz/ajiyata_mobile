import * as SecureStore from 'expo-secure-store';
import { sessionRepository, AuthSession } from '@/features/auth/repositories/session.repository';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const SECURE_STORE_CURRENT_SESSION_ID = 'ajiya_current_session_id';
const SECURE_STORE_FIREBASE_REFRESH_TOKEN = 'ajiya_firebase_refresh_token';

export class SessionService {
  private static instance: SessionService;

  private constructor() {}

  static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  /**
   * Obtient l'identifiant de l'appareil
   */
  private getDeviceId(): string {
    return `${Platform.OS}-${Device.modelName || 'Unknown'}-${Device.osVersion || 'Unknown'}`;
  }

  /**
   * Crée une nouvelle session
   */
  async createSession(params: {
    firebaseUid?: string;
    provider: "email" | "google" | "apple" | "anonymous" | "local";
    isLocal: boolean;
    refreshToken?: string;
  }): Promise<AuthSession> {
    try {
      const deviceId = this.getDeviceId();
      
      const newSession = await sessionRepository.create({
        firebaseUid: params.firebaseUid || null,
        provider: params.provider,
        deviceId,
        isLocal: params.isLocal,
        isSynced: false,
        biometricEnabled: false,
        metadata: {},
      });

      // Sauvegarde l'ID de la session courante dans SecureStore
      await SecureStore.setItemAsync(SECURE_STORE_CURRENT_SESSION_ID, newSession.id);

      // Si on a un refresh token Firebase, on le stocke de manière sécurisée
      if (params.refreshToken) {
        await SecureStore.setItemAsync(SECURE_STORE_FIREBASE_REFRESH_TOKEN, params.refreshToken);
      }

      return newSession;
    } catch (error) {
      console.error('Erreur lors de la création de la session:', error);
      throw new Error('Impossible de créer la session');
    }
  }

  /**
   * Restaure la session active depuis SecureStore et SQLite
   */
  async restoreSession(): Promise<AuthSession | null> {
    try {
      // 1. Essayer de récupérer l'ID de session depuis SecureStore
      const sessionId = await SecureStore.getItemAsync(SECURE_STORE_CURRENT_SESSION_ID);
      
      if (sessionId) {
        const session = await sessionRepository.getById(sessionId);
        if (session) {
          // Mettre à jour lastLogin
          await sessionRepository.updateLastLogin(session.id);
          return session;
        }
      }

      // 2. Fallback: Vérifier s'il y a une session locale pure
      const localSession = await sessionRepository.getLocalSession();
      if (localSession) {
        await sessionRepository.updateLastLogin(localSession.id);
        await SecureStore.setItemAsync(SECURE_STORE_CURRENT_SESSION_ID, localSession.id);
        return localSession;
      }

      return null;
    } catch (error) {
      console.error('Erreur lors de la restauration de la session:', error);
      return null;
    }
  }

  /**
   * Met à jour l'état d'activation de la biométrie pour la session courante
   */
  async setBiometricEnabled(sessionId: string, enabled: boolean): Promise<AuthSession | undefined> {
    return await sessionRepository.update(sessionId, { biometricEnabled: enabled });
  }

  /**
   * Détruit la session courante
   */
  async destroySession(): Promise<void> {
    try {
      const sessionId = await SecureStore.getItemAsync(SECURE_STORE_CURRENT_SESSION_ID);
      
      if (sessionId) {
        await sessionRepository.delete(sessionId);
      }

      await SecureStore.deleteItemAsync(SECURE_STORE_CURRENT_SESSION_ID);
      await SecureStore.deleteItemAsync(SECURE_STORE_FIREBASE_REFRESH_TOKEN);
    } catch (error) {
      console.error('Erreur lors de la destruction de la session:', error);
    }
  }
}

export const sessionService = SessionService.getInstance();
