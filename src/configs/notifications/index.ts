import Constants, { ExecutionEnvironment } from "expo-constants";

// Déterminer si on est dans Expo Go
export const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Exporter les types communs
export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: string;
  badge?: number;
  categoryIdentifier?: string;
}

export interface ScheduledNotification extends NotificationData {
  trigger: {
    seconds?: number;
    repeats?: boolean;
    date?: Date;
    hour?: number;
    minute?: number;
  };
}

// Interface du service
export interface INotificationService {
  initialize(): Promise<void>;
  sendNotification(notification: NotificationData): Promise<void>;
  scheduleNotification(notification: ScheduledNotification): Promise<string>;
  cancelNotification(identifier: string): Promise<void>;
  cancelAllNotifications(): Promise<void>;
  cleanup(): void;
}

// Exporter les services
import { notificationService as mockNotificationService } from "./notifications.mock";
export { mockNotificationService };

let notificationService: INotificationService;

if (isExpoGo) {
  notificationService = mockNotificationService;
} else {
  // Dynamically import native service to avoid loading expo-notifications in Expo Go
  notificationService = require("./notifications.native").notificationService;
}

export { notificationService };

// Export native service (for type purposes)
  export type { NativeNotificationService } from "./notifications.native";

