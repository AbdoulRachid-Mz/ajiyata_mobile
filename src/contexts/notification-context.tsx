// src/contexts/notification-context.tsx

import {
  isExpoGo,
  notificationService,
  type INotificationService,
  type NotificationData,
  type ScheduledNotification,
} from "@/configs/notifications";
import { useAppStore } from "@/stores/app-store";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter, usePathname } from "expo-router";

interface NotificationContextType {
  isInitialized: boolean;
  isEnabled: boolean;
  isExpoGo: boolean;
  sendNotification: (notification: NotificationData) => Promise<void>;
  scheduleNotification: (
    notification: ScheduledNotification,
  ) => Promise<string>;
  cancelNotification: (identifier: string) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  setEnabled: (enabled: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const service: INotificationService = notificationService;

  // Initialisation
  useEffect(() => {
    const init = async () => {
      if (isExpoGo) {
        console.log("⚠️ Mode Expo Go - Notifications mockées");
        setIsInitialized(true);
        return;
      }

      if (currentUser) {
        await service.initialize();
        setIsInitialized(true);
      }
    };

    init();

    return () => {
      service.cleanup();
    };
  }, [currentUser]);

  // Gestion des clics sur les notifications
  useEffect(() => {
    if (isExpoGo) return;

    // Écouter les événements de navigation depuis les notifications
    const handler = (event: any) => {
      const { route, params } = event.detail;
      console.log('🧭 Navigation depuis notification:', route, params);
      if (params) {
        router.push({ pathname: route, params } as any);
      } else {
        router.push(route as any);
      }
    };

    // @ts-ignore - CustomEvent support
    global.addEventListener?.('notification-navigation', handler);

    return () => {
      // @ts-ignore
      global.removeEventListener?.('notification-navigation', handler);
    };
  }, [router]);

  // S'assurer que le handler est configuré au niveau racine
  // Le handler est déjà configuré dans notifications.native.ts

  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    if (!enabled) {
      service.cancelAllNotifications();
    }
  }, []);

  const value: NotificationContextType = {
    isInitialized,
    isEnabled,
    isExpoGo,
    sendNotification: useCallback(async (notification: NotificationData) => {
      if (!isEnabled) return;
      await service.sendNotification(notification);
    }, [isEnabled]),
    scheduleNotification: useCallback(async (notification: ScheduledNotification) => {
      if (!isEnabled) return "";
      return await service.scheduleNotification(notification);
    }, [isEnabled]),
    cancelNotification: useCallback(async (identifier: string) => {
      await service.cancelNotification(identifier);
    }, []),
    cancelAllNotifications: useCallback(async () => {
      await service.cancelAllNotifications();
    }, []),
    setEnabled,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};