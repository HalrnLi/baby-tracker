import { useState, useEffect, useCallback, useRef } from 'react';
import { remindersApi, Reminder } from '../api';

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('Notification permission denied');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

interface ReminderTimer {
  reminderId: string;
  timeoutId: ReturnType<typeof setTimeout>;
  type: 'pump' | 'diaper';
}

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const timersRef = useRef<ReminderTimer[]>([]);

  const loadReminders = useCallback(async () => {
    try {
      const res = await remindersApi.getAll();
      setReminders(res.data.reminders || []);
    } catch (err) {
      console.error('Failed to load reminders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  // Calculate next trigger time for a reminder
  const getNextTriggerTime = useCallback((reminder: Reminder): Date => {
    const lastTriggered = reminder.lastTriggered
      ? new Date(reminder.lastTriggered)
      : new Date();
    return new Date(lastTriggered.getTime() + reminder.intervalMinutes * 60 * 1000);
  }, []);

  // Show notification for a reminder
  const showNotification = useCallback((reminder: Reminder) => {
    if (Notification.permission !== 'granted') {
      return;
    }

    const title = reminder.type === 'pump' ? '🧴 吸奶提醒' : '🩲 换尿布提醒';
    const body = reminder.type === 'pump'
      ? '该吸奶了，别忘了记录！'
      : '该换尿布了，别忘了记录！';

    try {
      const notification = new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: `reminder-${reminder.id}`,
        requireInteraction: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (err) {
      console.error('Failed to show notification:', err);
    }
  }, []);

  // Trigger a reminder (called when timer fires)
  const triggerReminder = useCallback(async (reminder: Reminder) => {
    // Show notification
    showNotification(reminder);

    // Update lastTriggered on server
    try {
      await remindersApi.trigger(reminder.id);
    } catch (err) {
      console.error('Failed to update lastTriggered:', err);
    }

    // Reload reminders to get updated lastTriggered
    await loadReminders();
  }, [showNotification, loadReminders]);

  // Set up timers for all enabled reminders
  useEffect(() => {
    // Clear existing timers
    timersRef.current.forEach((timer) => {
      clearTimeout(timer.timeoutId);
    });
    timersRef.current = [];

    const enabledReminders = reminders.filter((r) => r.enabled);

    enabledReminders.forEach((reminder) => {
      const nextTrigger = getNextTriggerTime(reminder);
      const now = new Date();
      const delay = nextTrigger.getTime() - now.getTime();

      if (delay <= 0) {
        // Should have already triggered, trigger now
        triggerReminder(reminder);
        // Reschedule for next interval
        const newDelay = reminder.intervalMinutes * 60 * 1000;
        const timeoutId = setTimeout(() => {
          triggerReminder(reminder);
        }, newDelay);
        timersRef.current.push({ reminderId: reminder.id, timeoutId, type: reminder.type });
      } else {
        // Schedule for future
        const timeoutId = setTimeout(() => {
          triggerReminder(reminder);
        }, delay);
        timersRef.current.push({ reminderId: reminder.id, timeoutId, type: reminder.type });
      }
    });

    return () => {
      timersRef.current.forEach((timer) => {
        clearTimeout(timer.timeoutId);
      });
    };
  }, [reminders, getNextTriggerTime, triggerReminder]);

  return {
    reminders,
    loading,
    loadReminders,
  };
}
