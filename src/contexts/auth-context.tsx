import {
  AuthCredentials,
  AuthRegisterData,
  AuthResponse,
  AuthUser,
} from "@/features/auth/types";
import { authService } from "@/services/auth/AuthService";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLocal: boolean;
  login: (credentials: AuthCredentials) => Promise<AuthResponse>;
  register: (data: AuthRegisterData) => Promise<AuthResponse>;
  logout: () => Promise<AuthResponse>;
  resetPassword: (email: string) => Promise<AuthResponse>;
  loginWithGoogle: () => Promise<AuthResponse>;
  loginWithBiometric: () => Promise<AuthResponse>;
  enableBiometric: () => Promise<boolean>;
  disableBiometric: () => Promise<void>;
  isBiometricEnabled: boolean;
  isBiometricAvailable: () => Promise<{
    available: boolean;
    types: string[];
    enrolled: boolean;
  }>;
  updateProfile: (data: {
    displayName?: string;
    photoURL?: string;
    phoneNumber?: string;
  }) => Promise<AuthResponse>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<AuthResponse>;
  deleteAccount: () => Promise<AuthResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const { hasSession } = await authService.initialize();

        if (hasSession) {
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          } else {
            setUser({
              uid: "local",
              email: "Utilisateur Local",
              displayName: "Mode Hors-Ligne",
              photoURL: null,
              phoneNumber: null,
              emailVerified: false,
              isAnonymous: true,
            });
          }

          const bioEnabled = await authService.isBiometricEnabled();
          setIsBiometricEnabled(bioEnabled);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
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

  const login = async (credentials: AuthCredentials): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      if (response.success && response.data) {
        setUser(response.data as AuthUser);
        const bioEnabled = await authService.isBiometricEnabled();
        setIsBiometricEnabled(bioEnabled);
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
        const bioEnabled = await authService.isBiometricEnabled();
        setIsBiometricEnabled(bioEnabled);
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
        setUser({
          uid: "local",
          email: "Utilisateur Local",
          displayName: "Mode Hors-Ligne",
          photoURL: null,
          phoneNumber: null,
          emailVerified: false,
          isAnonymous: true,
        });
        setIsBiometricEnabled(false);
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
    return { success: false, error: "Google login not implemented yet" };
  };

  const loginWithBiometric = async (): Promise<AuthResponse> => {
    const success = await authService.authenticateBiometric();
    if (success) {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser({
          uid: "local",
          email: "Utilisateur Local",
          displayName: "Mode Hors-Ligne",
          photoURL: null,
          phoneNumber: null,
          emailVerified: false,
          isAnonymous: true,
        });
      }
      return { success: true };
    }
    return { success: false, error: "Biometric authentication failed" };
  };

  const enableBiometric = async (): Promise<boolean> => {
    const success = await authService.enableBiometric();
    if (success) {
      setIsBiometricEnabled(true);
    }
    return success;
  };

  const disableBiometric = async (): Promise<void> => {
    await authService.disableBiometric();
    setIsBiometricEnabled(false);
  };

  const isBiometricAvailable = async () => {
    return await authService.isBiometricAvailable();
  };

  const updateProfile = async (data: {
    displayName?: string;
    photoURL?: string;
    phoneNumber?: string;
  }) => {
    const response = await authService.updateUserProfile(data);
    if (response.success && response.data) {
      setUser(response.data as AuthUser);
    }
    return response;
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    return await authService.changePassword(currentPassword, newPassword);
  };

  const deleteAccount = async () => {
    const response = await authService.deleteAccount();
    if (response.success) {
      setUser({
        uid: "local",
        email: "Utilisateur Local",
        displayName: "Mode Hors-Ligne",
        photoURL: null,
        phoneNumber: null,
        emailVerified: false,
        isAnonymous: true,
      });
      setIsBiometricEnabled(false);
    }
    return response;
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && user.uid !== "local",
    isInitialized,
    isLocal: !user || user.uid === "local",
    login,
    register,
    logout,
    resetPassword,
    loginWithGoogle,
    loginWithBiometric,
    enableBiometric,
    disableBiometric,
    isBiometricEnabled,
    isBiometricAvailable,
    updateProfile,
    changePassword,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
