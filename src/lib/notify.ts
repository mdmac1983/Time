import { Capacitor } from '@capacitor/core';
import { LocalNotifications, type LocalNotificationSchema } from '@capacitor/local-notifications';
import type { Alarm, SaveDate, Timer } from '../types';
import { addDays, nextAlarmDate, startOfDay } from './time';

export const isNative = () => Capacitor.isNativePlatform();

/** Stable 31-bit numeric id from a string (notification ids must be ints). */
function nid(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return Math.abs(h) % 2000000000;
}

let channelsReady = false;
async function ensureChannels() {
  if (channelsReady || Capacitor.getPlatform() !== 'android') return;
  channelsReady = true;
  await LocalNotifications.createChannel({
    id: 'alarms',
    name: 'Alarms & timers',
    description: 'Alarm clock and countdown timer alerts',
    importance: 5,
    visibility: 1,
    vibration: true,
  });
  await LocalNotifications.createChannel({
    id: 'reminders',
    name: 'Reminders',
    description: 'Birthdays, anniversaries, to-dos and events',
    importance: 4,
    visibility: 1,
  });
}

export async function requestNotifyPermission(): Promise<boolean> {
  try {
    if (isNative()) {
      const r = await LocalNotifications.requestPermissions();
      if (Capacitor.getPlatform() === 'android') {
        const exact = await LocalNotifications.checkExactNotificationSetting().catch(() => null);
        if (exact && exact.exact_alarm !== 'granted') await LocalNotifications.changeExactNotificationSetting().catch(() => {});
      }
      return r.display === 'granted';
    }
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    return (await Notification.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}

/** Immediate notification (used on web when an alarm/timer fires while the tab is hidden). */
export function notifyNow(title: string, body: string) {
  try {
    if (isNative()) return;
    if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body, icon: './icons/icon-192.png' });
  } catch {
    /* ignore */
  }
}

let lastSignature = '';

/**
 * Mirror app state into OS-scheduled notifications so alarms, timers and
 * reminders fire even when the app is closed (Android build only).
 */
export async function syncNativeSchedule(alarms: Alarm[], timers: Timer[], dates: SaveDate[]) {
  if (!isNative()) return;
  const sig = JSON.stringify([alarms, timers.map((t) => [t.id, t.endAt, t.label]), dates]);
  if (sig === lastSignature) return;
  lastSignature = sig;
  try {
    await ensureChannels();
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });

    const list: LocalNotificationSchema[] = [];
    const now = new Date();
    for (const a of alarms) {
      if (!a.enabled) continue;
      const [hour, minute] = a.time.split(':').map(Number);
      const title = a.label || 'Alarm';
      const body = `It's ${a.time}`;
      if (a.snoozeUntil && a.snoozeUntil > Date.now()) {
        list.push({ id: nid(a.id + 'snooze'), title: `${title} (snoozed)`, body, channelId: 'alarms', schedule: { at: new Date(a.snoozeUntil), allowWhileIdle: true }, extra: { kind: 'alarm', id: a.id } });
      }
      if (a.days.length === 0) {
        const at = nextAlarmDate(a.time, [], now);
        if (at) list.push({ id: nid(a.id), title, body, channelId: 'alarms', schedule: { at, allowWhileIdle: true }, extra: { kind: 'alarm', id: a.id } });
      } else {
        for (const d of a.days) {
          // Capacitor weekday: 1 = Sunday … 7 = Saturday
          list.push({ id: nid(a.id + d), title, body, channelId: 'alarms', schedule: { on: { weekday: d + 1, hour, minute }, allowWhileIdle: true }, extra: { kind: 'alarm', id: a.id } });
        }
      }
    }
    for (const t of timers) {
      if (t.endAt && t.endAt > Date.now()) {
        list.push({ id: nid('timer' + t.id), title: `⏳ ${t.label || 'Timer'} is done`, body: "Time's up!", channelId: 'alarms', schedule: { at: new Date(t.endAt), allowWhileIdle: true }, extra: { kind: 'timer', id: t.id } });
      }
    }
    const today = startOfDay(now);
    for (const sd of dates) {
      // Schedule this year's and next year's occurrence reminder at 9am.
      for (const yr of [today.getFullYear(), today.getFullYear() + 1]) {
        if (!sd.recurring && sd.year !== yr) continue;
        const occ = new Date(yr, sd.month - 1, sd.day);
        const at = addDays(occ, -sd.remindDays);
        at.setHours(9, 0, 0, 0);
        if (at <= now) continue;
        const when = sd.remindDays === 0 ? 'today' : sd.remindDays === 1 ? 'tomorrow' : `in ${sd.remindDays} days`;
        list.push({ id: nid(sd.id + yr), title: `🎉 ${sd.name}`, body: `${sd.kind[0].toUpperCase() + sd.kind.slice(1)} ${when}`, channelId: 'reminders', schedule: { at, allowWhileIdle: true }, extra: { kind: 'date', id: sd.id } });
      }
    }
    if (list.length) await LocalNotifications.schedule({ notifications: list.slice(0, 400) });
  } catch (e) {
    console.warn('Notification scheduling failed', e);
  }
}
