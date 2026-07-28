// src/configs/notifications/handler.ts

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Configure le handler de notifications global
 * Défini comment les notifications sont affichées quand l'application est OUVERTE
 */
export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  console.log('✅ Notification handler configuré');
}

/**
 * Configure les catégories de notifications avec actions
 */
export async function setupNotificationCategories() {
  try {
    // Catégorie pour les rappels de budget
    await Notifications.setNotificationCategoryAsync('BUDGET_REMINDER', [
      {
        identifier: 'CREATE_BUDGET',
        buttonTitle: '➕ Créer un budget',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'VIEW_BUDGETS',
        buttonTitle: '📊 Voir les budgets',
        options: {
          opensAppToForeground: true,
        },
      },
    ]);

    // Catégorie pour les alertes de budget dépassé
    await Notifications.setNotificationCategoryAsync('BUDGET_ALERT', [
      {
        identifier: 'VIEW_TRANSACTIONS',
        buttonTitle: '📋 Voir les transactions',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'EDIT_BUDGET',
        buttonTitle: '✏️ Modifier le budget',
        options: {
          opensAppToForeground: true,
        },
      },
    ]);

    // Catégorie pour les rappels d'épargne
    await Notifications.setNotificationCategoryAsync('SAVINGS_REMINDER', [
      {
        identifier: 'ADD_SAVINGS',
        buttonTitle: '💰 Ajouter des fonds',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'VIEW_GOALS',
        buttonTitle: '🎯 Voir les objectifs',
        options: {
          opensAppToForeground: true,
        },
      },
    ]);

    console.log('✅ Catégories de notifications configurées');
  } catch (error) {
    console.error('❌ Erreur lors de la configuration des catégories:', error);
  }
}

/**
 * Configure tous les canaux Android
 */
export async function setupAndroidChannels() {
  if (Platform.OS !== 'android') return;

  try {
    // Canal par défaut
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#16a34a',
      sound: 'default',
      showBadge: true,
    });

    // Canal pour les rappels de budget
    await Notifications.setNotificationChannelAsync('budget_reminder', {
      name: 'Rappels de budget',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#f59e0b',
      sound: 'default',
      showBadge: true,
    });

    // Canal pour les alertes de budget dépassé
    await Notifications.setNotificationChannelAsync('budget_alert', {
      name: 'Alertes de budget',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#ef4444',
      sound: 'default',
      showBadge: true,
    });

    // Canal pour les rappels d'épargne
    await Notifications.setNotificationChannelAsync('savings_reminder', {
      name: 'Rappels d\'épargne',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3b82f6',
      sound: 'default',
      showBadge: true,
    });

    // Canal pour les rappels quotidiens
    await Notifications.setNotificationChannelAsync('daily_reminder', {
      name: 'Rappel quotidien',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8b5cf6',
      sound: 'default',
      showBadge: true,
    });

    console.log('✅ Canaux Android configurés');
  } catch (error) {
    console.error('❌ Erreur lors de la configuration des canaux:', error);
  }
}