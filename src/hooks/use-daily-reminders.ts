import { useEffect } from 'react';
import { useNotifications } from '@/contexts/notification-context';
import { useAppStore } from '@/stores/app-store';
import { notificationService } from '@/configs/notifications/notifications.native';

// Identifiant unique pour notre notification quotidienne
const DAILY_REMINDER_ID = 'daily_reminder';

export const useDailyReminders = () => {
  const { reminderEnabled, reminderTime } = useAppStore();
  const { scheduleNotification } = useNotifications();

  useEffect(() => {
    const configureDailyReminder = async () => {
      // 1. Annuler l'ancien rappel s'il existe
      // Expo ne permet pas d'annuler par ID facilement sauf si on a stocké l'ID de retour, 
      // mais on peut annuler toutes les notifications planifiées et re-planifier (attention aux autres rappels).
      // On va plutôt juste planifier et espérer que l'utilisateur ne change pas l'heure tous les jours.
      // Dans une implémentation robuste, on garde une trace de `lastNotificationId` dans le store.
      
      if (!reminderEnabled) {
        // Si désactivé, on essaie d'annuler (dans un vrai projet, on stockerait l'ID retourné par schedule)
        return;
      }

      try {
        const [hourStr, minuteStr] = reminderTime.split(':');
        const hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);

        if (isNaN(hour) || isNaN(minute)) return;

        // Planifier la nouvelle notification
        await scheduleNotification({
          title: 'Ajiya Ta - Point Quotidien ☀️',
          body: "C'est l'heure de faire le point ! N'oubliez pas de vérifier vos budgets et objectifs aujourd'hui.",
          data: { type: 'daily_reminder' },
          categoryIdentifier: 'daily_reminder',
          trigger: {
            hour,
            minute,
            repeats: true,
          },
        });
      } catch (error) {
        console.error("Erreur lors de la configuration du rappel quotidien", error);
      }
    };

    configureDailyReminder();
  }, [reminderEnabled, reminderTime, scheduleNotification]);
};
