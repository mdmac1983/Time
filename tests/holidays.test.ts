import { describe, expect, it } from 'vitest';
import { easter, holidaysForYear, orthodoxEaster } from '../src/lib/holidays';
import { ymd } from '../src/lib/time';
import type { HolidayCategory, RegionId } from '../src/types';

const ALL_CATS: HolidayCategory[] = ['national', 'observance', 'christian', 'jewish', 'islamic', 'cultural', 'international'];
const ALL_REGIONS: RegionId[] = ['US', 'CA', 'UK', 'AU'];

function find(year: number, name: string) {
  const map = holidaysForYear(year, ALL_REGIONS, ALL_CATS);
  return [...map.entries()].filter(([, hs]) => hs.some((h) => h.name === name)).map(([d]) => d);
}

describe('holidays', () => {
  it('computes Easter', () => {
    expect(ymd(easter(2024))).toBe('2024-03-31');
    expect(ymd(easter(2025))).toBe('2025-04-20');
    expect(ymd(easter(2026))).toBe('2026-04-05');
    expect(ymd(orthodoxEaster(2026))).toBe('2026-04-12');
    expect(ymd(orthodoxEaster(2025))).toBe('2025-04-20');
  });

  it.each([
    [2026, 'Thanksgiving', '2026-11-26'],
    [2026, 'Martin Luther King Jr. Day', '2026-01-19'],
    [2026, 'Memorial Day', '2026-05-25'],
    [2026, 'Independence Day (observed)', '2026-07-03'],
    [2026, 'Victoria Day', '2026-05-18'],
    [2026, 'Thanksgiving (Canada)', '2026-10-12'],
    [2026, 'Spring Bank Holiday', '2026-05-25'],
    [2026, 'Rosh Hashanah', '2026-09-12'],
    [2026, 'Yom Kippur', '2026-09-21'],
    [2026, 'Passover (Pesach)', '2026-04-02'],
    [2026, 'Hanukkah (1st candle)', '2026-12-05'],
    [2026, 'Purim', '2026-03-03'],
    [2026, 'Eid al-Fitr', '2026-03-20'],
    [2026, 'Eid al-Adha', '2026-05-27'],
    [2026, 'Lunar New Year', '2026-02-17'],
    [2026, 'Mid-Autumn Festival', '2026-09-25'],
    [2026, 'Diwali', '2026-11-08'],
    [2025, 'Diwali', '2025-10-20'],
    [2024, 'Diwali', '2024-10-31'],
    [2025, 'Holi', '2025-03-14'],
    [2024, 'Holi', '2024-03-25'],
    [2027, 'Diwali', '2027-10-29'],
    [2023, 'Diwali', '2023-11-12'],
    [2023, 'Holi', '2023-03-08'],
    [2026, 'Holi', '2026-03-04'],
    [2025, 'Lunar New Year', '2025-01-29'],
    [2026, 'June Solstice', '2026-06-21'],
    [2026, 'December Solstice', '2026-12-21'],
    [2026, 'March Equinox', '2026-03-20'],
    [2026, 'First Sunday of Advent', '2026-11-29'],
    [2025, 'First Sunday of Advent', '2025-11-30'],
    [2026, 'Ash Wednesday', '2026-02-18'],
  ])('%i %s', (year, name, expected) => {
    expect(find(year, name)).toContain(expected);
  });

  it('dedupes Christmas across regions', () => {
    const map = holidaysForYear(2026, ALL_REGIONS, ALL_CATS);
    expect(map.get('2026-12-25')!.filter((h) => h.name === 'Christmas Day')).toHaveLength(1);
  });

  it('respects category filter', () => {
    const map = holidaysForYear(2026, ['US'], ['national']);
    expect(map.get('2026-12-25')!.map((h) => h.name)).toEqual(['Christmas Day']);
    expect(map.get('2026-10-31')).toBeUndefined();
  });
});
