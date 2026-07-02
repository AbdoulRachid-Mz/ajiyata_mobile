import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Vérifier si on est dans Expo Go (SDK 53+ n'aime pas expo-notifications dans Expo Go)
const isExpoGo = Constants.appOwnership === 'expo';

// Configuration du comportement des notifications
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

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

export class NotificationService {
  private static instance: NotificationService;
  private notificationListener: any;
  private responseListener: any;
  private isRegistered: boolean = false;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialiser les notifications
   */
  async initialize(): Promise<void> {
    if (isExpoGo) {
      console.log('⚠️ Notifications non supportées dans Expo Go (SDK 53+)');
      return;
    }

    try {
      // Demander les permissions
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

      // Configurer pour Android
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

      // Enregistrer le token Firebase
      await this.registerForPushNotifications();

      // Ajouter les listeners
      this.addListeners();

      console.log('✅ Notifications initialisées avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des notifications:', error);
    }
  }

  /**
   * Enregistrer pour les notifications push
   */
  private async registerForPushNotifications(): Promise<void> {
    if (!Device.isDevice || isExpoGo) {
      console.log('⚠️ Les notifications push ne sont pas supportées sur l\'émulateur ou dans Expo Go');
      return;
    }

    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      console.log('📱 Expo Push Token:', token.data);

      // Sauvegarder le token localement
      await this.savePushToken(token.data);

      // Envoyer le token au serveur (Firestore)
      await this.sendTokenToServer(token.data);

      this.isRegistered = true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement du token:', error);
    }
  }

  /**
   * Sauvegarder le token localement
   */
  private async savePushToken(token: string): Promise<void> {
    try {
      const { Storage } = await import('@/lib/storage');
      await Storage.setItem('push_token', token);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du token:', error);
    }
  }

  /**
   * Envoyer le token au serveur (Firestore)
   */
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

  /**
   * Récupérer l'ID utilisateur
   */
  private async getUserId(): Promise<string | null> {
    try {
      const { Storage } = await import('@/lib/storage');
      return await Storage.getSession();
    } catch {
      return null;
    }
  }

  /**
   * Ajouter les listeners de notifications
   */
  private addListeners(): void {
    if (isExpoGo) return;

    // Écouter les notifications reçues pendant que l'app est active
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📬 Notification reçue:', notification);
        this.handleNotificationReceived(notification);
      }
    );

    // Écouter les interactions avec les notifications
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('👆 Notification cliquée:', response);
        this.handleNotificationResponse(response);
      }
    );
  }

  /**
   * Gérer les notifications reçues
   */
  private handleNotificationReceived(notification: Notifications.Notification): void {
    const data = notification.request.content.data;
    
    // Traiter les données de la notification
    if (data?.type === 'budget_alert') {
      // Notification de budget
      console.log('💰 Alerte budget:', data);
    } else if (data?.type === 'savings_reminder') {
      // Rappel d'épargne
      console.log('💾 Rappel épargne:', data);
    }
  }

  /**
   * Gérer les réponses aux notifications
   */
  private handleNotificationResponse(
    response: Notifications.NotificationResponse
  ): void {
    const data = response.notification.request.content.data;
    const action = response.actionIdentifier;

    // Naviguer en fonction de la notification
    if (data?.route) {
      // Utiliser la navigation pour rediriger
      console.log('📍 Navigation vers:', data.route);
    }

    if (data?.type === 'budget_alert') {
      // Ouvrir l'écran des budgets
      console.log('💰 Budget alert action:', action);
    }
  }

  /**
   * Envoyer une notification push
   */
  async sendNotification(notification: NotificationData): Promise<void> {
    if (isExpoGo) return;
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
        trigger: null, // Envoyer immédiatement
      });

      console.log('📨 Notification envoyée:', notification.title);
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de la notification:', error);
    }
  }

  /**
   * Planifier une notification
   */
  async scheduleNotification(notification: ScheduledNotification): Promise<string> {
    if (isExpoGo) return '';
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

  /**
   * Annuler une notification planifiée
   */
  async cancelNotification(identifier: string): Promise<void> {
    if (isExpoGo) return;
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      console.log('❌ Notification annulée:', identifier);
    } catch (error) {
      console.error('❌ Erreur lors de l\'annulation de la notification:', error);
    }
  }

  /**
   * Annuler toutes les notifications
   */
  async cancelAllNotifications(): Promise<void> {
    if (isExpoGo) return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('🗑️ Toutes les notifications ont été annulées');
    } catch (error) {
      console.error('❌ Erreur lors de l\'annulation des notifications:', error);
    }
  }

  /**
   * Nettoyer les listeners
   */
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
export const notificationService = NotificationService.getInstance();
