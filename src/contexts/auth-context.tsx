import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '@/services/firebase/auth.service';
import { AuthUser, AuthCredentials, AuthRegisterData, AuthResponse } from '@/features/auth/types';
import { Storage } from '@/lib/storage';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (credentials: AuthCredentials) => Promise<AuthResponse>;
  register: (data: AuthRegisterData) => Promise<AuthResponse>;
  logout: () => Promise<AuthResponse>;
  resetPassword: (email: string) => Promise<AuthResponse>;
  loginWithGoogle: () => Promise<AuthResponse>;
  loginWithBiometric: () => Promise<AuthResponse>;
  enableBiometric: () => Promise<AuthResponse>;
  isBiometricEnabled: () => Promise<boolean>;
  isBiometricAvailable: () => Promise<{ available: boolean; types: string[]; enrolled: boolean }>;
  updateProfile: (data: { displayName?: string; photoURL?: string; phoneNumber?: string }) => Promise<AuthResponse>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthResponse>;
  deleteAccount: () => Promise<AuthResponse>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Initialiser le service d'authentification
        authService.initialize();

        // Vérifier si un utilisateur est déjà connecté
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        } else {
          // Vérifier si une session existe
          const userId = await Storage.getSession();
          if (userId) {
            // Essayer de récupérer l'utilisateur
            const firebaseUser = authService.getCurrentUser();
            if (firebaseUser) {
              setUser(firebaseUser);
            }
          }
        }
      } catch (error) {
        console.error('Erreur d\'initialisation de l\'authentification:', error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    init();

    return () => {
      authService.cleanup();
    };
  }, []);

  const refreshUser = async (): Promise<void> => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  };

  const login = async (credentials: AuthCredentials): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      if (response.success && response.data) {
        setUser(response.data as AuthUser);
      }
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: AuthRegisterData): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authService.register(data);
      if (response.success && response.data) {
        setUser(response.data as AuthUser);
      }
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authService.logout();
      if (response.success) {
        setUser(null);
      }
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<AuthResponse> => {
    return await authService.resetPassword(email);
  };

  const loginWithGoogle = async (): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authService.loginWithGoogle();
      if (response.success && response.data) {
        setUser(response.data as AuthUser);
      }
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithBiometric = async (): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authService.loginWithBiometric();
      if (response.success && response.data) {
        setUser(response.data as AuthUser);
      }
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const enableBiometric = async (): Promise<AuthResponse> => {
    return await authService.enableBiometric();
  };

  const isBiometricEnabled = async (): Promise<boolean> => {
    return await authService.isBiometricEnabled();
  };

  const isBiometricAvailable = async () => {
    return await authService.isBiometricAvailable();
  };

  const updateProfile = async (data: { displayName?: string; photoURL?: string; phoneNumber?: string }) => {
    const response = await authService.updateUserProfile(data);
    if (response.success && response.data) {
      setUser(response.data as AuthUser);
    }
    return response;
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    return await authService.changePassword(currentPassword, newPassword);
  };

  const deleteAccount = async () => {
    const response = await authService.deleteAccount();
    if (response.success) {
      setUser(null);
    }
    return response;
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isInitialized,
    login,
    register,
    logout,
    resetPassword,
    loginWithGoogle,
    loginWithBiometric,
    enableBiometric,
    isBiometricEnabled,
    isBiometricAvailable,
    updateProfile,
    changePassword,
    deleteAccount,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};