export type Id = string;

export interface WorldClock {
  id: Id;
  zone: string;
  label: string;
}

export interface Alarm {
  id: Id;
  time: string; // "HH:MM" 24h
  label: string;
  days: number[]; // 0=Sun..6=Sat; empty = one-time
  enabled: boolean;
  sound: SoundId;
  snoozeMin: number;
  snoozeUntil: number | null; // epoch ms
  lastFired: string | null; // "YYYY-MM-DD HH:MM" guard so an alarm fires once per minute slot
}

export interface Stopwatch {
  id: Id;
  label: string;
  startedAt: number | null; // epoch ms when running, null when paused
  elapsed: number; // ms accumulated before startedAt
  laps: number[]; // cumulative ms at each lap
}

export interface Timer {
  id: Id;
  label: string;
  duration: number; // ms
  endAt: number | null; // epoch ms when running
  remaining: number; // ms left when paused
  sound: SoundId;
  done: boolean;
}

export type Priority = 'low' | 'normal' | 'high';

export interface Todo {
  id: Id;
  title: string;
  notes: string;
  due: string | null; // YYYY-MM-DD
  priority: Priority;
  done: boolean;
  list: string;
  createdAt: number;
}

export type Mood = 'great' | 'good' | 'okay' | 'meh' | 'rough';

export interface JournalEntry {
  id: Id;
  date: string; // YYYY-MM-DD
  title: string;
  body: string;
  mood: Mood;
  updatedAt: number;
}

export type SaveDateKind = 'birthday' | 'anniversary' | 'memorial' | 'event' | 'other';

export interface SaveDate {
  id: Id;
  kind: SaveDateKind;
  name: string;
  month: number; // 1-12
  day: number; // 1-31
  year: number | null; // origin year, used for "turns 30" / "10th anniversary"
  recurring: boolean; // yearly
  remindDays: number; // remind N days before (0 = on the day)
  notes: string;
}

export interface CalEvent {
  id: Id;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // "HH:MM" or ""
  notes: string;
}

export type SoundId = 'chime' | 'digital' | 'bell' | 'pulse' | 'marimba' | 'rise';

export type ThemeId =
  | 'aurora'
  | 'daylight'
  | 'sunset'
  | 'forest'
  | 'ocean'
  | 'synthwave'
  | 'paper'
  | 'rose'
  | 'mono';

export type RegionId = 'US' | 'CA' | 'UK' | 'AU';
export type HolidayCategory = 'national' | 'observance' | 'christian' | 'jewish' | 'islamic' | 'cultural' | 'international';

export interface Settings {
  theme: ThemeId;
  use24h: boolean;
  showSeconds: boolean;
  weekStart: 0 | 1;
  regions: RegionId[];
  holidayCats: HolidayCategory[];
  clockFace: 'analog' | 'digital' | 'both';
  defaultSound: SoundId;
}
