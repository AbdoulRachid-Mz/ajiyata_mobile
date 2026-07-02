import Constants from 'expo-constants';

// Déterminer si on est dans Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Exporter la bonne version
export * from './notifications.mock';

// Si ce n'est pas Expo Go, on exporte la version native en plus
if (!isExpoGo) {
  // On va importer dynamiquement la version native
  // mais pour l'export, on garde la mock par défaut
  // La version native sera chargée via le context
}

// Exporter les types communs
export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
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