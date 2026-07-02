import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { INotificationService, NotificationData, ScheduledNotification } from './index';

// Configuration du comportement des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NativeNotificationService implements INotificationService {
  private static instance: NativeNotificationService;
  private notificationListener: any;
  private responseListener: any;
  private isRegistered: boolean = false;

  private constructor() {}

  static getInstance(): NativeNotificationService {
    if (!NativeNotificationService.instance) {
      NativeNotificationService.instance = new NativeNotificationService();
    }
    return NativeNotificationService.instance;
  }

  async initialize(): Promise<void> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('🔕 Permissions de notification refusées');
        return;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#16a34a',
        });

        await Notifications.setNotificationChannelAsync('budget', {
          name: 'Budget Alerts',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#f59e0b',
        });

        await Notifications.setNotificationChannelAsync('savings', {
          name: 'Savings Reminders',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3b82f6',
        });
      }

      await this.registerForPushNotifications();
      this.addListeners();

      console.log('✅ Notifications initialisées avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des notifications:', error);
    }
  }

  private async registerForPushNotifications(): Promise<void> {
    if (!Device.isDevice) {
      console.log('⚠️ Les notifications push ne sont pas supportées sur l\'émulateur');
      return;
    }

    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      console.log('📱 Expo Push Token:', token.data);
      await this.savePushToken(token.data);
      await this.sendTokenToServer(token.data);
      this.isRegistered = true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement du token:', error);
    }
  }

  private async savePushToken(token: string): Promise<void> {
    try {
      const { Storage } = await import('@/lib/storage');
      await Storage.setItem('push_token', token);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du token:', error);
    }
  }

  private async sendTokenToServer(token: string): Promise<void> {
    try {
      const { firestore } = await import('@/configs/firebase/config');
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const userId = await this.getUserId();

      if (!userId) {
        console.log('⚠️ Utilisateur non connecté, token non sauvegardé');
        return;
      }

      const tokenRef = doc(firestore, 'users', userId, 'tokens', token);
      await setDoc(tokenRef, {
        token,
        device: Device.modelName,
        platform: Platform.OS,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
      });

      console.log('✅ Token push sauvegardé sur Firestore');
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du token au serveur:', error);
    }
  }

  private async getUserId(): Promise<string | null> {
    try {
      const { Storage } = await import('@/lib/storage');
      return await Storage.getSession();
    } catch {
      return null;
    }
  }

  private addListeners(): void {
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📬 Notification reçue:', notification);
        this.handleNotificationReceived(notification);
      }
    );

    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('👆 Notification cliquée:', response);
        this.handleNotificationResponse(response);
      }
    );
  }

  private handleNotificationReceived(notification: Notifications.Notification): void {
    const data = notification.request.content.data;
    if (data?.type === 'budget_alert') {
      console.log('💰 Alerte budget:', data);
    } else if (data?.type === 'savings_reminder') {
      console.log('💾 Rappel épargne:', data);
    }
  }

  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data;
    const action = response.actionIdentifier;

    if (data?.route) {
      console.log('📍 Navigation vers:', data.route);
    }

    if (data?.type === 'budget_alert') {
      console.log('💰 Budget alert action:', action);
    }
  }

  async sendNotification(notification: NotificationData): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: notification.sound || 'default',
          badge: notification.badge || 1,
          categoryIdentifier: notification.categoryIdentifier,
        },
        trigger: null,
      });

      console.log('📨 Notification envoyée:', notification.title);
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de la notification:', error);
    }
  }

  async scheduleNotification(notification: ScheduledNotification): Promise<string> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: notification.sound || 'default',
          badge: notification.badge || 1,
          categoryIdentifier: notification.categoryIdentifier,
        },
        trigger: notification.trigger as any,
      });

      console.log('📅 Notification planifiée:', identifier);
      return identifier;
    } catch (error) {
      console.error('❌ Erreur lors de la planification de la notification:', error);
      return '';
    }
  }

  async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      console.log('❌ Notification annulée:', identifier);
    } catch (error) {
      console.error('❌ Erreur lors de l\'annulation de la notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('🗑️ Toutes les notifications ont été annulées');
    } catch (error) {
      console.error('❌ Erreur lors de l\'annulation des notifications:', error);
    }
  }

  cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }
}

// Export singleton
export const notificationService = NativeNotificationService.getInstance();