import { createContext, useContext, type Dispatch, type SetStateAction } from 'react';
import type { Alarm, CalEvent, JournalEntry, SaveDate, Settings, Stopwatch, Timer, Todo, WorldClock } from './types';

type Setter<T> = Dispatch<SetStateAction<T>>;

export interface AppState {
  settings: Settings;
  setSettings: Setter<Settings>;
  worldClocks: WorldClock[];
  setWorldClocks: Setter<WorldClock[]>;
  alarms: Alarm[];
  setAlarms: Setter<Alarm[]>;
  stopwatches: Stopwatch[];
  setStopwatches: Setter<Stopwatch[]>;
  timers: Timer[];
  setTimers: Setter<Timer[]>;
  todos: Todo[];
  setTodos: Setter<Todo[]>;
  journal: JournalEntry[];
  setJournal: Setter<JournalEntry[]>;
  dates: SaveDate[];
  setDates: Setter<SaveDate[]>;
  events: CalEvent[];
  setEvents: Setter<CalEvent[]>;
  go: (tab: TabId, intent?: Intent) => void;
  intent: Intent | null;
  clearIntent: () => void;
  toast: (msg: string) => void;
}

export type TabId = 'clock' | 'alarms' | 'stopwatch' | 'timers' | 'calendar' | 'todo' | 'journal' | 'dates' | 'settings';

/** Cross-tab request, e.g. "open the journal editor for 2026-10-11". */
export type Intent =
  | { kind: 'newTodo'; due: string }
  | { kind: 'journal'; date: string }
  | { kind: 'newDate'; month: number; day: number }
  | { kind: 'calendarDay'; date: string };

export const Ctx = createContext<AppState>(null as unknown as AppState);
export const useApp = () => useContext(Ctx);

export const DEFAULT_SETTINGS: Settings = {
  theme: 'aurora',
  use24h: false,
  showSeconds: true,
  weekStart: 0,
  regions: ['US'],
  holidayCats: ['national', 'observance', 'christian', 'jewish', 'islamic', 'cultural', 'international'],
  clockFace: 'both',
  defaultSound: 'chime',
};
