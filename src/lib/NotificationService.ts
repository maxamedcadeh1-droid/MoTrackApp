/**
 * NotificationService - Handles browser notifications and vibration
 * Provides a unified API for desktop and mobile notifications
 */

export interface ReminderNotification {
  itemId?: string;
  habitId?: string;
  type?: 'habit' | 'task' | 'sleep';
  experience?: 'standard' | 'wake' | 'shutdown';
  title?: string;
  habitTitle?: string;
  habitColor?: string;
  color?: string;
  message?: string;
}

export type NotificationPermission = 'granted' | 'denied' | 'default';

export class NotificationService {
  private static permission: NotificationPermission = 'default';

  /**
   * Check current notification permission status
   */
  static getPermission(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission as NotificationPermission;
  }

  /**
   * Request notification permission from user
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported in this browser');
      return 'denied';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission as NotificationPermission;
      return permission as NotificationPermission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Check if notifications are supported
   */
  static isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Send a reminder notification
   */
  static async sendReminder(notification: ReminderNotification): Promise<boolean> {
    // Always show in-app notification
    this.dispatchInAppEvent(notification);

    // Try browser notification if permitted
    if (this.getPermission() === 'granted') {
      return this.sendBrowserNotification(notification);
    }

    return false;
  }

  /**
   * Send a browser notification
   */
  private static sendBrowserNotification(notification: ReminderNotification): boolean {
    try {
      const reminderTitle = notification.title || notification.habitTitle || 'your ritual';
      const title = notification.message || `Time for: ${reminderTitle}`;
      
      const options: NotificationOptions = {
        body: notification.type === 'sleep'
          ? 'Tap to begin your shutdown ritual.'
          : `Tap to open MoTrack: ${reminderTitle}`,
        icon: '/motrack-icon.svg',
        badge: '/motrack-icon.svg',
        tag: `${notification.type || 'reminder'}-${notification.itemId || notification.habitId || 'ritual'}-${new Date().toDateString()}`,
        requireInteraction: false,
        silent: true, // We handle sound separately
      };

      if (notification.habitColor || notification.color) {
        // Some browsers support color
        (options as any).color = notification.habitColor || notification.color;
      }

      const browserNotification = new Notification(title, options);

      // Auto close after 10 seconds
      setTimeout(() => browserNotification.close(), 10000);

      // Handle click
      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
        // Could navigate to the habit page
      };

      return true;
    } catch (error) {
      console.error('Error sending browser notification:', error);
      return false;
    }
  }

  /**
   * Dispatch in-app notification event
   */
  private static dispatchInAppEvent(notification: ReminderNotification): void {
    const event = new CustomEvent('motrack:reminder', {
      detail: notification,
    });
    window.dispatchEvent(event);
  }

  /**
   * Vibrate device (mobile only)
   */
  static vibrate(pattern: number | number[] = [100, 50, 100]): void {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.warn('Vibration not supported or failed:', error);
      }
    }
  }

  /**
   * Check if vibration is supported
   */
  static isVibrationSupported(): boolean {
    return 'vibrate' in navigator;
  }

  /**
   * Send a complete reminder with all features
   */
  static async sendCompleteReminder(
    notification: ReminderNotification,
    vibrate: boolean = true
  ): Promise<{ browser: boolean; inApp: boolean; vibration: boolean }> {
    const browserNotificationSent = await this.sendReminder(notification);
    
    let vibrationSent = false;
    if (vibrate && this.isVibrationSupported()) {
      this.vibrate([100, 50, 100, 50, 100]);
      vibrationSent = true;
    }

    return {
      browser: browserNotificationSent,
      inApp: true,
      vibration: vibrationSent,
    };
  }

  /**
   * Clean up - remove old notifications
   */
  static async clearAllNotifications(): Promise<void> {
    // Note: getNotifications is not widely supported, so we skip this
    // Most browsers handle notification lifecycle automatically
  }
}
