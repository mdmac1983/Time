import { useEffect, useMemo, useState } from 'react';
import { Modal } from '../components/ui';
import { IcCalendar, IcChevron, IcDates, IcJournal, IcPlus, IcTodo, IcTrash } from '../icons';
import { CATEGORY_LABELS, holidaysForYear, upcomingHolidays, type Holiday } from '../lib/holidays';
import { uid } from '../lib/store';
import { addDays, daysBetween, formatHHMM, MONTHS, parseYmd, WEEKDAYS_SHORT, ymd } from '../lib/time';
import { useApp } from '../state';
import type { CalEvent, SaveDate } from '../types';
import { kindIcon, milestone } from './DatesView';

export default function CalendarView() {
  const { settings, todos, setTodos, journal, dates, events, setEvents, go, intent, clearIntent } = useApp();
  const todayStr = ymd(new Date());
  const [sel, setSel] = useState(todayStr);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [editing, setEditing] = useState<CalEvent | null>(null);

  useEffect(() => {
    if (intent?.kind === 'calendarDay') {
      setSel(intent.date);
      const d = parseYmd(intent.date);
      setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
      clearIntent();
    }
  }, [intent]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const hol = useMemo(() => {
    const m = new Map<string, Holiday[]>();
    for (const y of [year - 1, year, year + 1]) for (const [k, v] of holidaysForYear(y, settings.regions, settings.holidayCats)) m.set(k, v);
    return m;
  }, [year, settings.regions, settings.holidayCats]);

  // Save-the-dates keyed by MM-DD for recurring, YYYY-MM-DD for one-off.
  const datesOn = (d: Date): SaveDate[] =>
    dates.filter((s) => {
      if (!s.recurring) return s.year === d.getFullYear() && s.month === d.getMonth() + 1 && s.day === d.getDate();
      if (s.month === 2 && s.day === 29 && new Date(d.getFullYear(), 1, 29).getMonth() !== 1) return d.getMonth() === 1 && d.getDate() === 28;
      return s.month === d.getMonth() + 1 && s.day === d.getDate();
    });

  const first = new Date(year, month, 1);
  const lead = (first.getDay() - settings.weekStart + 7) % 7;
  const start = addDays(first, -lead);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const dow = Array.from({ length: 7 }, (_, i) => WEEKDAYS_SHORT[(i + settings.weekStart) % 7]);

  const selDate = parseYmd(sel);
  const selHol = hol.get(sel) ?? [];
  const selDates = datesOn(selDate);
  const selTodos = todos.filter((t) => t.due === sel);
  const selJournal = journal.find((j) => j.date === sel);
  const selEvents = events.filter((e) => e.date === sel).sort((a, b) => a.time.localeCompare(b.time));
  const upcoming = useMemo(() => upcomingHolidays(new Date(), 8, settings.regions, settings.holidayCats), [settings.regions, settings.holidayCats]);

  const rel = daysBetween(new Date(), selDate);
  const relText = rel === 0 ? 'Today' : rel === 1 ? 'Tomorrow' : rel === -1 ? 'Yesterday' : rel > 0 ? `In ${rel} days` : `${-rel} days ago`;

  return (
    <div className="page">
      <section className="card">
        <div className="cal-head" style={{ marginBottom: 10 }}>
          <h2>
            {MONTHS[month]} <span className="muted">{year}</span>
          </h2>
          <button className="btn sm" onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); setSel(todayStr); }}>Today</button>
          <button className="iconbtn" aria-label="Previous month" onClick={() => setCursor(new Date(year, month - 1, 1))}><IcChevron dir="left" size={20} /></button>
          <button className="iconbtn" aria-label="Next month" onClick={() => setCursor(new Date(year, month + 1, 1))}><IcChevron size={20} /></button>
        </div>
        <div className="cal-grid">
          {dow.map((d) => <div key={d} className="cal-dow">{d}</div>)}
          {cells.map((d) => {
            const k = ymd(d);
            const hs = hol.get(k) ?? [];
            const off = hs.some((h) => h.off);
            const hasTodo = todos.some((t) => t.due === k && !t.done);
            const hasJ = journal.some((j) => j.date === k);
            const hasDate = datesOn(d).length > 0;
            const hasEv = events.some((e) => e.date === k);
            const cls = ['cal-cell', d.getMonth() !== month && 'other', k === todayStr && 'today', k === sel && 'sel', off && 'dayoff', (d.getDay() === 0 || d.getDay() === 6) && 'weekend'].filter(Boolean).join(' ');
            return (
              <button key={k} className={cls} onClick={() => { setSel(k); if (d.getMonth() !== month) setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); }} aria-label={d.toDateString()}>
                <span className="n">{d.getDate()}</span>
                {hs.slice(0, 2).map((h) => <span key={h.name} className="hol" title={h.name}>{h.emoji} {h.name}</span>)}
                {hs.length > 0 && <span className="emo">{hs[0].emoji}</span>}
                <span className="dots">
                  {hasEv && <i className="dot d-event" />}
                  {hasTodo && <i className="dot d-todo" />}
                  {hasDate && <i className="dot d-date" />}
                  {hasJ && <i className="dot d-journal" />}
                </span>
              </button>
            );
          })}
        </div>
        <div className="legend" style={{ marginTop: 10 }}>
          <span><i className="dot d-event" /> Event</span>
          <span><i className="dot d-todo" /> To-do</span>
          <span><i className="dot d-date" /> Save the date</span>
          <span><i className="dot d-journal" /> Journal</span>
        </div>
      </section>

      <section className="card">
        <div className="card-title">
          <h2>
            {selDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            <div className="small muted" style={{ fontWeight: 500 }}>{relText}</div>
          </h2>
        </div>
        <div className="chips" style={{ marginBottom: 8 }}>
          <button className="chip" onClick={() => setEditing({ id: uid(), title: '', date: sel, time: '', notes: '' })}><IcPlus size={14} /> Event</button>
          <button className="chip" onClick={() => go('todo', { kind: 'newTodo', due: sel })}><IcPlus size={14} /> To-do</button>
          <button className="chip" onClick={() => go('journal', { kind: 'journal', date: sel })}><IcPlus size={14} /> Journal</button>
          <button className="chip" onClick={() => go('dates', { kind: 'newDate', month: selDate.getMonth() + 1, day: selDate.getDate() })}><IcPlus size={14} /> Save the date</button>
        </div>
        <div>
          {selHol.map((h) => (
            <div className="agenda-item" key={h.name}>
              <span className="emoji">{h.emoji}</span>
              <div className="grow">
                <strong>{h.name}</strong>
                <div className="small muted">{CATEGORY_LABELS[h.cat]}{h.region ? ` · ${h.region}` : ''}</div>
              </div>
              {h.off && <span className="tag ok">Day off</span>}
            </div>
          ))}
          {selDates.map((s) => {
            const Icon = kindIcon(s.kind);
            return (
              <div className="agenda-item" key={s.id} onClick={() => go('dates')} style={{ cursor: 'pointer' }}>
                <span className="emoji" style={{ color: 'var(--danger)' }}><Icon size={22} /></span>
                <div className="grow">
                  <strong>{s.name}</strong>
                  <div className="small muted">{s.kind[0].toUpperCase() + s.kind.slice(1)} {milestone(s, selDate) && `· ${milestone(s, selDate)}`}</div>
                </div>
              </div>
            );
          })}
          {selEvents.map((e) => (
            <div className="agenda-item" key={e.id} onClick={() => setEditing(e)} style={{ cursor: 'pointer' }}>
              <span className="emoji" style={{ color: 'var(--accent2)' }}><IcCalendar size={22} /></span>
              <div className="grow">
                <strong>{e.title}</strong>
                <div className="small muted">{e.time ? formatHHMM(e.time, settings.use24h) : 'All day'}{e.notes && ` · ${e.notes}`}</div>
              </div>
            </div>
          ))}
          {selTodos.map((t) => (
            <div className="agenda-item" key={t.id}>
              <span className="emoji" style={{ color: 'var(--accent)' }}><IcTodo size={22} /></span>
              <div className="grow" style={{ textDecoration: t.done ? 'line-through' : undefined }}>
                <strong>{t.title}</strong>
                <div className="small muted">To-do · {t.list}</div>
              </div>
              <button className="btn sm" onClick={() => setTodos((l) => l.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))}>{t.done ? 'Undo' : 'Done'}</button>
            </div>
          ))}
          {selJournal && (
            <div className="agenda-item" onClick={() => go('journal', { kind: 'journal', date: sel })} style={{ cursor: 'pointer' }}>
              <span className="emoji" style={{ color: 'var(--mood-good)' }}><IcJournal size={22} /></span>
              <div className="grow">
                <strong>{selJournal.title || 'Journal entry'}</strong>
                <div className="small muted ellipsis">{selJournal.body}</div>
              </div>
            </div>
          )}
          {!selHol.length && !selDates.length && !selEvents.length && !selTodos.length && !selJournal && (
            <div className="muted small" style={{ padding: '10px 0' }}>Nothing planned. Enjoy the free day ✨</div>
          )}
        </div>
      </section>

      <section className="card">
        <div className="card-title">
          <IcDates size={22} />
          <h2>Upcoming holidays</h2>
          <button className="btn sm ghost" onClick={() => go('settings')}>Choose holidays</button>
        </div>
        <div>
          {upcoming.map(({ date, h }) => (
            <div className="agenda-item" key={date + h.name} onClick={() => { setSel(date); const d = parseYmd(date); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); }} style={{ cursor: 'pointer' }}>
              <span className="emoji">{h.emoji}</span>
              <div className="grow">
                <strong>{h.name}</strong>
                <div className="small muted">{parseYmd(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
              </div>
              <span className="tag">{daysBetween(new Date(), parseYmd(date)) === 0 ? 'Today' : `${daysBetween(new Date(), parseYmd(date))}d`}</span>
            </div>
          ))}
        </div>
      </section>

      {editing && (
        <Modal
          title={events.some((e) => e.id === editing.id) ? 'Edit event' : 'New event'}
          onClose={() => setEditing(null)}
          actions={
            <>
              {events.some((e) => e.id === editing.id) && (
                <button className="btn danger" onClick={() => { setEvents((l) => l.filter((e) => e.id !== editing.id)); setEditing(null); }}>
                  <IcTrash size={18} /> Delete
                </button>
              )}
              <button
                className="btn primary"
                disabled={!editing.title.trim()}
                onClick={() => {
                  setEvents((l) => (l.some((e) => e.id === editing.id) ? l.map((e) => (e.id === editing.id ? editing : e)) : [...l, editing]));
                  setEditing(null);
                }}
              >
                Save
              </button>
            </>
          }
        >
          <label className="field">
            Title
            <input type="text" autoFocus value={editing.title} placeholder="Dentist, Dinner with Sam…" onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
          </label>
          <div className="row">
            <label className="field grow">
              Date
              <input type="date" value={editing.date} onChange={(e) => e.target.value && setEditing({ ...editing, date: e.target.value })} />
            </label>
            <label className="field grow">
              Time (optional)
              <input type="time" value={editing.time} onChange={(e) => setEditing({ ...editing, time: e.target.value })} />
            </label>
          </div>
          <label className="field">
            Notes
            <textarea style={{ minHeight: 70 }} value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
          </label>
        </Modal>
      )}
    </div>
  );
}
