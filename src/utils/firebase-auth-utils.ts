import { auth } from "@/configs/firebase/config";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";
import { getFirebaseErrorMessage } from "./getFirebaseErrorMessage";
// import { getFirebaseErrorMessage } from './getFirebaseErrorMessage';

export interface AuthResponse {
  data?: any;
  error?: {
    code: string;
    message: string;
  };
}

const handleFirebaseError = (
  error: unknown,
  method: string = "unknown"
): { code: string; message: string } => {
  if (error instanceof Error) {
    const errorCode = error.message.split(' ')[0]; // Extraire le code d'erreur
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
  password: string
): Promise<AuthResponse> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    return { data: userCredential.user };
  } catch (error) {
    return { error: handleFirebaseError(error, 'createUserWithEmailAndPassword') };
  }
};

export const firebaseSignInWithEmail = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return { data: userCredential.user };
  } catch (error) {
    return { error: handleFirebaseError(error, 'signInWithEmailAndPassword') };
  }
};

export const firebaseSendPasswordResetEmail = async (
  email: string
): Promise<AuthResponse> => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { data: true };
  } catch (error) {
    return { error: handleFirebaseError(error, 'sendPasswordResetEmail') };
  }
};

export const firebaseSignInWithGoogle = async (): Promise<AuthResponse> => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    if (!result.user) {
      throw new Error("No user returned from Google sign in");
    }

    return { data: result.user };
  } catch (error) {
    return { error: handleFirebaseError(error, 'signInWithPopup') };
  }
};

export const firebaseSignOut = async (): Promise<AuthResponse> => {
  try {
    await signOut(auth);
    return { data: true };
  } catch (error) {
    return { error: handleFirebaseError(error, 'signOut') };
  }
};