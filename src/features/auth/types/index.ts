import { User } from 'firebase/auth';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthRegisterData extends AuthCredentials {
  displayName: string;
  phoneNumber?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export type AuthMethod = 'email' | 'google' | 'biometric';

export interface AuthResponse {
  success: boolean;
  data?: AuthUser | any;
  error?: string;
  code?: string;
}