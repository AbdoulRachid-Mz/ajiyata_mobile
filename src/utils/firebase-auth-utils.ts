// @/utils/firebase-auth-utils.ts
import { auth } from "@/configs/firebase/config";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { getFirebaseErrorMessage } from "./getFirebaseErrorMessage";
import { Platform } from "react-native";

// Import dynamique sécurisé du module natif
let GoogleSignin: any = null;
try {
  GoogleSignin = require("@react-native-google-signin/google-signin").GoogleSignin;
  
  if (GoogleSignin) {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    });
  }
} catch (e) {
  console.warn("GoogleSignin natif non disponible dans cet environnement.");
}

export interface AuthResponse {
  data?: any;
  error?: {
    code: string;
    message: string;
  };
}

const handleFirebaseError = (
  error: unknown,
  method: string = "unknown",
): { code: string; message: string } => {
  if (error instanceof Error) {
    const errorCode = error.message.split(" ")[0]; // Extraire le code d'erreur
    return {
      code: errorCode,
      message: getFirebaseErrorMessage(method, errorCode),
    };
  }

  return {
    code: "unknown-error",
    message: getFirebaseErrorMessage("unknown", "unknown"),
  };
};

export const firebaseSignUpWithEmail = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    return { data: userCredential.user };
  } catch (error) {
    return {
      error: handleFirebaseError(error, "createUserWithEmailAndPassword"),
    };
  }
};

export const firebaseSignInWithEmail = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    return { data: userCredential.user };
  } catch (error) {
    return { error: handleFirebaseError(error, "signInWithEmailAndPassword") };
  }
};

export const firebaseSendPasswordResetEmail = async (
  email: string,
): Promise<AuthResponse> => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { data: true };
  } catch (error) {
    return { error: handleFirebaseError(error, "sendPasswordResetEmail") };
  }
};

export const firebaseSignInWithGoogle = async () => {
  if (!GoogleSignin) {
    return {
      data: null,
      error: {
        code: "auth/native-module-missing",
        message: "Module natif Google Sign-In introuvable. Veuillez exécuter 'npx expo run:android'.",
      },
    };
  }

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    const idToken = response.data?.idToken || (response as any).idToken;

    if (!idToken) {
      throw new Error("Impossible de récupérer l'idToken Google");
    }

    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);

    return {
      data: userCredential.user,
      error: null,
    };
  } catch (error: any) {
    console.error("Erreur Google Auth:", error);
    return {
      data: null,
      error: {
        code: error.code || "unknown",
        message: error.message || "Erreur de connexion Google",
      },
    };
  }
};

export const firebaseSignOut = async (): Promise<AuthResponse> => {
  try {
    await signOut(auth);
    return { data: true };
  } catch (error) {
    return { error: handleFirebaseError(error, "signOut") };
  }
};
