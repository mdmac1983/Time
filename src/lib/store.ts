import { useCallback, useEffect, useRef, useState } from 'react';

const PREFIX = 'timehub:';

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable */
  }
}

/** useState that persists to localStorage under the given key. */
export function usePersistent<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => load(key, fallback));
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    save(key, value);
  }, [key, value]);
  return [value, setValue] as const;
}

export const STORE_KEYS = [
  'settings',
  'worldClocks',
  'alarms',
  'stopwatches',
  'timers',
  'todos',
  'journal',
  'dates',
  'events',
] as const;

export function exportAll(): string {
  const data: Record<string, unknown> = { app: 'time-hub', exportedAt: new Date().toISOString() };
  for (const k of STORE_KEYS) data[k] = load(k, null);
  return JSON.stringify(data, null, 2);
}

export function importAll(json: string) {
  const data = JSON.parse(json);
  if (data?.app !== 'time-hub') throw new Error('Not a Time Hub backup file');
  for (const k of STORE_KEYS) if (data[k] != null) save(k, data[k]);
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

/** Re-render on an interval; returns current epoch ms. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

/** requestAnimationFrame-driven clock for smooth stopwatch display. */
export function useFrameNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  const tick = useCallback(() => setNow(Date.now()), []);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const loop = () => {
      tick();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active, tick]);
  return now;
}
