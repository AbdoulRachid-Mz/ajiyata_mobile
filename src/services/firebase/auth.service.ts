import { 
  auth,
  firestore
} from '@/configs/firebase/config';
import { Storage } from '@/lib/storage';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  reload,
  updateEmail,
  updatePassword,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { AuthUser, AuthCredentials, AuthRegisterData, AuthResponse } from '@/features/auth/types';

export class FirebaseAuthService {
  private static instance: FirebaseAuthService;
  private authStateListener: (() => void) | null = null;
  private currentUser: AuthUser | null = null;

  private constructor() {}

  static getInstance(): FirebaseAuthService {
    if (!FirebaseAuthService.instance) {
      FirebaseAuthService.instance = new FirebaseAuthService();
    }
    return FirebaseAuthService.instance;
  }

  /**
   * Initialiser l'authentification
   */
  initialize(): void {
    this.authStateListener = onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.currentUser = this.mapFirebaseUser(user);
        await Storage.setSession(user.uid);
        await this.saveUserToFirestore(user);
      } else {
        this.currentUser = null;
      }
    });
  }

  /**
   * Nettoyer les listeners
   */
  cleanup(): void {
    if (this.authStateListener) {
      this.authStateListener();
      this.authStateListener = null;
    }
  }

  /**
   * Obtenir l'utilisateur courant
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Mapper un utilisateur Firebase vers notre type AuthUser
   */
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

  /**
   * Sauvegarder l'utilisateur dans Firestore
   */
  private async saveUserToFirestore(user: FirebaseUser): Promise<void> {
    try {
      const userRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Utilisateur',
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
      console.error('Erreur lors de la sauvegarde de l\'utilisateur:', error);
    }
  }

  /**
   * Inscription avec email et mot de passe
   */
  async register(data: AuthRegisterData): Promise<AuthResponse> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
    await Storage.setSession(userCredential.user.uid);

      // Mettre à jour le profil
      await updateProfile(userCredential.user, {
        displayName: data.displayName,
      });

      // --- EMAIL DE VÉRIFICATION DÉSACTIVÉ ---
      // L'envoi automatique lors de l'inscription a été désactivé ici.

      // Sauvegarder dans Firestore
      await this.saveUserToFirestore(userCredential.user);

      // Sauvegarder le token de session
      // La session locale est gérée par AuthManager

      return {
        success: true,
        data: this.mapFirebaseUser(userCredential.user),
      };
    } catch (error: any) {
      console.error('Erreur d\'inscription:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      };
    }
  }

  /**
   * Connexion avec email et mot de passe
   */
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );
    await Storage.setSession(userCredential.user.uid);

      // --- BLOC DE VÉRIFICATION D'EMAIL DÉSACTIVÉ ---
      // La condition qui vérifiait `!userCredential.user.emailVerified` a été supprimée
      // pour permettre aux utilisateurs non vérifiés de se connecter directement.

      // Note: La session locale est maintenant gérée par AuthManager

      return {
        success: true,
        data: this.mapFirebaseUser(userCredential.user),
      };
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      };
    }
  }

  /**
   * Connexion avec Google
   */
  async loginWithGoogle(): Promise<AuthResponse> {
    try {
      return {
        success: false,
        error: "La connexion Google n'est pas encore configurée pour l'application mobile.",
        code: "auth/unsupported-operation",
      };
    } catch (error: any) {
      console.error('Erreur de connexion Google:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      };
    }
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<AuthResponse> {
    try {
      await firebaseSignOut(auth);
    await Storage.removeSession();
      this.currentUser = null;
      return {
        success: true,
      };
    } catch (error: any) {
      console.error('Erreur de déconnexion:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      };
    }
  }

  /**
   * Réinitialiser le mot de passe
   */
  async resetPassword(email: string): Promise<AuthResponse> {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        data: { email },
      };
    } catch (error: any) {
      console.error('Erreur de réinitialisation:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      };
    }
  }

  /**
   * Mettre à jour le profil
   */
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
          error: 'Utilisateur non connecté.',
        };
      }

      await updateProfile(user, data);

      // Mettre à jour Firestore
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });

      // Recharger l'utilisateur
      await reload(user);
      this.currentUser = this.mapFirebaseUser(user);

      return {
        success: true,
        data: this.currentUser,
      };
    } catch (error: any) {
      console.error('Erreur de mise à jour du profil:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      };
    }
  }

  /**
   * Changer le mot de passe
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse> {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        return {
          success: false,
          error: 'Utilisateur non connecté.',
        };
      }

      // Réauthentifier l'utilisateur
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Changer le mot de passe
      await updatePassword(user, newPassword);

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('Erreur de changement de mot de passe:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      };
    }
  }

  /**
   * Supprimer le compte
   */
  async deleteAccount(): Promise<AuthResponse> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return {
          success: false,
          error: 'Utilisateur non connecté.',
        };
      }

      // Supprimer le compte
      await deleteUser(user);

      // Supprimer les données Firestore
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        isActive: false,
        deletedAt: serverTimestamp(),
      });


      this.currentUser = null;

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('Erreur de suppression du compte:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        code: error.code,
      };
    }
  }

  /**
   * Récupérer le message d'erreur approprié
   */
  private getErrorMessage(code: string): string {
    const errors: { [key: string]: string } = {
      'auth/email-already-in-use': 'Cette adresse email est déjà utilisée.',
      'auth/invalid-email': 'Adresse email invalide.',
      'auth/user-disabled': 'Ce compte a été désactivé.',
      'auth/user-not-found': 'Aucun compte associé à cette adresse email.',
      'auth/wrong-password': 'Mot de passe incorrect.',
      'auth/too-many-requests': 'Trop de tentatives. Veuillez réessayer plus tard.',
      'auth/operation-not-allowed': 'Cette opération n\'est pas autorisée.',
      'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
      'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion.',
      'auth/requires-recent-login': 'Veuillez vous reconnecter pour effectuer cette action.',
      // 'auth/email-not-verified': 'Veuillez vérifier votre adresse email avant de vous connecter.', // Plus utilisé
    };

    return errors[code] || 'Une erreur est survenue. Veuillez réessayer.';
  }
}

// Export singleton
export const authService = FirebaseAuthService.getInstance();
