import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Constants from 'expo-constants';
import { notificationService } from '@/configs/notifications';
import { useAppStore } from '@/stores/app-store';
import type { NotificationData, ScheduledNotification } from '@/configs/notifications';

const isExpoGo = Constants.appOwnership === 'expo';

interface NotificationContextType {
  isInitialized: boolean;
  isEnabled: boolean;
  isExpoGo: boolean;
  sendNotification: (notification: NotificationData) => Promise<void>;
  scheduleNotification: (notification: ScheduledNotification) => Promise<string>;
  cancelNotification: (identifier: string) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  setEnabled: (enabled: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAppStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    const init = async () => {
      // Dans Expo Go, on initialise immédiatement (mock)
      if (isExpoGo) {
        console.log('⚠️ Mode Expo Go - Notifications mockées');
        setIsInitialized(true);
        return;
      }

      // Mode Development Build
      if (currentUser) {
        await notificationService.initialize();
        setIsInitialized(true);
      }
    };

    init();

    return () => {
      if (!isExpoGo) {
        notificationService.cleanup();
      }
    };
  }, [currentUser]);

  const setEnabled = (enabled: boolean) => {
    setIsEnabled(enabled);
    if (!enabled && !isExpoGo) {
      notificationService.cancelAllNotifications();
    }
  };

  const value: NotificationContextType = {
    isInitialized,
    isEnabled,
    isExpoGo,
    sendNotification: async (notification: NotificationData) => {
      if (!isEnabled) return;
      await notificationService.sendNotification(notification);
    },
    scheduleNotification: async (notification: ScheduledNotification) => {
      if (!isEnabled) return '';
      return await notificationService.scheduleNotification(notification);
    },
    cancelNotification: async (identifier: string) => {
      await notificationService.cancelNotification(identifier);
    },
    cancelAllNotifications: async () => {
      await notificationService.cancelAllNotifications();
    },
    setEnabled,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};