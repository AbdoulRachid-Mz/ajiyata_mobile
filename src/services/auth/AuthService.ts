import { auth, firestore } from "@/configs/firebase/config";
import { db } from "@/db";
import { authSessions } from "@/db/schema";
import {
    AuthCredentials,
    AuthRegisterData,
    AuthResponse,
    AuthUser,
} from "@/features/auth/types";
import { generateUUID } from "@/utils/uuid";
import { desc, eq } from "drizzle-orm";
import * as Device from "expo-device";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import {
    createUserWithEmailAndPassword,
    deleteUser,
    EmailAuthProvider,
    signOut as firebaseSignOut,
    User as FirebaseUser,
    onAuthStateChanged,
    reauthenticateWithCredential,
    reload,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    updatePassword,
    updateProfile
} from "firebase/auth";
import {
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
    updateDoc,
} from "firebase/firestore";
import { Platform } from "react-native";

// Types
type AuthSession = typeof authSessions.$inferSelect;
type NewAuthSession = typeof authSessions.$inferInsert;

const SECURE_STORE_CURRENT_SESSION_ID = "ajiya_current_session_id";
const SECURE_STORE_FIREBASE_REFRESH_TOKEN = "ajiya_firebase_refresh_token";

export class AuthService {
  private static instance: AuthService;
  private currentSession: AuthSession | null = null;
  private currentUser: AuthUser | null = null;
  private authStateListener: (() => void) | null = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // ============================================
  // INITIALIZATION
  // ============================================
  async initialize(): Promise<{ hasSession: boolean }> {
    // Setup Firebase auth listener
    this.authStateListener = onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.currentUser = this.mapFirebaseUser(user);
        await this.saveUserToFirestore(user);
      } else {
        this.currentUser = null;
      }
    });

    // Restore session
    this.currentSession = await this.restoreSession();

    if (this.currentSession) {
      return { hasSession: true };
    }

    // Create local session if none exists
    this.currentSession = await this.createSession({
      provider: "local",
      isLocal: true,
    });

    return { hasSession: true };
  }

  cleanup(): void {
    if (this.authStateListener) {
      this.authStateListener();
      this.authStateListener = null;
    }
  }

  // ============================================
  // SESSION MANAGEMENT
  // ============================================
  getCurrentSession(): AuthSession | null {
    return this.currentSession;
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  isLocalSession(): boolean {
    return this.currentSession?.isLocal ?? true;
  }

  private getDeviceId(): string {
    return `${Platform.OS}-${Device.modelName || "Unknown"}-${Device.osVersion || "Unknown"}`;
  }

  private async createSession(params: {
    firebaseUid?: string;
    provider: "email" | "google" | "apple" | "anonymous" | "local";
    isLocal: boolean;
    refreshToken?: string;
  }): Promise<AuthSession> {
    const deviceId = this.getDeviceId();
    const id = generateUUID();
    const now = new Date();

    const [session] = await db
      .insert(authSessions)
      .values({
        id,
        firebaseUid: params.firebaseUid || null,
        provider: params.provider,
        deviceId,
        isLocal: params.isLocal,
        isSynced: false,
        biometricEnabled: false,
        createdAt: now,
        updatedAt: now,
        lastLogin: now,
        metadata: {},
      })
      .returning();

    await SecureStore.setItemAsync(SECURE_STORE_CURRENT_SESSION_ID, session.id);

    if (params.refreshToken) {
      await SecureStore.setItemAsync(
        SECURE_STORE_FIREBASE_REFRESH_TOKEN,
        params.refreshToken,
      );
    }

    return session;
  }

  private async restoreSession(): Promise<AuthSession | null> {
    try {
      const sessionId = await SecureStore.getItemAsync(
        SECURE_STORE_CURRENT_SESSION_ID,
      );

      if (sessionId) {
        const [session] = await db
          .select()
          .from(authSessions)
          .where(eq(authSessions.id, sessionId));
        if (session) {
          await db
            .update(authSessions)
            .set({ lastLogin: new Date(), updatedAt: new Date() })
            .where(eq(authSessions.id, sessionId));
          return session;
        }
      }

      const [localSession] = await db
        .select()
        .from(authSessions)
        .where(eq(authSessions.isLocal, true))
        .orderBy(desc(authSessions.createdAt))
        .limit(1);

      if (localSession) {
        await db
          .update(authSessions)
          .set({ lastLogin: new Date(), updatedAt: new Date() })
          .where(eq(authSessions.id, localSession.id));
        await SecureStore.setItemAsync(
          SECURE_STORE_CURRENT_SESSION_ID,
          localSession.id,
        );
        return localSession;
      }

      return null;
    } catch (error) {
      console.error("Error restoring session:", error);
      return null;
    }
  }

  private async destroySession(): Promise<void> {
    try {
      const sessionId = await SecureStore.getItemAsync(
        SECURE_STORE_CURRENT_SESSION_ID,
      );

      if (sessionId) {
        await db.delete(authSessions).where(eq(authSessions.id, sessionId));
      }

      await SecureStore.deleteItemAsync(SECURE_STORE_CURRENT_SESSION_ID);
      await SecureStore.deleteItemAsync(SECURE_STORE_FIREBASE_REFRESH_TOKEN);
    } catch (error) {
      console.error("Error destroying session:", error);
    }
  }

  // ============================================
  // FIREBASE AUTHENTICATION
  // ============================================
  private mapFirebaseUser(user: FirebaseUser): AuthUser {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      phoneNumber: user.phoneNumber,
      emailVerified: user.emailVerified,
      isAnonymous: user.isAnonymous,
    };
  }

  private async saveUserToFirestore(user: FirebaseUser): Promise<void> {
    try {
      const userRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || "Utilisateur",
          photoURL: user.photoURL || null,
          phoneNumber: user.phoneNumber || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          isActive: true,
        });
      } else {
        await updateDoc(userRef, {
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error saving user to Firestore:", error);
    }
  }

  private getErrorMessage(code: string): string {
    const errors: { [key: string]: string } = {
      "auth/email-already-in-use": "Cette adresse email est déjà utilisée.",
      "auth/invalid-email": "Adresse email invalide.",
      "auth/user-disabled": "Ce compte a été désactivé.",
      "auth/user-not-found": "Aucun compte associé à cette adresse email.",
      "auth/wrong-password": "Mot de passe incorrect.",
      "auth/too-many-requests":
        "Trop de tentatives. Veuillez réessayer plus tard.",
      "auth/operation-not-allowed": "Cette opération n'est pas autorisée.",
      "auth/weak-password":
        "Le mot de passe doit contenir au moins 6 caractères.",
      "auth/network-request-failed": "Erreur réseau. Vérifiez votre connexion.",
      "auth/requires-recent-login":
        "Veuillez vous reconnecter pour effectuer cette action.",
    };
    return errors[code] || "Une erreur est survenue. Veuillez réessayer.";
  }

  async register(data: AuthRegisterData): Promise<AuthResponse> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password,
      );

      await updateProfile(userCredential.user, {
        displayName: data.displayName,
      });

      await this.saveUserToFirestore(userCredential.user);
      this.currentUser = this.mapFirebaseUser(userCredential.user);

      // Destroy old local session and create new Firebase session
      if (this.currentSession && this.currentSession.isLocal) {
        await this.destroySession();
      }

      this.currentSession = await this.createSession({
        firebaseUid: userCredential.user.uid,
        provider: "email",
        isLocal: false,
      });

      return {
        success: true,
        data: this.currentUser,
      };
    } catch (error: any) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      };
    }
  }

  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password,
      );

      this.currentUser = this.mapFirebaseUser(userCredential.user);

      if (this.currentSession && this.currentSession.isLocal) {
        await this.destroySession();
      }

      this.currentSession = await this.createSession({
        firebaseUid: userCredential.user.uid,
        provider: "email",
        isLocal: false,
      });

      return {
        success: true,
        data: this.currentUser,
      };
    } catch (error: any) {
      console.error("Login error:", error);
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      };
    }
  }

  async logout(): Promise<AuthResponse> {
    try {
      await firebaseSignOut(auth);
      this.currentUser = null;

      await this.destroySession();
      this.currentSession = await this.createSession({
        provider: "local",
        isLocal: true,
      });

      return { success: true };
    } catch (error: any) {
      console.error("Logout error:", error);
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      };
    }
  }

  async resetPassword(email: string): Promise<AuthResponse> {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        data: { email },
      };
    } catch (error: any) {
      console.error("Password reset error:", error);
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      };
    }
  }

  async updateUserProfile(data: {
    displayName?: string;
    photoURL?: string;
    phoneNumber?: string;
  }): Promise<AuthResponse> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return {
          success: false,
          error: "Utilisateur non connecté.",
        };
      }

      await updateProfile(user, data);

      const userRef = doc(firestore, "users", user.uid);
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });

      await reload(user);
      this.currentUser = this.mapFirebaseUser(user);

      return {
        success: true,
        data: this.currentUser,
      };
    } catch (error: any) {
      console.error("Profile update error:", error);
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      };
    }
  }

  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<AuthResponse> {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        return {
          success: false,
          error: "Utilisateur non connecté.",
        };
      }

      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      return { success: true };
    } catch (error: any) {
      console.error("Password change error:", error);
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      };
    }
  }

  async deleteAccount(): Promise<AuthResponse> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return {
          success: false,
          error: "Utilisateur non connecté.",
        };
      }

      const userRef = doc(firestore, "users", user.uid);
      await updateDoc(userRef, {
        isActive: false,
        deletedAt: serverTimestamp(),
      });

      await deleteUser(user);
      this.currentUser = null;

      await this.destroySession();
      this.currentSession = await this.createSession({
        provider: "local",
        isLocal: true,
      });

      return { success: true };
    } catch (error: any) {
      console.error("Account deletion error:", error);
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      };
    }
  }

  // ============================================
  // BIOMETRIC AUTHENTICATION
  // ============================================
  async isBiometricAvailable(): Promise<{
    available: boolean;
    types: string[];
    enrolled: boolean;
  }> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes =
      await LocalAuthentication.supportedAuthenticationTypesAsync();

    return {
      available: hasHardware && isEnrolled,
      types: supportedTypes.map((t) => t.toString()),
      enrolled: isEnrolled,
    };
  }

  async isBiometricEnabled(): Promise<boolean> {
    return this.currentSession?.biometricEnabled ?? false;
  }

  async enableBiometric(): Promise<boolean> {
    if (!this.currentSession) return false;

    const { available } = await this.isBiometricAvailable();
    if (!available) return false;

    const success = await this.authenticateBiometric(
      "Autoriser la biométrie pour Ajiya Ta",
    );
    if (!success) return false;

    const [updatedSession] = await db
      .update(authSessions)
      .set({ biometricEnabled: true, updatedAt: new Date() })
      .where(eq(authSessions.id, this.currentSession.id))
      .returning();

    if (updatedSession) {
      this.currentSession = updatedSession;
      return true;
    }

    return false;
  }

  async disableBiometric(): Promise<void> {
    if (!this.currentSession) return;

    const [updatedSession] = await db
      .update(authSessions)
      .set({ biometricEnabled: false, updatedAt: new Date() })
      .where(eq(authSessions.id, this.currentSession.id))
      .returning();

    if (updatedSession) {
      this.currentSession = updatedSession;
    }
  }

  async authenticateBiometric(
    promptMessage: string = "Déverrouiller Ajiya Ta",
  ): Promise<boolean> {
    try {
      const { available } = await this.isBiometricAvailable();
      if (!available) {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: "Utiliser le code PIN",
        disableDeviceFallback: false,
        cancelLabel: "Annuler",
      });

      return result.success;
    } catch (error) {
      console.error("Biometric authentication error:", error);
      return false;
    }
  }
}

export const authService = AuthService.getInstance();
