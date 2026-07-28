// src/hooks/use-daily-reminders.ts

import { useEffect, useRef } from 'react';
import { useNotifications } from '@/contexts/notification-context';
import { useAppStore } from '@/stores/app-store';

const DAILY_REMINDER_ID = 'daily_reminder';

export const useDailyReminders = () => {
  const { reminderEnabled, reminderTime } = useAppStore();
  const { scheduleNotification, cancelNotification, isExpoGo } = useNotifications();
  const scheduledIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Ne pas planifier dans Expo Go
    if (isExpoGo) {
      console.log('⚠️ Rappels quotidiens désactivés dans Expo Go');
      return;
    }

    const configureDailyReminder = async () => {
      // Annuler l'ancien rappel s'il existe
      if (scheduledIdRef.current) {
        await cancelNotification(scheduledIdRef.current);
        scheduledIdRef.current = null;
      }

      // Si désactivé, on arrête là
      if (!reminderEnabled) {
        console.log('🔕 Rappels quotidiens désactivés');
        return;
      }

      try {
        const [hourStr, minuteStr] = reminderTime.split(':');
        const hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);

        if (isNaN(hour) || isNaN(minute)) {
          console.error('Heure de rappel invalide:', reminderTime);
          return;
        }

        // Planifier la nouvelle notification avec catégorie
        const id = await scheduleNotification({
          title: '💰 Ajiya Ta - Point Quotidien',
          body: "C'est l'heure de faire le point ! Vérifiez vos budgets, objectifs et transactions du jour.",
          data: { 
            type: 'daily_reminder',
            route: '/(tabs)/dashboard',
          },
          categoryIdentifier: 'daily_reminder',
          trigger: {
            hour,
            minute,
            repeats: true,
          },
        });

        if (id) {
          scheduledIdRef.current = id;
          console.log(`✅ Rappel quotidien planifié à ${reminderTime} (ID: ${id})`);
        }
      } catch (error) {
        console.error("❌ Erreur lors de la configuration du rappel quotidien:", error);
      }
    };

    configureDailyReminder();

    // Nettoyer à la destruction
    return () => {
      if (scheduledIdRef.current) {
        cancelNotification(scheduledIdRef.current);
      }
    };
  }, [reminderEnabled, reminderTime, scheduleNotification, cancelNotification, isExpoGo]);
};