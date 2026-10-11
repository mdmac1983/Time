export const pad = (n: number, w = 2) => String(Math.floor(n)).padStart(w, '0');

export function ymd(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseYmd(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function daysBetween(a: Date, b: Date) {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);
}

/** Format milliseconds as H:MM:SS(.cc). */
export function formatDuration(ms: number, centis = false) {
  const neg = ms < 0;
  ms = Math.abs(ms);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  let out = h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  if (centis) out += `.${pad(cs)}`;
  return (neg ? '-' : '') + out;
}

export function formatClock(d: Date, use24h: boolean, seconds: boolean, timeZone?: string) {
  return d.toLocaleTimeString(undefined, {
    hour: use24h ? '2-digit' : 'numeric',
    minute: '2-digit',
    second: seconds ? '2-digit' : undefined,
    hour12: !use24h,
    timeZone,
  });
}

export function formatHHMM(hhmm: string, use24h: boolean) {
  const [h, m] = hhmm.split(':').map(Number);
  if (use24h) return `${pad(h)}:${pad(m)}`;
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${pad(m)} ${ampm}`;
}

export const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAYS_MIN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Wall-clock parts of `date` in a time zone. */
export function zoneParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') };
}

/** Offset of a zone from local time, in minutes. */
export function zoneOffsetFromLocal(date: Date, timeZone: string) {
  const p = zoneParts(date, timeZone);
  const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const zoneOffset = (asUTC - Math.floor(date.getTime() / 1000) * 1000) / 60000; // zone minus UTC
  const localOffset = -date.getTimezoneOffset();
  return Math.round(zoneOffset - localOffset);
}

export function describeOffset(mins: number) {
  if (mins === 0) return 'Same time';
  const sign = mins > 0 ? '+' : '−';
  const a = Math.abs(mins);
  const h = Math.floor(a / 60);
  const m = a % 60;
  return `${sign}${h}h${m ? ` ${m}m` : ''} ${mins > 0 ? 'ahead' : 'behind'}`;
}

/** Next Date at which an alarm "HH:MM" on allowed weekdays occurs, after `from`. */
export function nextAlarmDate(hhmm: string, days: number[], from = new Date()) {
  const [h, m] = hhmm.split(':').map(Number);
  for (let i = 0; i < 8; i++) {
    const d = addDays(startOfDay(from), i);
    d.setHours(h, m, 0, 0);
    if (d.getTime() <= from.getTime()) continue;
    if (days.length === 0 || days.includes(d.getDay())) return d;
  }
  return null;
}

export function describeIn(ms: number) {
  const mins = Math.round(ms / 60000);
  if (mins < 1) return 'in less than a minute';
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  const bits = [];
  if (d) bits.push(`${d}d`);
  if (h) bits.push(`${h}h`);
  if (m && !d) bits.push(`${m}m`);
  return `in ${bits.join(' ')}`;
}

export function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
