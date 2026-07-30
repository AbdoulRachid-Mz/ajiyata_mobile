// src/configs/notifications/notifications.native.ts

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import i18n from "@/configs/i18n";
import {
  INotificationService,
  NotificationData,
  ScheduledNotification,
} from "./index";
import {
  setupNotificationHandler,
  setupNotificationCategories,
  setupAndroidChannels,
} from "./handler";

// Configuration du handler
setupNotificationHandler();

export class NativeNotificationService implements INotificationService {
  private static instance: NativeNotificationService;
  private notificationListener: any;
  private responseListener: any;
  private isRegistered: boolean = false;
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): NativeNotificationService {
    if (!NativeNotificationService.instance) {
      NativeNotificationService.instance = new NativeNotificationService();
    }
    return NativeNotificationService.instance;
  }

  /**
   * Initialise le service de notifications
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await setupAndroidChannels();
      await setupNotificationCategories();

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("🔕 Permissions de notification refusées");
        return;
      }

      await this.registerForPushNotifications();
      this.addListeners();

      this.isInitialized = true;
      console.log("✅ Notifications initialisées avec succès");
    } catch (error) {
      console.error(
        "❌ Erreur lors de l'initialisation des notifications:",
        error,
      );
    }
  }

  /**
   * Enregistre l'appareil pour les notifications push
   */
  private async registerForPushNotifications(): Promise<void> {
    if (!Device.isDevice) {
      console.log(
        "⚠️ Les notifications push ne sont pas supportées sur l'émulateur",
      );
      return;
    }

    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      console.log("📱 Expo Push Token:", token.data);
      await this.savePushToken(token.data);
      await this.sendTokenToServer(token.data);
      this.isRegistered = true;
    } catch (error) {
      console.error("❌ Erreur lors de l'enregistrement du token:", error);
    }
  }

  /**
   * Sauvegarde le token push localement
   */
  private async savePushToken(token: string): Promise<void> {
    try {
      const { Storage } = await import("@/lib/storage");
      await Storage.setItem("push_token", token);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du token:", error);
    }
  }

  /**
   * Envoie le token push au serveur (Firestore)
   */
  private async sendTokenToServer(token: string): Promise<void> {
    try {
      const { firestore } = await import("@/configs/firebase/config");
      const { doc, setDoc, serverTimestamp } =
        await import("firebase/firestore");
      const userId = await this.getUserId();

      if (!userId) {
        console.log("⚠️ Utilisateur non connecté, token non sauvegardé");
        return;
      }

      const tokenRef = doc(firestore, "users", userId, "tokens", token);
      await setDoc(tokenRef, {
        token,
        device: Device.modelName,
        platform: Platform.OS,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
      });

      console.log("✅ Token push sauvegardé sur Firestore");
    } catch (error) {
      console.error("❌ Erreur lors de l'envoi du token au serveur:", error);
    }
  }

  /**
   * Récupère l'ID utilisateur
   */
  private async getUserId(): Promise<string | null> {
    try {
      const { Storage } = await import("@/lib/storage");
      return await Storage.getSession();
    } catch {
      return null;
    }
  }

  /**
   * Ajoute les listeners de notifications
   */
  private addListeners(): void {
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("📬 Notification reçue:", notification);
        this.handleNotificationReceived(notification);
      },
    );

    this.responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("👆 Notification cliquée:", response);
        this.handleNotificationResponse(response);
      });
  }

  /**
   * Gère les notifications reçues
   */
  private handleNotificationReceived(
    notification: Notifications.Notification,
  ): void {
    const data = notification.request.content.data;
    const type = data?.type;

    switch (type) {
      case "budget_alert":
        console.log("💰 Alerte budget:", data);
        break;
      case "budget_reminder":
        console.log("💡 Rappel budget:", data);
        break;
      case "savings_reminder":
        console.log("💾 Rappel épargne:", data);
        break;
      case "daily_reminder":
        console.log("📅 Rappel quotidien:", data);
        break;
      default:
        console.log("📬 Notification:", data);
    }
  }

  /**
   * Gère les réponses aux notifications (clic) - AVEC TRADUCTIONS
   */
  private handleNotificationResponse(
    response: Notifications.NotificationResponse,
  ): void {
    const data = response.notification.request.content.data;
    const actionId = response.actionIdentifier;
    const type = data?.type;

    console.log("👆 Action:", actionId, "Type:", type, "Data:", data);

    switch (actionId) {
      case "CREATE_BUDGET":
        this.navigateTo("/budget-create");
        break;
      case "VIEW_BUDGETS":
        this.navigateTo("/(tabs)/budgets");
        break;
      case "VIEW_TRANSACTIONS":
        this.navigateTo("/(tabs)/transactions");
        break;
      case "EDIT_BUDGET":
        if (data?.budgetId) {
          this.navigateTo(`/budget-edit?id=${data.budgetId}`);
        }
        break;
      case "ADD_SAVINGS":
        if (data?.goalId) {
          this.navigateTo("/goals", {
            action: "add_funds",
            goalId: data.goalId,
          });
        }
        break;
      case "VIEW_GOALS":
        this.navigateTo("/(tabs)/goals");
        break;
      default:
        if (data?.route) {
          this.navigateTo(data.route as string);
        } else if (type === "budget_reminder") {
          this.navigateTo("/budget-create");
        } else if (type === "budget_alert") {
          this.navigateTo("/(tabs)/budgets");
        } else if (type === "savings_reminder") {
          this.navigateTo("/(tabs)/goals");
        } else if (type === "daily_reminder") {
          this.navigateTo("/(tabs)/dashboard");
        }
        break;
    }
  }

  /**
   * Navigue vers un écran
   */
  private navigateTo(route: string, params?: any): void {
    const event = new CustomEvent("notification-navigation", {
      detail: { route, params },
    });
    // @ts-ignore - CustomEvent support
    global.dispatchEvent?.(event);
    try {
      const { router } = require("expo-router");
      if (params) {
        router.push({ pathname: route, params });
      } else {
        router.push(route);
      }
    } catch (error) {
      console.error("Erreur de navigation:", error);
    }
  }

  /**
   * Traduit une notification
   */
  private translateNotification(
    title: string,
    body: string,
    data?: any,
  ): { title: string; body: string } {
    let translatedTitle = title;
    let translatedBody = body;

    // Si le titre est une clé de traduction
    if (title.startsWith("notifications.")) {
      translatedTitle = String(i18n.t(title, data));
    }

    // Si le corps est une clé de traduction
    if (body.startsWith("notifications.")) {
      translatedBody = String(i18n.t(body, data));
    }

    return { title: translatedTitle, body: translatedBody };
  }

  /**
   * Envoie une notification immédiate - AVEC TRADUCTIONS
   */
  async sendNotification(notification: NotificationData): Promise<void> {
    try {
      const { title, body } = this.translateNotification(
        notification.title,
        notification.body,
        notification.data,
      );

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: notification.data || {},
          sound: notification.sound || "default",
          badge: notification.badge || 1,
          categoryIdentifier: notification.categoryIdentifier,
        },
        trigger: null,
      });

      console.log("📨 Notification envoyée:", title);
    } catch (error) {
      console.error("❌ Erreur lors de l'envoi de la notification:", error);
    }
  }

  /**
   * Planifie une notification - AVEC TRADUCTIONS
   */
  async scheduleNotification(
    notification: ScheduledNotification,
  ): Promise<string> {
    try {
      const { title, body } = this.translateNotification(
        notification.title,
        notification.body,
        notification.data,
      );

      let trigger: any = null;

      if (notification.trigger) {
        if (notification.trigger.seconds) {
          trigger = {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: notification.trigger.seconds,
            repeats: notification.trigger.repeats || false,
          };
        } else if (notification.trigger.date) {
          trigger = {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            date: notification.trigger.date,
          };
        } else if (notification.trigger.hour !== undefined) {
          trigger = {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: notification.trigger.hour,
            minute: notification.trigger.minute || 0,
          };
        }
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: notification.data || {},
          sound: notification.sound || "default",
          badge: notification.badge || 1,
          categoryIdentifier: notification.categoryIdentifier,
        },
        trigger: trigger,
      });

      console.log("📅 Notification planifiée:", identifier);
      return identifier;
    } catch (error) {
      console.error(
        "❌ Erreur lors de la planification de la notification:",
        error,
      );
      return "";
    }
  }

  /**
   * Annule une notification planifiée
   */
  async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      console.log("❌ Notification annulée:", identifier);
    } catch (error) {
      console.error(
        "❌ Erreur lors de l'annulation de la notification:",
        error,
      );
    }
  }

  /**
   * Annule toutes les notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log("🗑️ Toutes les notifications ont été annulées");
    } catch (error) {
      console.error("❌ Erreur lors de l'annulation des notifications:", error);
    }
  }

  /**
   * Nettoie les listeners
   */
  cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
    this.isInitialized = false;
  }
}

// Export singleton
export const notificationService = NativeNotificationService.getInstance();
