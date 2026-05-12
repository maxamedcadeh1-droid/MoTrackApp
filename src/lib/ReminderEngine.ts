/**
 * ReminderEngine - app-open reminder scheduler.
 * It is intentionally data-source agnostic; persistence lives in the runtime.
 */

import { SoundService, SoundType } from './SoundService';
import { NotificationService, ReminderNotification } from './NotificationService';

export type ReminderSourceType = 'habit' | 'task' | 'sleep';
export type ReminderExperience = 'standard' | 'wake' | 'shutdown';

export interface ReminderConfig {
  id?: string;
  itemId?: string;
  habitId?: string;
  type?: ReminderSourceType;
  experience?: ReminderExperience;
  title?: string;
  habitTitle?: string;
  color?: string;
  habitColor?: string;
  category?: string;
  reminderEnabled: boolean;
  reminderTime: string;
  reminderDays: number[];
  reminderSound: SoundType;
  lastTriggeredAt?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ReminderTriggeredEvent {
  reminder: ReminderConfig;
  habitId?: string;
  habitTitle?: string;
  triggeredAt: string;
}

type ReminderCallback = (notification: ReminderNotification, reminder: ReminderConfig) => void;
type MarkTriggeredCallback = (reminder: ReminderConfig, triggeredAt: string) => Promise<void> | void;

type ReminderInitOptions = {
  onTrigger?: ReminderCallback;
  onMarkTriggered?: MarkTriggeredCallback;
};

export class ReminderEngine {
  private static reminders: ReminderConfig[] = [];
  private static checkInterval: number | null = null;
  private static onReminderTriggered: ReminderCallback | null = null;
  private static onMarkTriggered: MarkTriggeredCallback | null = null;
  private static isRunning = false;
  private static readonly CHECK_INTERVAL_MS = 30000;

  static init(options?: ReminderInitOptions | ReminderCallback): void {
    if (typeof options === 'function') {
      this.onReminderTriggered = options;
      return;
    }

    this.onReminderTriggered = options?.onTrigger || null;
    this.onMarkTriggered = options?.onMarkTriggered || null;
  }

  static setReminders(reminders: ReminderConfig[]): void {
    this.reminders = reminders
      .filter((reminder) => reminder.reminderEnabled && Boolean(reminder.reminderTime))
      .map((reminder) => ({
        ...reminder,
        id: this.getReminderId(reminder),
        itemId: reminder.itemId || reminder.habitId || reminder.id,
        title: reminder.title || reminder.habitTitle || 'Untitled ritual',
        habitTitle: reminder.habitTitle || reminder.title,
        color: reminder.color || reminder.habitColor,
        habitColor: reminder.habitColor || reminder.color,
        type: reminder.type || 'habit',
        experience: reminder.experience || this.inferExperience(reminder),
        reminderDays: reminder.reminderDays || [],
      }));
  }

  static addReminder(reminder: ReminderConfig): void {
    const id = this.getReminderId(reminder);
    this.reminders = this.reminders.filter((existing) => this.getReminderId(existing) !== id);
    if (reminder.reminderEnabled) {
      this.reminders.push({ ...reminder, id });
    }
  }

  static removeReminder(itemId: string): void {
    this.reminders = this.reminders.filter((reminder) => (reminder.itemId || reminder.habitId || reminder.id) !== itemId);
  }

  static markTriggered(itemId: string, triggeredAt = new Date().toISOString()): void {
    const reminder = this.reminders.find((item) => (item.itemId || item.habitId || item.id) === itemId || item.id === itemId);
    if (reminder) {
      reminder.lastTriggeredAt = triggeredAt;
      this.markLocalTriggered(reminder, triggeredAt);
    }
  }

  static start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.checkReminders();
    this.checkInterval = window.setInterval(() => this.checkReminders(), this.CHECK_INTERVAL_MS);
  }

  static stop(): void {
    if (this.checkInterval) {
      window.clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
  }

  static isEngineRunning(): boolean {
    return this.isRunning;
  }

  private static checkReminders(): void {
    const now = new Date();
    const currentDay = now.getDay();

    this.reminders.forEach((reminder) => {
      if (!this.isReminderDay(reminder, currentDay)) return;
      if (!this.isTimeDue(reminder.reminderTime, now)) return;
      if (this.hasTriggeredToday(reminder)) return;

      void this.triggerReminder(reminder);
    });
  }

  private static async triggerReminder(reminder: ReminderConfig): Promise<void> {
    const triggeredAt = new Date().toISOString();
    const itemId = reminder.itemId || reminder.habitId || reminder.id || reminder.title || 'ritual';
    const title = reminder.title || reminder.habitTitle || 'your ritual';

    this.markTriggered(itemId, triggeredAt);

    if (this.onMarkTriggered) {
      await this.onMarkTriggered(reminder, triggeredAt);
    }

    await SoundService.play(reminder.reminderSound || (reminder.experience === 'shutdown' ? 'night' : 'chime'));

    const notification: ReminderNotification = {
      itemId,
      habitId: reminder.habitId || itemId,
      type: reminder.type || 'habit',
      experience: reminder.experience || 'standard',
      title,
      habitTitle: title,
      color: reminder.color || reminder.habitColor,
      habitColor: reminder.habitColor || reminder.color,
      message: reminder.experience === 'shutdown' ? 'Begin your night shutdown' : `Time for: ${title}`,
    };

    await NotificationService.sendCompleteReminder(notification, true);
    this.onReminderTriggered?.(notification, reminder);

    window.dispatchEvent(new CustomEvent<ReminderTriggeredEvent>('motrack:reminder-triggered', {
      detail: {
        reminder,
        habitId: reminder.habitId || itemId,
        habitTitle: title,
        triggeredAt,
      },
    }));
  }

  private static isReminderDay(reminder: ReminderConfig, currentDay: number): boolean {
    if (!reminder.reminderDays || reminder.reminderDays.length === 0) return true;
    return reminder.reminderDays.includes(currentDay);
  }

  private static isTimeDue(reminderTime: string, now: Date): boolean {
    const [hours, minutes] = reminderTime.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return false;

    return now.getHours() === hours && now.getMinutes() === minutes;
  }

  private static hasTriggeredToday(reminder: ReminderConfig): boolean {
    const localKey = this.localTriggerKey(reminder, new Date());
    if (typeof window !== 'undefined' && window.localStorage.getItem(localKey)) return true;
    if (!reminder.lastTriggeredAt) return false;

    const lastTrigger = new Date(reminder.lastTriggeredAt);
    const today = new Date();

    return lastTrigger.getFullYear() === today.getFullYear()
      && lastTrigger.getMonth() === today.getMonth()
      && lastTrigger.getDate() === today.getDate();
  }

  private static markLocalTriggered(reminder: ReminderConfig, triggeredAt: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(this.localTriggerKey(reminder, new Date(triggeredAt)), triggeredAt);
  }

  private static localTriggerKey(reminder: ReminderConfig, date: Date): string {
    const id = this.getReminderId(reminder);
    const key = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
    return `motrack:reminder:${id}:${key}`;
  }

  private static getReminderId(reminder: ReminderConfig): string {
    return reminder.id || `${reminder.type || 'habit'}:${reminder.itemId || reminder.habitId || reminder.title || 'ritual'}`;
  }

  private static inferExperience(reminder: ReminderConfig): ReminderExperience {
    const title = `${reminder.title || reminder.habitTitle || ''} ${reminder.category || ''}`.toLowerCase();
    const hour = Number.parseInt(reminder.reminderTime?.split(':')[0] || '12', 10);

    if (reminder.type === 'sleep' || title.includes('sleep') || title.includes('shutdown') || title.includes('night')) {
      return 'shutdown';
    }

    if (reminder.reminderSound === 'sunrise' || title.includes('wake') || title.includes('morning') || (hour >= 4 && hour <= 9)) {
      return 'wake';
    }

    return 'standard';
  }

  static getActiveReminders(): ReminderConfig[] {
    return this.reminders;
  }

  static hasReminder(itemId: string): boolean {
    return this.reminders.some((reminder) => (reminder.itemId || reminder.habitId || reminder.id) === itemId);
  }

  static getReminder(itemId: string): ReminderConfig | undefined {
    return this.reminders.find((reminder) => (reminder.itemId || reminder.habitId || reminder.id) === itemId);
  }

  static cleanup(): void {
    this.stop();
    this.reminders = [];
    this.onReminderTriggered = null;
    this.onMarkTriggered = null;
  }
}
