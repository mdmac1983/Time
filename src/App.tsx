import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { App as CapApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Toast } from './components/ui';
import { AppMark, IcAlarm, IcCalendar, IcClock, IcDates, IcGear, IcJournal, IcSnooze, IcStopwatch, IcTimer, IcTodo } from './icons';
import { isNative, notifyNow, syncNativeSchedule } from './lib/notify';
import { playSound, primeAudio, vibrate } from './lib/sound';
import { usePersistent } from './lib/store';
import { formatClock, formatHHMM, pad, ymd } from './lib/time';
import { Ctx, DEFAULT_SETTINGS, type AppState, type Intent, type TabId } from './state';
import { applyTheme } from './themes';
import type { Alarm, CalEvent, JournalEntry, SaveDate, Settings, SoundId, Stopwatch, Timer, Todo, WorldClock } from './types';
import AlarmsView from './views/AlarmsView';
import CalendarView from './views/CalendarView';
import ClockView from './views/ClockView';
import DatesView from './views/DatesView';
import JournalView from './views/JournalView';
import SettingsView from './views/SettingsView';
import StopwatchView from './views/StopwatchView';
import TimersView from './views/TimersView';
import TodoView from './views/TodoView';

const TABS: { id: TabId; label: string; title: string; Icon: ComponentType<{ size?: number }>; View: ComponentType }[] = [
  { id: 'clock', label: 'Clock', title: 'Clock', Icon: IcClock, View: ClockView },
  { id: 'alarms', label: 'Alarms', title: 'Alarms', Icon: IcAlarm, View: AlarmsView },
  { id: 'stopwatch', label: 'Stopwatch', title: 'Stopwatches', Icon: IcStopwatch, View: StopwatchView },
  { id: 'timers', label: 'Timers', title: 'Timers', Icon: IcTimer, View: TimersView },
  { id: 'calendar', label: 'Calendar', title: 'Calendar', Icon: IcCalendar, View: CalendarView },
  { id: 'todo', label: 'To-do', title: 'To-do', Icon: IcTodo, View: TodoView },
  { id: 'journal', label: 'Journal', title: 'Journal', Icon: IcJournal, View: JournalView },
  { id: 'dates', label: 'Dates', title: 'Save the Date', Icon: IcDates, View: DatesView },
];
const SETTINGS_TAB = { id: 'settings' as TabId, label: 'Settings', title: 'Settings & Themes', Icon: IcGear, View: SettingsView };

interface Ringing {
  kind: 'alarm' | 'timer';
  id: string;
  label: string;
  sound: SoundId;
}

export default function App() {
  const [settings, setSettings] = usePersistent<Settings>('settings', DEFAULT_SETTINGS);
  const [worldClocks, setWorldClocks] = usePersistent<WorldClock[]>('worldClocks', [
    { id: 'wc1', zone: 'Europe/London', label: 'London' },
    { id: 'wc2', zone: 'Asia/Tokyo', label: 'Tokyo' },
  ]);
  const [alarms, setAlarms] = usePersistent<Alarm[]>('alarms', []);
  const [stopwatches, setStopwatches] = usePersistent<Stopwatch[]>('stopwatches', [{ id: 'sw1', label: 'Stopwatch 1', startedAt: null, elapsed: 0, laps: [] }]);
  const [timers, setTimers] = usePersistent<Timer[]>('timers', []);
  const [todos, setTodos] = usePersistent<Todo[]>('todos', []);
  const [journal, setJournal] = usePersistent<JournalEntry[]>('journal', []);
  const [dates, setDates] = usePersistent<SaveDate[]>('dates', []);
  const [events, setEvents] = usePersistent<CalEvent[]>('events', []);
  const [tab, setTab] = usePersistent<TabId>('tab', 'clock');
  const [intent, setIntent] = useState<Intent | null>(null);
  const [ringing, setRinging] = useState<Ringing[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const stopSound = useRef<(() => void) | null>(null);
  const toastTimer = useRef<number>(0);

  const s = { ...DEFAULT_SETTINGS, ...settings };
  useEffect(() => applyTheme(s.theme), [s.theme]);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2600);
  }, []);

  const go = useCallback((t: TabId, i?: Intent) => {
    setTab(t);
    setIntent(i ?? null);
  }, [setTab]);

  // Unlock Web Audio on first interaction so alarms can play later.
  useEffect(() => {
    const unlock = () => primeAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  // ---- Alarm & timer engine (runs regardless of the visible tab) ----
  const live = useRef({ alarms, timers, use24h: s.use24h });
  live.current = { alarms, timers, use24h: s.use24h };
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const hhmm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const slot = `${ymd(now)} ${hhmm}`;
      const fired: Ringing[] = [];
      const alarmPatch = new Map<string, Partial<Alarm>>();
      for (const a of live.current.alarms) {
        if (!a.enabled) continue;
        if (a.snoozeUntil && now.getTime() >= a.snoozeUntil) {
          fired.push({ kind: 'alarm', id: a.id, label: a.label || 'Alarm', sound: a.sound });
          alarmPatch.set(a.id, { snoozeUntil: null });
        } else if (a.time === hhmm && a.lastFired !== slot && (a.days.length === 0 || a.days.includes(now.getDay()))) {
          fired.push({ kind: 'alarm', id: a.id, label: a.label || 'Alarm', sound: a.sound });
          // One-time alarms switch themselves off after ringing.
          alarmPatch.set(a.id, { lastFired: slot, enabled: a.days.length > 0 });
        }
      }
      const timerPatch = new Map<string, Partial<Timer>>();
      for (const t of live.current.timers) {
        if (t.endAt && now.getTime() >= t.endAt) {
          fired.push({ kind: 'timer', id: t.id, label: t.label || 'Timer', sound: t.sound });
          timerPatch.set(t.id, { endAt: null, remaining: 0, done: true });
        }
      }
      if (!fired.length) return;
      // Patch refs immediately so the next tick can't double-fire before React re-renders.
      const patchAll = <T extends { id: string }>(list: T[], m: Map<string, Partial<T>>) => list.map((x) => (m.has(x.id) ? { ...x, ...m.get(x.id) } : x));
      live.current.alarms = patchAll(live.current.alarms, alarmPatch);
      live.current.timers = patchAll(live.current.timers, timerPatch);
      if (alarmPatch.size) setAlarms((l) => patchAll(l, alarmPatch));
      if (timerPatch.size) setTimers((l) => patchAll(l, timerPatch));
      setRinging((r) => [...r, ...fired.filter((f) => !r.some((x) => x.id === f.id))]);
      if (document.hidden)
        for (const f of fired) notifyNow(f.kind === 'alarm' ? `⏰ ${f.label}` : `⏳ ${f.label} — time's up`, formatClock(now, live.current.use24h, false));
    };
    const t = setInterval(check, 1000);
    check();
    return () => clearInterval(t);
  }, [setAlarms, setTimers]);

  // Play / stop the ringtone for whatever is ringing.
  const topRing = ringing[0];
  useEffect(() => {
    stopSound.current?.();
    stopSound.current = null;
    if (!topRing) return;
    stopSound.current = playSound(topRing.sound, true);
    vibrate();
    const v = setInterval(() => vibrate(), 3000);
    return () => {
      clearInterval(v);
      stopSound.current?.();
      stopSound.current = null;
    };
  }, [topRing?.id, topRing?.sound]);

  // Mirror schedules to the OS on Android.
  useEffect(() => {
    void syncNativeSchedule(alarms, timers, dates);
  }, [alarms, timers, dates]);

  // Tapping a native notification opens the relevant tab.
  useEffect(() => {
    if (!isNative()) return;
    const h1 = LocalNotifications.addListener('localNotificationActionPerformed', (a) => {
      const kind = a.notification.extra?.kind;
      if (kind === 'alarm') setTab('alarms');
      else if (kind === 'timer') setTab('timers');
      else if (kind === 'date') setTab('dates');
    });
    const h2 = CapApp.addListener('backButton', () => {
      setTab((t) => {
        if (t === 'clock') void CapApp.minimizeApp();
        return 'clock';
      });
    });
    return () => {
      void h1.then((h) => h.remove());
      void h2.then((h) => h.remove());
    };
  }, [setTab]);

  const dismiss = (r: Ringing) => setRinging((l) => l.filter((x) => x.id !== r.id));
  const snooze = (r: Ringing) => {
    const a = alarms.find((x) => x.id === r.id);
    const mins = a?.snoozeMin ?? 9;
    setAlarms((l) => l.map((x) => (x.id === r.id ? { ...x, enabled: true, snoozeUntil: Date.now() + mins * 60000 } : x)));
    toast(`Snoozed for ${mins} minutes`);
    dismiss(r);
  };
  const addMinute = (r: Ringing) => {
    setTimers((l) => l.map((t) => (t.id === r.id ? { ...t, endAt: Date.now() + 60000, remaining: 60000, duration: 60000, done: false } : t)));
    dismiss(r);
  };

  const ctx: AppState = {
    settings: s, setSettings, worldClocks, setWorldClocks, alarms, setAlarms, stopwatches, setStopwatches,
    timers, setTimers, todos, setTodos, journal, setJournal, dates, setDates, events, setEvents,
    go, intent, clearIntent: () => setIntent(null), toast,
  };

  const current = TABS.find((t) => t.id === tab) ?? (tab === 'settings' ? SETTINGS_TAB : TABS[0]);
  const View = current.View;
  const now = new Date();
  const runningTimers = timers.filter((t) => t.endAt).length;
  const runningSw = stopwatches.filter((x) => x.startedAt).length;

  return (
    <Ctx.Provider value={ctx}>
      <div className="app">
        <nav className="rail" aria-label="Sections">
          <div className="brand"><AppMark size={44} /></div>
          {[...TABS, SETTINGS_TAB].map(({ id, label, Icon }) => (
            <button key={id} className={`navbtn ${tab === id ? 'active' : ''}`} onClick={() => go(id)} aria-current={tab === id ? 'page' : undefined}>
              <Icon size={28} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="main">
          <header className="topbar">
            <div className="grow">
              <h1>{current.title}</h1>
              <div className="sub">
                {now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                {(runningTimers > 0 || runningSw > 0) &&
                  ` · ${[runningTimers && `${runningTimers} timer${runningTimers > 1 ? 's' : ''}`, runningSw && `${runningSw} stopwatch${runningSw > 1 ? 'es' : ''}`].filter(Boolean).join(', ')} running`}
              </div>
            </div>
            <button className={`iconbtn ${tab === 'settings' ? 'active' : ''}`} onClick={() => go('settings')} aria-label="Settings and themes" style={{ color: tab === 'settings' ? 'var(--accent)' : undefined }}>
              <IcGear size={26} />
            </button>
          </header>
          <main className="content">
            <View key={current.id} />
          </main>
        </div>
        <nav className="bottomnav" aria-label="Sections">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} className={`navbtn ${tab === id ? 'active' : ''}`} onClick={() => go(id)} aria-current={tab === id ? 'page' : undefined}>
              <Icon size={26} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {topRing && (
        <div className="ringing" role="alertdialog" aria-label={topRing.label}>
          <div className="shake">{topRing.kind === 'alarm' ? <IcAlarm size={120} /> : <IcTimer size={120} />}</div>
          <div className="bigtime">{topRing.kind === 'alarm' ? formatHHMM(`${pad(now.getHours())}:${pad(now.getMinutes())}`, s.use24h) : "Time's up!"}</div>
          <div className="lbl">{topRing.label}</div>
          {ringing.length > 1 && <div className="small muted">+{ringing.length - 1} more</div>}
          <div className="actions">
            {topRing.kind === 'alarm' ? (
              <button className="btn" onClick={() => snooze(topRing)}><IcSnooze size={20} /> Snooze</button>
            ) : (
              <button className="btn" onClick={() => addMinute(topRing)}>+1 minute</button>
            )}
            <button className="btn primary" onClick={() => dismiss(topRing)}>Dismiss</button>
          </div>
        </div>
      )}
      {toastMsg && <Toast text={toastMsg} />}
    </Ctx.Provider>
  );
}
