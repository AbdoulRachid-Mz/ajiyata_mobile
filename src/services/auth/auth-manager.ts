import { FirebaseAuthService } from '@/services/firebase/auth.service';
import { localAuthService } from './local-auth.service';
import { sessionService } from './session.service';
import { AuthSession } from '@/features/auth/repositories/session.repository';
import { AuthUser, AuthCredentials, AuthRegisterData, AuthResponse } from '@/features/auth/types';

export class AuthManager {
  private static instance: AuthManager;
  private currentSession: AuthSession | null = null;
  private firebaseAuth: FirebaseAuthService;

  private constructor() {
    this.firebaseAuth = FirebaseAuthService.getInstance();
  }

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  getCurrentSession(): AuthSession | null {
    return this.currentSession;
  }

  getFirebaseUser(): AuthUser | null {
    return this.firebaseAuth.getCurrentUser();
  }

  /**
   * Initialisation appelée au lancement de l'application (Splash Screen)
   */
  async initialize(): Promise<{ hasSession: boolean }> {
    this.firebaseAuth.initialize();
    
    // 1. Restaurer la session SQLite / SecureStore
    this.currentSession = await sessionService.restoreSession();

    if (this.currentSession) {
      return { hasSession: true };
    }

    // 2. S'il n'y a aucune session (1ère ouverture ou déconnexion)
    // On crée automatiquement une session locale pour permettre une utilisation Offline-first
    this.currentSession = await sessionService.createSession({
      provider: 'local',
      isLocal: true,
    });

    return { hasSession: true };
  }

  /**
   * Tente de déverrouiller l'application via biométrie si configuré
   */
  async unlockWithBiometrics(): Promise<boolean> {
    if (!this.currentSession?.biometricEnabled) return true; // Déjà déverrouillé ou non configuré
    
    return await localAuthService.authenticate();
  }

  /**
   * Connexion via Email/Password Firebase
   */
  async loginWithEmail(credentials: AuthCredentials): Promise<AuthResponse> {
    const response = await this.firebaseAuth.login(credentials);
    
    if (response.success && response.data) {
      // Nettoyer l'ancienne session locale si existante
      if (this.currentSession && this.currentSession.isLocal) {
        await sessionService.destroySession();
      }

      // Créer la nouvelle session
      this.currentSession = await sessionService.createSession({
        firebaseUid: (response.data as AuthUser).uid,
        provider: 'email',
        isLocal: false,
      });
    }
    return response;
  }

  /**
   * Inscription via Email/Password Firebase
   */
  async registerWithEmail(data: AuthRegisterData): Promise<AuthResponse> {
    const response = await this.firebaseAuth.register(data);
    
    if (response.success && response.data) {
      // Nettoyer l'ancienne session locale si existante
      if (this.currentSession && this.currentSession.isLocal) {
        await sessionService.destroySession();
      }

      this.currentSession = await sessionService.createSession({
        firebaseUid: (response.data as AuthUser).uid,
        provider: 'email',
        isLocal: false,
      });
    }
    return response;
  }

  /**
   * Connexion avec Google
   */
  async loginWithGoogle(): Promise<AuthResponse> {
    const response = await this.firebaseAuth.loginWithGoogle();
    
    if (response.success && response.data) {
      if (this.currentSession && this.currentSession.isLocal) {
        await sessionService.destroySession();
      }

      this.currentSession = await sessionService.createSession({
        firebaseUid: (response.data as AuthUser).uid,
        provider: 'google',
        isLocal: false,
      });
    }
    return response;
  }

  /**
   * Déconnexion (Détruit la session Firebase + Locale, et recrée une locale vierge)
   */
  async logout(): Promise<AuthResponse> {
    // 1. Déconnecter Firebase
    const response = await this.firebaseAuth.logout();
    
    // 2. Détruire la session sécurisée
    await sessionService.destroySession();
    this.currentSession = null;

    // 3. Recréer une session locale vierge
    this.currentSession = await sessionService.createSession({
      provider: 'local',
      isLocal: true,
    });

    return response;
  }

  /**
   * Activer / Désactiver la biométrie pour la session courante
   */
  async toggleBiometric(enable: boolean): Promise<boolean> {
    if (!this.currentSession) return false;

    if (enable) {
      const isAvailable = await localAuthService.isAvailable();
      if (!isAvailable) return false;
      
      const success = await localAuthService.authenticate("Autoriser la biométrie pour Ajiya Ta");
      if (!success) return false;
    }

    const updatedSession = await sessionService.setBiometricEnabled(this.currentSession.id, enable);
    if (updatedSession) {
      this.currentSession = updatedSession;
      return true;
    }
    return false;
  }
}

export const authManager = AuthManager.getInstance();
