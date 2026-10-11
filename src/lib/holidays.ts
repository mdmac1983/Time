import type { HolidayCategory, RegionId } from '../types';
import { moonsBetween, season } from './astro';
import { addDays, ymd } from './time';

export interface Holiday {
  name: string;
  cat: HolidayCategory;
  region?: RegionId;
  emoji: string;
  off?: boolean; // public day off
}

export const CATEGORY_LABELS: Record<HolidayCategory, string> = {
  national: 'Public holidays',
  observance: 'Observances & fun days',
  christian: 'Christian',
  jewish: 'Jewish',
  islamic: 'Islamic',
  cultural: 'Cultural & lunar',
  international: 'International & seasons',
};

export const REGION_LABELS: Record<RegionId, string> = {
  US: 'United States',
  CA: 'Canada',
  UK: 'United Kingdom',
  AU: 'Australia',
};

/** n-th weekday (0=Sun) of month (0-based). n = -1 for last. */
function nth(year: number, month: number, weekday: number, n: number) {
  if (n > 0) {
    const first = new Date(year, month, 1);
    const offset = (weekday - first.getDay() + 7) % 7;
    return new Date(year, month, 1 + offset + (n - 1) * 7);
  }
  const last = new Date(year, month + 1, 0);
  const offset = (last.getDay() - weekday + 7) % 7;
  return new Date(year, month, last.getDate() - offset);
}

const D = (y: number, m: number, d: number) => new Date(y, m - 1, d);

/** Western (Gregorian) Easter Sunday — anonymous Gregorian algorithm. */
export function easter(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** Orthodox Easter (Julian computus, converted to Gregorian; valid 1900–2099). */
export function orthodoxEaster(year: number) {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;
  return addDays(new Date(year, month - 1, day), 13);
}

/** Days of `year` whose date in a non-Gregorian calendar matches. */
function scanCalendar(year: number, calendar: string, monthStyle: 'long' | 'numeric') {
  const fmt = new Intl.DateTimeFormat(`en-u-ca-${calendar}`, { month: monthStyle, day: 'numeric' });
  const out: { date: Date; month: string; day: number }[] = [];
  for (let d = new Date(year, 0, 1); d.getFullYear() === year; d = addDays(d, 1)) {
    const parts = fmt.formatToParts(d);
    out.push({
      date: d,
      month: parts.find((p) => p.type === 'month')?.value ?? '',
      day: Number(parts.find((p) => p.type === 'day')?.value ?? 0),
    });
  }
  return out;
}

/** Calendar date (in a fixed UTC offset, hours) of an instant. */
function dateInOffset(instant: Date, offsetHours: number) {
  const t = new Date(instant.getTime() + offsetHours * 3600000);
  return new Date(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
}

type Adder = (date: Date, h: Holiday) => void;

function addUS(y: number, add: Adder) {
  const nat = (d: Date, name: string, emoji: string) => {
    add(d, { name, emoji, cat: 'national', region: 'US', off: true });
    // Federal "observed" day when the holiday falls on a weekend.
    if (d.getDay() === 6) add(addDays(d, -1), { name: `${name} (observed)`, emoji, cat: 'national', region: 'US', off: true });
    if (d.getDay() === 0) add(addDays(d, 1), { name: `${name} (observed)`, emoji, cat: 'national', region: 'US', off: true });
  };
  nat(D(y, 1, 1), "New Year's Day", '🎆');
  nat(nth(y, 0, 1, 3), 'Martin Luther King Jr. Day', '✊');
  nat(nth(y, 1, 1, 3), "Presidents' Day", '🎩');
  nat(nth(y, 4, 1, -1), 'Memorial Day', '🎖️');
  nat(D(y, 6, 19), 'Juneteenth', '✊🏾');
  nat(D(y, 7, 4), 'Independence Day', '🇺🇸');
  nat(nth(y, 8, 1, 1), 'Labor Day', '🛠️');
  nat(nth(y, 9, 1, 2), "Columbus / Indigenous Peoples' Day", '🧭');
  nat(D(y, 11, 11), 'Veterans Day', '🎖️');
  nat(nth(y, 10, 4, 4), 'Thanksgiving', '🦃');
  nat(D(y, 12, 25), 'Christmas Day', '🎄');

  const obs = (d: Date, name: string, emoji: string) => add(d, { name, emoji, cat: 'observance', region: 'US' });
  obs(D(y, 2, 2), 'Groundhog Day', '🦫');
  obs(D(y, 2, 14), "Valentine's Day", '💘');
  obs(D(y, 3, 17), "St. Patrick's Day", '☘️');
  obs(D(y, 4, 1), "April Fools' Day", '🃏');
  obs(D(y, 4, 15), 'Tax Day', '🧾');
  obs(nth(y, 3, 5, -1), 'Arbor Day', '🌳');
  obs(D(y, 5, 5), 'Cinco de Mayo', '🪅');
  obs(nth(y, 4, 0, 2), "Mother's Day", '💐');
  obs(nth(y, 4, 6, 3), 'Armed Forces Day', '🪖');
  obs(D(y, 6, 14), 'Flag Day', '🏳️');
  obs(nth(y, 5, 0, 3), "Father's Day", '👔');
  obs(addDays(nth(y, 8, 1, 1), 6), "Grandparents' Day", '👵');
  obs(D(y, 9, 11), 'Patriot Day', '🕯️');
  obs(D(y, 10, 31), 'Halloween', '🎃');
  if (y % 2 === 0) obs(addDays(nth(y, 10, 1, 1), 1), 'Election Day', '🗳️');
  obs(addDays(nth(y, 10, 4, 4), 1), 'Black Friday', '🛍️');
  obs(addDays(nth(y, 10, 4, 4), 4), 'Cyber Monday', '💻');
  obs(D(y, 12, 7), 'Pearl Harbor Remembrance Day', '⚓');
  obs(D(y, 12, 24), 'Christmas Eve', '🕯️');
  obs(D(y, 12, 31), "New Year's Eve", '🥂');
}

function addCA(y: number, add: Adder) {
  const nat = (d: Date, name: string, emoji: string) => add(d, { name, emoji, cat: 'national', region: 'CA', off: true });
  const e = easter(y);
  nat(D(y, 1, 1), "New Year's Day", '🎆');
  nat(nth(y, 1, 1, 3), 'Family Day', '👨‍👩‍👧');
  nat(addDays(e, -2), 'Good Friday', '✝️');
  nat(addDays(e, 1), 'Easter Monday', '🐣');
  // Victoria Day: last Monday before May 25
  const may24 = D(y, 5, 24);
  nat(addDays(may24, -((may24.getDay() + 6) % 7)), 'Victoria Day', '👑');
  nat(D(y, 7, 1), 'Canada Day', '🇨🇦');
  nat(nth(y, 7, 1, 1), 'Civic Holiday', '🏞️');
  nat(nth(y, 8, 1, 1), 'Labour Day', '🛠️');
  nat(D(y, 9, 30), 'National Day for Truth and Reconciliation', '🧡');
  nat(nth(y, 9, 1, 2), 'Thanksgiving (Canada)', '🦃');
  nat(D(y, 11, 11), 'Remembrance Day', '🌺');
  nat(D(y, 12, 25), 'Christmas Day', '🎄');
  nat(D(y, 12, 26), 'Boxing Day', '🎁');
  const obs = (d: Date, name: string, emoji: string) => add(d, { name, emoji, cat: 'observance', region: 'CA' });
  obs(D(y, 2, 15), 'National Flag of Canada Day', '🍁');
  obs(D(y, 6, 24), 'Saint-Jean-Baptiste Day', '⚜️');
  obs(nth(y, 4, 0, 2), "Mother's Day", '💐');
  obs(nth(y, 5, 0, 3), "Father's Day", '👔');
  obs(D(y, 10, 31), 'Halloween', '🎃');
}

function addUK(y: number, add: Adder) {
  const nat = (d: Date, name: string, emoji: string) => add(d, { name, emoji, cat: 'national', region: 'UK', off: true });
  const e = easter(y);
  nat(D(y, 1, 1), "New Year's Day", '🎆');
  nat(addDays(e, -2), 'Good Friday', '✝️');
  nat(addDays(e, 1), 'Easter Monday', '🐣');
  nat(nth(y, 4, 1, 1), 'Early May Bank Holiday', '🌼');
  nat(nth(y, 4, 1, -1), 'Spring Bank Holiday', '🌷');
  nat(nth(y, 7, 1, -1), 'Summer Bank Holiday', '☀️');
  nat(D(y, 12, 25), 'Christmas Day', '🎄');
  nat(D(y, 12, 26), 'Boxing Day', '🎁');
  const obs = (d: Date, name: string, emoji: string) => add(d, { name, emoji, cat: 'observance', region: 'UK' });
  obs(D(y, 1, 25), 'Burns Night', '🥃');
  obs(D(y, 3, 1), "St David's Day", '🏴󠁧󠁢󠁷󠁬󠁳󠁿');
  obs(addDays(e, -21), 'Mothering Sunday', '💐');
  obs(addDays(e, -47), 'Pancake Day', '🥞');
  obs(D(y, 4, 23), "St George's Day", '🏴󠁧󠁢󠁥󠁮󠁧󠁿');
  obs(nth(y, 5, 0, 3), "Father's Day", '👔');
  obs(D(y, 11, 5), 'Bonfire Night', '🎇');
  obs(nth(y, 10, 0, 2), 'Remembrance Sunday', '🌺');
  obs(D(y, 11, 30), "St Andrew's Day", '🏴󠁧󠁢󠁳󠁣󠁴󠁿');
}

function addAU(y: number, add: Adder) {
  const nat = (d: Date, name: string, emoji: string) => add(d, { name, emoji, cat: 'national', region: 'AU', off: true });
  const e = easter(y);
  nat(D(y, 1, 1), "New Year's Day", '🎆');
  nat(D(y, 1, 26), 'Australia Day', '🇦🇺');
  nat(addDays(e, -2), 'Good Friday', '✝️');
  nat(addDays(e, -1), 'Easter Saturday', '🐣');
  nat(addDays(e, 1), 'Easter Monday', '🐣');
  nat(D(y, 4, 25), 'Anzac Day', '🌺');
  nat(nth(y, 5, 1, 2), "King's Birthday", '👑');
  nat(D(y, 12, 25), 'Christmas Day', '🎄');
  nat(D(y, 12, 26), 'Boxing Day', '🎁');
  const obs = (d: Date, name: string, emoji: string) => add(d, { name, emoji, cat: 'observance', region: 'AU' });
  obs(nth(y, 4, 0, 2), "Mother's Day", '💐');
  obs(nth(y, 8, 0, 1), "Father's Day (AU)", '👔');
  obs(nth(y, 10, 2, 1), 'Melbourne Cup', '🏇');
}

function addChristian(y: number, add: Adder) {
  const c = (d: Date, name: string, emoji: string) => add(d, { name, emoji, cat: 'christian' });
  const e = easter(y);
  c(D(y, 1, 6), 'Epiphany', '⭐');
  c(addDays(e, -47), 'Mardi Gras / Shrove Tuesday', '🎭');
  c(addDays(e, -46), 'Ash Wednesday', '✝️');
  c(addDays(e, -7), 'Palm Sunday', '🌿');
  c(addDays(e, -3), 'Maundy Thursday', '🍞');
  c(addDays(e, -2), 'Good Friday', '✝️');
  c(addDays(e, -1), 'Holy Saturday', '🕯️');
  c(e, 'Easter Sunday', '🐣');
  c(addDays(e, 39), 'Ascension Day', '☁️');
  c(addDays(e, 49), 'Pentecost', '🕊️');
  const oe = orthodoxEaster(y);
  if (ymd(oe) !== ymd(e)) c(oe, 'Orthodox Easter', '☦️');
  else c(oe, 'Orthodox Easter (same day)', '☦️');
  c(D(y, 11, 1), "All Saints' Day", '😇');
  const xmas = D(y, 12, 25);
  const advent = addDays(xmas, -(xmas.getDay() || 7) - 21);
  c(advent, 'First Sunday of Advent', '🕯️');
  c(D(y, 12, 24), 'Christmas Eve', '🕯️');
  c(xmas, 'Christmas Day', '🎄');
}

function addJewish(y: number, add: Adder) {
  const days = scanCalendar(y, 'hebrew', 'long');
  const j = (d: Date, name: string, emoji: string) => add(d, { name, emoji, cat: 'jewish' });
  for (const { date, month, day } of days) {
    if (month === 'Tishri' && day === 1) j(date, 'Rosh Hashanah', '🍎');
    if (month === 'Tishri' && day === 2) j(date, 'Rosh Hashanah (Day 2)', '🍎');
    if (month === 'Tishri' && day === 10) j(date, 'Yom Kippur', '🕍');
    if (month === 'Tishri' && day === 15) j(date, 'Sukkot', '🌿');
    if (month === 'Tishri' && day === 22) j(date, 'Shemini Atzeret', '🌿');
    if (month === 'Tishri' && day === 23) j(date, 'Simchat Torah', '📜');
    if (month === 'Kislev' && day === 25) j(date, 'Hanukkah (1st candle)', '🕎');
    if (month === 'Shevat' && day === 15) j(date, 'Tu BiShvat', '🌳');
    if ((month === 'Adar' || month === 'Adar II') && day === 14) j(date, 'Purim', '🎭');
    if (month === 'Nisan' && day === 15) j(date, 'Passover (Pesach)', '🍷');
    if (month === 'Nisan' && day === 27) j(date, 'Yom HaShoah', '🕯️');
    if (month === 'Iyar' && day === 18) j(date, "Lag BaOmer", '🔥');
    if (month === 'Sivan' && day === 6) j(date, 'Shavuot', '📜');
    if (month === 'Av' && day === 9) j(date, "Tisha B'Av", '🕯️');
  }
  // Hanukkah runs 8 days: mark the remaining nights.
  const start = days.find((d) => d.month === 'Kislev' && d.day === 25);
  if (start) for (let i = 1; i < 8; i++) j(addDays(start.date, i), `Hanukkah (night ${i + 1})`, '🕎');
  // Kislev 25 may fall in the previous Gregorian year with nights spilling into January.
  const prevStart = scanCalendar(y - 1, 'hebrew', 'long').find((d) => d.month === 'Kislev' && d.day === 25);
  if (prevStart)
    for (let i = 1; i < 8; i++) {
      const d = addDays(prevStart.date, i);
      if (d.getFullYear() === y) j(d, `Hanukkah (night ${i + 1})`, '🕎');
    }
}

function addIslamic(y: number, add: Adder) {
  const i = (d: Date, name: string, emoji: string) => add(d, { name, emoji, cat: 'islamic' });
  for (const { date, month, day } of scanCalendar(y, 'islamic-umalqura', 'numeric')) {
    const m = Number(month);
    if (m === 1 && day === 1) i(date, 'Islamic New Year', '🌙');
    if (m === 1 && day === 10) i(date, 'Ashura', '🌙');
    if (m === 3 && day === 12) i(date, 'Mawlid an-Nabi', '🕌');
    if (m === 7 && day === 27) i(date, "Isra and Mi'raj", '✨');
    if (m === 9 && day === 1) i(date, 'Ramadan begins', '🌙');
    if (m === 9 && day === 27) i(date, 'Laylat al-Qadr', '✨');
    if (m === 10 && day === 1) i(date, 'Eid al-Fitr', '🕌');
    if (m === 12 && day === 9) i(date, 'Day of Arafah', '⛰️');
    if (m === 12 && day === 10) i(date, 'Eid al-Adha', '🐑');
  }
}

const HOLI_OVERRIDES: Record<number, string> = { 2026: '03-04' };

function addCultural(y: number, add: Adder) {
  const c = (d: Date, name: string, emoji: string) => add(d, { name, emoji, cat: 'cultural' });
  for (const { date, month, day } of scanCalendar(y, 'chinese', 'numeric')) {
    if (month === '1' && day === 1) c(date, 'Lunar New Year', '🧧');
    if (month === '1' && day === 15) c(date, 'Lantern Festival', '🏮');
    if (month === '5' && day === 5) c(date, 'Dragon Boat Festival', '🐉');
    if (month === '7' && day === 7) c(date, 'Qixi Festival', '🌌');
    if (month === '8' && day === 15) c(date, 'Mid-Autumn Festival', '🥮');
  }
  // Diwali: the evening on which Amavasya (Kartika new moon, Indian time) prevails.
  const nm = moonsBetween(D(y, 10, 17), D(y, 11, 17), false)[0];
  if (nm) c(dateInOffset(new Date(nm.getTime() - 19 * 3600000), 5.5), 'Diwali', '🪔');
  // Holi: day after Holika Dahan on Phalguna Purnima (full moon, late Feb – Mar).
  if (HOLI_OVERRIDES[y]) {
    const [m, d] = HOLI_OVERRIDES[y].split('-').map(Number);
    c(D(y, m, d), 'Holi', '🎨');
  } else {
    const fm = moonsBetween(D(y, 2, 26), D(y, 3, 31), true)[0];
    if (fm) c(addDays(dateInOffset(new Date(fm.getTime() - 18 * 3600000), 5.5), 1), 'Holi', '🎨');
  }
  const eq = season(y, 0);
  c(new Date(eq.getFullYear(), eq.getMonth(), eq.getDate()), 'Nowruz (Persian New Year)', '🌱');
  c(D(y, 11, 2), 'Día de los Muertos', '💀');
  c(D(y, 12, 26), 'Kwanzaa begins', '🕯️');
}

function addInternational(y: number, add: Adder) {
  const i = (d: Date, name: string, emoji: string) => add(d, { name, emoji, cat: 'international' });
  i(D(y, 3, 8), "International Women's Day", '♀️');
  i(D(y, 3, 14), 'Pi Day', '🥧');
  i(D(y, 4, 22), 'Earth Day', '🌍');
  i(D(y, 5, 4), 'Star Wars Day', '🌌');
  i(D(y, 6, 5), 'World Environment Day', '🌱');
  i(D(y, 9, 21), 'International Day of Peace', '🕊️');
  i(D(y, 11, 13), 'World Kindness Day', '💛');
  i(D(y, 12, 10), 'Human Rights Day', '🤝');
  if (new Date(y, 1, 29).getMonth() === 1) i(D(y, 2, 29), 'Leap Day', '🐸');
  const names = ['March Equinox', 'June Solstice', 'September Equinox', 'December Solstice'];
  const emo = ['🌸', '☀️', '🍂', '❄️'];
  for (const w of [0, 1, 2, 3] as const) {
    const s = season(y, w);
    i(new Date(s.getFullYear(), s.getMonth(), s.getDate()), names[w], emo[w]);
  }
  // Daylight saving changes in the device's own time zone.
  let prev = D(y, 1, 1).getTimezoneOffset();
  for (let d = D(y, 1, 2); d.getFullYear() === y; d = addDays(d, 1)) {
    const off = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12).getTimezoneOffset();
    if (off !== prev) {
      i(d, off < prev ? 'Daylight saving begins (clocks forward)' : 'Daylight saving ends (clocks back)', '⏰');
      prev = off;
    }
  }
  // Full moons, for fun.
  for (const fm of moonsBetween(D(y, 1, 1), D(y + 1, 1, 1), true))
    i(new Date(fm.getFullYear(), fm.getMonth(), fm.getDate()), 'Full Moon', '🌕');
}

const cache = new Map<string, Map<string, Holiday[]>>();

/** Holidays for a year keyed by YYYY-MM-DD, filtered by region and category. */
export function holidaysForYear(year: number, regions: RegionId[], cats: HolidayCategory[]) {
  const key = `${year}|${regions.join(',')}|${cats.join(',')}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const map = new Map<string, Holiday[]>();
  const add: Adder = (date, h) => {
    if (date.getFullYear() !== year) return;
    if (!cats.includes(h.cat)) return;
    const k = ymd(date);
    const list = map.get(k) ?? [];
    // Same holiday from multiple regions/categories (e.g. Christmas) shows once.
    const base = (n: string) => n.replace(/ \(.*\)$/, '');
    const dupe = list.find((x) => base(x.name) === base(h.name));
    if (dupe) {
      dupe.off = dupe.off || h.off;
      return;
    }
    list.push(h);
    map.set(k, list);
  };
  if (regions.includes('US')) addUS(year, add);
  if (regions.includes('CA')) addCA(year, add);
  if (regions.includes('UK')) addUK(year, add);
  if (regions.includes('AU')) addAU(year, add);
  addChristian(year, add);
  addJewish(year, add);
  addIslamic(year, add);
  addCultural(year, add);
  addInternational(year, add);
  for (const list of map.values()) list.sort((a, b) => Number(!!b.off) - Number(!!a.off));
  cache.set(key, map);
  return map;
}

export function holidaysOn(date: Date, regions: RegionId[], cats: HolidayCategory[]) {
  return holidaysForYear(date.getFullYear(), regions, cats).get(ymd(date)) ?? [];
}

export function upcomingHolidays(from: Date, count: number, regions: RegionId[], cats: HolidayCategory[]) {
  const out: { date: string; h: Holiday }[] = [];
  const start = ymd(from);
  for (let y = from.getFullYear(); y <= from.getFullYear() + 1 && out.length < count; y++) {
    const map = holidaysForYear(y, regions, cats);
    const keys = [...map.keys()].filter((k) => k >= start).sort();
    for (const k of keys) {
      for (const h of map.get(k)!) if (!h.name.startsWith('Full Moon') && !h.name.includes('night ')) out.push({ date: k, h });
      if (out.length >= count) break;
    }
  }
  return out.slice(0, count);
}

