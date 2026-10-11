import { useMemo, useState } from 'react';
import { AnalogClock, Empty, Modal } from '../components/ui';
import { IcAlarm, IcCalendar, IcDates, IcGlobe, IcMoon, IcPlus, IcSearch, IcSun, IcTodo, IcTrash } from '../icons';
import { upcomingHolidays } from '../lib/holidays';
import { uid, useFrameNow, useNow } from '../lib/store';
import { daysBetween, describeIn, describeOffset, formatClock, nextAlarmDate, parseYmd, ymd, zoneOffsetFromLocal, zoneParts } from '../lib/time';
import { useApp } from '../state';
import { nextOccurrence } from './DatesView';

const ZONES: string[] = (() => {
  try {
    return (Intl as unknown as { supportedValuesOf(k: string): string[] }).supportedValuesOf('timeZone');
  } catch {
    return ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Australia/Sydney'];
  }
})();

const cityOf = (zone: string) => zone.split('/').pop()!.replace(/_/g, ' ');

export default function ClockView() {
  const { settings, worldClocks, setWorldClocks, alarms, todos, dates, go } = useApp();
  const smooth = settings.clockFace !== 'digital' && settings.showSeconds;
  const frameNow = useFrameNow(smooth);
  const tickNow = useNow(1000);
  const now = new Date(smooth ? frameNow : tickNow);
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState('');

  const timeStr = formatClock(now, settings.use24h, false);
  const [main, ampm] = settings.use24h ? [timeStr, ''] : [timeStr.replace(/\s?[AP]M$/i, ''), timeStr.match(/[AP]M$/i)?.[0] ?? ''];

  const nextAlarm = useMemo(() => {
    let best: Date | null = null;
    for (const a of alarms) {
      if (!a.enabled) continue;
      const d = nextAlarmDate(a.time, a.days, now);
      if (d && (!best || d < best)) best = d;
    }
    return best;
  }, [alarms, Math.floor(now.getTime() / 60000)]);

  const today = ymd(now);
  const dueToday = todos.filter((t) => !t.done && t.due && t.due <= today).length;
  const nextDate = useMemo(() => {
    return dates
      .map((d) => ({ d, occ: nextOccurrence(d, now) }))
      .filter((x) => x.occ)
      .sort((a, b) => a.occ!.getTime() - b.occ!.getTime())[0];
  }, [dates, today]);
  const nextHoliday = useMemo(
    () => upcomingHolidays(now, 1, settings.regions, settings.holidayCats.filter((c) => c !== 'international'))[0],
    [today, settings.regions, settings.holidayCats],
  );

  const filtered = ZONES.filter((z) => z.toLowerCase().replace(/_/g, ' ').includes(q.toLowerCase())).slice(0, 80);
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="page">
      <section className="card hero">
        {settings.clockFace !== 'digital' && <AnalogClock date={now} size={settings.clockFace === 'both' ? 200 : 260} showSeconds={settings.showSeconds} />}
        {settings.clockFace !== 'analog' && (
          <div className="bigtime">
            {main}
            {settings.showSeconds && <span className="sec">{String(now.getSeconds()).padStart(2, '0')}</span>}
            {ampm && <span className="ampm">{ampm}</span>}
          </div>
        )}
        <div className="muted" style={{ fontWeight: 600 }}>
          {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        <div className="small muted">{cityOf(localZone)}</div>
      </section>

      <section className="glance">
        <button className="item" onClick={() => go('alarms')}>
          <IcAlarm size={28} />
          <div>
            <div className="val">{nextAlarm ? formatClock(nextAlarm, settings.use24h, false) : 'No alarms'}</div>
            <div className="lbl">{nextAlarm ? `Next alarm ${describeIn(nextAlarm.getTime() - now.getTime())}` : 'Tap to set one'}</div>
          </div>
        </button>
        <button className="item" onClick={() => go('todo')}>
          <IcTodo size={28} />
          <div>
            <div className="val">{dueToday ? `${dueToday} due` : 'All clear'}</div>
            <div className="lbl">To-dos today</div>
          </div>
        </button>
        <button className="item" onClick={() => go('dates')}>
          <IcDates size={28} />
          <div className="grow">
            <div className="val ellipsis">{nextDate ? nextDate.d.name : 'No dates saved'}</div>
            <div className="lbl">{nextDate ? (daysBetween(now, nextDate.occ!) === 0 ? 'Today! 🎉' : `in ${daysBetween(now, nextDate.occ!)} days`) : 'Birthdays & anniversaries'}</div>
          </div>
        </button>
        <button className="item" onClick={() => nextHoliday && go('calendar', { kind: 'calendarDay', date: nextHoliday.date })}>
          <IcCalendar size={28} />
          <div className="grow">
            <div className="val ellipsis">{nextHoliday ? `${nextHoliday.h.emoji} ${nextHoliday.h.name}` : '—'}</div>
            <div className="lbl">
              {nextHoliday ? (nextHoliday.date === today ? 'Today' : parseYmd(nextHoliday.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })) : 'Next holiday'}
            </div>
          </div>
        </button>
      </section>

      <section className="card">
        <div className="card-title">
          <IcGlobe size={22} />
          <h2>World clocks</h2>
          <button className="btn sm" onClick={() => setAdding(true)}>
            <IcPlus size={16} /> Add city
          </button>
        </div>
        {worldClocks.length === 0 ? (
          <Empty icon={<IcGlobe size={48} />} title="No world clocks yet" hint="Keep track of friends, family and teams around the globe." />
        ) : (
          <div className="list">
            {worldClocks.map((wc) => {
              const p = zoneParts(now, wc.zone);
              const day = p.hour >= 6 && p.hour < 18;
              const off = zoneOffsetFromLocal(now, wc.zone);
              const zoneDate = new Date(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
              const dayDiff = daysBetween(now, zoneDate);
              return (
                <div className="li zone" key={wc.id}>
                  <AnalogClock date={zoneDate} size={48} showSeconds={false} small />
                  <div className="grow">
                    <div className="city ellipsis">{wc.label}</div>
                    <div className="small muted">
                      {dayDiff === 0 ? 'Today' : dayDiff > 0 ? 'Tomorrow' : 'Yesterday'} · {describeOffset(off)}
                    </div>
                  </div>
                  <div className="daynight" title={day ? 'Daytime' : 'Night'}>{day ? <IcSun size={22} /> : <IcMoon size={22} />}</div>
                  <div className="t">{formatClock(now, settings.use24h, false, wc.zone)}</div>
                  <button className="iconbtn danger" aria-label={`Remove ${wc.label}`} onClick={() => setWorldClocks((l) => l.filter((x) => x.id !== wc.id))}>
                    <IcTrash size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {adding && (
        <Modal title="Add a city" onClose={() => setAdding(false)}>
          <div className="row">
            <IcSearch size={20} />
            <input type="search" autoFocus placeholder="Search city or region (e.g. Tokyo, Paris)" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="pick">
            {filtered.map((z) => (
              <button
                key={z}
                onClick={() => {
                  setWorldClocks((l) => [...l, { id: uid(), zone: z, label: cityOf(z) }]);
                  setAdding(false);
                  setQ('');
                }}
              >
                <span className="grow">
                  <strong>{cityOf(z)}</strong> <span className="small muted">{z.split('/')[0]}</span>
                </span>
                <span className="muted tnum">{formatClock(now, settings.use24h, false, z)}</span>
              </button>
            ))}
            {filtered.length === 0 && <div className="empty small">No matching time zones</div>}
          </div>
        </Modal>
      )}
    </div>
  );
}
