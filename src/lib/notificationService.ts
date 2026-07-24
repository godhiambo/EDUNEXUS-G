import { SavedDocument, AppNotification } from '../types';

const NOTIFIED_KEY = 'pedagogical_notified_triggers';
const NOTIFICATIONS_STORAGE_KEY = 'pedagogical_app_notifications';

// Helper to get already-notified triggers from localStorage
export const getNotifiedTriggers = (): Record<string, boolean> => {
  try {
    const data = localStorage.getItem(NOTIFIED_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
};

// Helper to save notified triggers to localStorage
export const saveNotifiedTrigger = (docId: string, type: '1day' | '30min' | '5min') => {
  try {
    const triggers = getNotifiedTriggers();
    triggers[`${docId}_${type}`] = true;
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(triggers));
  } catch (e) {
    console.error('Error saving notified trigger:', e);
  }
};

// Clear notification tracking for a document (useful if scheduled date/time changes)
export const clearNotifiedTriggersForDoc = (docId: string) => {
  try {
    const triggers = getNotifiedTriggers();
    delete triggers[`${docId}_1day`];
    delete triggers[`${docId}_30min`];
    delete triggers[`${docId}_5min`];
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(triggers));
  } catch (e) {
    console.error('Error clearing notified triggers:', e);
  }
};

// Get in-app notifications from localStorage
export const getStoredNotifications = (): AppNotification[] => {
  try {
    const data = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

// Save in-app notifications to localStorage
export const saveStoredNotifications = (notifications: AppNotification[]) => {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  } catch (e) {
    console.error('Error saving notifications:', e);
  }
};

// Display standard browser notification if permission is granted
export const showBrowserNotification = (title: string, body: string, onClick?: () => void) => {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    const n = new Notification(title, {
      body,
      icon: '/favicon.ico', // standard fallback
    });
    if (onClick) {
      n.onclick = (e) => {
        window.focus();
        onClick();
      };
    }
  }
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

// Scan documents for upcoming scheduled lessons and trigger notifications
export const checkUpcomingLessons = (
  documents: SavedDocument[],
  onNewNotification: (notif: AppNotification) => void,
  onNavigateToDoc?: (doc: SavedDocument) => void
): AppNotification[] => {
  const notified = getNotifiedTriggers();
  const currentNotifications = getStoredNotifications();
  const now = new Date();
  let updatedNotifications = [...currentNotifications];
  let changed = false;

  documents.forEach((doc) => {
    // Only check scheduled documents
    if (!doc.scheduledDate || !doc.scheduledTime) return;

    try {
      // Parse scheduled date and time
      // scheduledDate format: YYYY-MM-DD, scheduledTime format: HH:MM
      const [year, month, day] = doc.scheduledDate.split('-').map(Number);
      const [hours, minutes] = doc.scheduledTime.split(':').map(Number);
      
      const scheduledDateTime = new Date(year, month - 1, day, hours, minutes);
      const timeDiffMs = scheduledDateTime.getTime() - now.getTime();
      const timeDiffMins = timeDiffMs / (1000 * 60);

      // Skip past lessons (more than 1 minute ago)
      if (timeDiffMins < -1) return;

      const docId = doc.id;
      const docTitle = doc.title || 'Untitled Curriculum Material';
      const docTopic = doc.topic || 'General Topic';
      const formatTime = scheduledDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // BRACKET 1: 1 Day Before (Remaining time between 30 minutes and 24 hours)
      if (timeDiffMins <= 1440 && timeDiffMins > 30) {
        if (!notified[`${docId}_1day`]) {
          // Trigger "1day" notification
          const newNotif: AppNotification = {
            id: `notif_${docId}_1day_${Date.now()}`,
            docId,
            docTitle,
            docTopic,
            scheduledDateTime: scheduledDateTime.toISOString(),
            type: '1day',
            timestamp: Date.now(),
            read: false,
            message: `Lesson scheduled tomorrow: "${docTopic}" (${doc.classLevel}) is scheduled for tomorrow at ${formatTime}.`,
          };

          updatedNotifications.unshift(newNotif);
          saveNotifiedTrigger(docId, '1day');
          onNewNotification(newNotif);
          changed = true;

          showBrowserNotification(
            `Lesson Scheduled Tomorrow`,
            `"${docTopic}" is tomorrow at ${formatTime}. Click to view details.`,
            () => onNavigateToDoc?.(doc)
          );
        }
      }

      // BRACKET 2: 30 Minutes Before (Remaining time between 5 minutes and 30 minutes)
      if (timeDiffMins <= 30 && timeDiffMins > 5) {
        // Also ensure 1day trigger is marked as done to prevent old triggers
        if (!notified[`${docId}_1day`]) {
          saveNotifiedTrigger(docId, '1day');
        }

        if (!notified[`${docId}_30min`]) {
          // Trigger "30min" notification
          const newNotif: AppNotification = {
            id: `notif_${docId}_30min_${Date.now()}`,
            docId,
            docTitle,
            docTopic,
            scheduledDateTime: scheduledDateTime.toISOString(),
            type: '30min',
            timestamp: Date.now(),
            read: false,
            message: `Lesson in 30 minutes: "${docTopic}" starts at ${formatTime} today!`,
          };

          updatedNotifications.unshift(newNotif);
          saveNotifiedTrigger(docId, '30min');
          onNewNotification(newNotif);
          changed = true;

          showBrowserNotification(
            `Lesson in 30 Minutes`,
            `"${docTopic}" starts at ${formatTime}. Open study resources now.`,
            () => onNavigateToDoc?.(doc)
          );
        }
      }

      // BRACKET 3: 5 Minutes Before (Remaining time between 0 minutes and 5 minutes)
      if (timeDiffMins <= 5 && timeDiffMins >= 0) {
        // Mark previous brackets as done
        if (!notified[`${docId}_1day`]) saveNotifiedTrigger(docId, '1day');
        if (!notified[`${docId}_30min`]) saveNotifiedTrigger(docId, '30min');

        if (!notified[`${docId}_5min`]) {
          // Trigger "5min" notification
          const newNotif: AppNotification = {
            id: `notif_${docId}_5min_${Date.now()}`,
            docId,
            docTitle,
            docTopic,
            scheduledDateTime: scheduledDateTime.toISOString(),
            type: '5min',
            timestamp: Date.now(),
            read: false,
            message: `Lesson in 5 minutes: "${docTopic}" starts at ${formatTime}. Prepare your student handouts!`,
          };

          updatedNotifications.unshift(newNotif);
          saveNotifiedTrigger(docId, '5min');
          onNewNotification(newNotif);
          changed = true;

          showBrowserNotification(
            `Lesson in 5 Minutes!`,
            `"${docTopic}" is starting very soon. Ready to teach?`,
            () => onNavigateToDoc?.(doc)
          );
        }
      }
    } catch (err) {
      console.error('Error parsing scheduled date/time for doc', doc.id, err);
    }
  });

  if (changed) {
    saveStoredNotifications(updatedNotifications);
  }

  return updatedNotifications;
};
