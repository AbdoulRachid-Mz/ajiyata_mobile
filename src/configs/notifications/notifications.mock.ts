import { INotificationService, NotificationData, ScheduledNotification } from './index';

export class MockNotificationService implements INotificationService {
  private static instance: MockNotificationService;

  private constructor() {}

  static getInstance(): MockNotificationService {
    if (!MockNotificationService.instance) {
      MockNotificationService.instance = new MockNotificationService();
    }
    return MockNotificationService.instance;
  }

  async initialize(): Promise<void> {
    console.log('🔕 Notifications désactivées (Expo Go)');
  }

  async sendNotification(notification: NotificationData): Promise<void> {
    console.log('📨 [MOCK] Notification envoyée:', notification.title);
  }

  async scheduleNotification(notification: ScheduledNotification): Promise<string> {
    console.log('📅 [MOCK] Notification planifiée:', notification.title);
    return 'mock-schedule-id';
  }

  async cancelNotification(identifier: string): Promise<void> {
    console.log('❌ [MOCK] Notification annulée:', identifier);
  }

  async cancelAllNotifications(): Promise<void> {
    console.log('🗑️ [MOCK] Toutes les notifications annulées');
  }

  cleanup(): void {
    console.log('🧹 [MOCK] Nettoyage des notifications');
  }
}

// Export singleton
export const notificationService = MockNotificationService.getInstance();