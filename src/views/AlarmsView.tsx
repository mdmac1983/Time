import { useState } from 'react';
import { Empty, Modal, Switch } from '../components/ui';
import { IcAlarm, IcPlay, IcPlus, IcTrash } from '../icons';
import { SOUNDS, playSound } from '../lib/sound';
import { uid, useNow } from '../lib/store';
import { describeIn, formatHHMM, nextAlarmDate, WEEKDAYS_MIN, WEEKDAYS_SHORT } from '../lib/time';
import { useApp } from '../state';
import type { Alarm } from '../types';

export function describeDays(days: number[]) {
  if (days.length === 0) return 'Once';
  if (days.length === 7) return 'Every day';
  const s = [...days].sort().join('');
  if (s === '12345') return 'Weekdays';
  if (s === '06') return 'Weekends';
  return [...days].sort().map((d) => WEEKDAYS_SHORT[d]).join(', ');
}

export default function AlarmsView() {
  const { alarms, setAlarms, settings, toast } = useApp();
  const [editing, setEditing] = useState<Alarm | null>(null);
  const now = useNow(15000);

  const sorted = [...alarms].sort((a, b) => a.time.localeCompare(b.time));
  const update = (id: string, patch: Partial<Alarm>) => setAlarms((l) => l.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const newAlarm = (): Alarm => {
    const d = new Date(now + 60 * 60000);
    return {
      id: uid(),
      time: `${String(d.getHours()).padStart(2, '0')}:00`,
      label: '',
      days: [],
      enabled: true,
      sound: settings.defaultSound,
      snoozeMin: 9,
      snoozeUntil: null,
      lastFired: null,
    };
  };

  const toggle = (a: Alarm, on: boolean) => {
    update(a.id, { enabled: on, snoozeUntil: null });
    if (on) {
      const next = nextAlarmDate(a.time, a.days, new Date());
      if (next) toast(`Alarm set for ${describeIn(next.getTime() - Date.now())}`);
    }
  };

  return (
    <div className="page">
      {sorted.length === 0 ? (
        <div className="card">
          <Empty icon={<IcAlarm size={64} />} title="No alarms" hint="Add as many alarms as you like — one-time or repeating." action={<button className="btn primary" onClick={() => setEditing(newAlarm())}><IcPlus size={18} /> New alarm</button>} />
        </div>
      ) : (
        <div className="grid">
          {sorted.map((a) => {
            const next = a.enabled ? nextAlarmDate(a.time, a.days, new Date(now)) : null;
            const [t, ap] = formatHHMM(a.time, settings.use24h).split(' ');
            return (
              <div key={a.id} className={`card alarm ${a.enabled ? '' : 'off'}`}>
                <div className="grow" onClick={() => setEditing(a)} style={{ cursor: 'pointer' }}>
                  <div className="t">
                    {t}
                    {ap && <small>{ap}</small>}
                  </div>
                  <div className="ellipsis" style={{ fontWeight: 600 }}>{a.label || 'Alarm'}</div>
                  <div className="row" style={{ gap: 8, marginTop: 4 }}>
                    <div className="days">
                      {WEEKDAYS_MIN.map((d, i) => (
                        <span key={i} className={a.days.includes(i) ? 'on' : ''}>{d}</span>
                      ))}
                    </div>
                    <span className="small muted">{a.snoozeUntil ? 'Snoozed' : next ? describeIn(next.getTime() - now) : describeDays(a.days)}</span>
                  </div>
                </div>
                <Switch checked={a.enabled} onChange={(v) => toggle(a, v)} label="Enabled" />
              </div>
            );
          })}
        </div>
      )}
      <button className="fab" aria-label="New alarm" onClick={() => setEditing(newAlarm())}>
        <IcPlus size={28} />
      </button>
      {editing && (
        <AlarmEditor
          alarm={editing}
          isNew={!alarms.some((a) => a.id === editing.id)}
          onClose={() => setEditing(null)}
          onSave={(a) => {
            setAlarms((l) => (l.some((x) => x.id === a.id) ? l.map((x) => (x.id === a.id ? a : x)) : [...l, a]));
            const next = nextAlarmDate(a.time, a.days, new Date());
            if (next && a.enabled) toast(`Alarm set for ${describeIn(next.getTime() - Date.now())}`);
            setEditing(null);
          }}
          onDelete={() => {
            setAlarms((l) => l.filter((x) => x.id !== editing.id));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function AlarmEditor({ alarm, isNew, onClose, onSave, onDelete }: { alarm: Alarm; isNew: boolean; onClose: () => void; onSave: (a: Alarm) => void; onDelete: () => void }) {
  const [a, setA] = useState(alarm);
  const set = (p: Partial<Alarm>) => setA((x) => ({ ...x, ...p }));
  const toggleDay = (d: number) => set({ days: a.days.includes(d) ? a.days.filter((x) => x !== d) : [...a.days, d].sort() });
  const preview = () => {
    const stop = playSound(a.sound, true);
    setTimeout(stop, 2500);
  };
  return (
    <Modal
      title={isNew ? 'New alarm' : 'Edit alarm'}
      onClose={onClose}
      actions={
        <>
          {!isNew && (
            <button className="btn danger" onClick={onDelete}>
              <IcTrash size={18} /> Delete
            </button>
          )}
          <button className="btn primary" onClick={() => onSave({ ...a, enabled: true, lastFired: null, snoozeUntil: null })}>
            Save
          </button>
        </>
      }
    >
      <div className="timepick">
        <input type="time" value={a.time} onChange={(e) => e.target.value && set({ time: e.target.value })} />
      </div>
      <label className="field">
        Label
        <input type="text" placeholder="Wake up, Gym, Meds…" value={a.label} onChange={(e) => set({ label: e.target.value })} />
      </label>
      <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span className="small muted" style={{ fontWeight: 600 }}>Repeat · {describeDays(a.days)}</span>
        <div className="chips">
          {WEEKDAYS_MIN.map((d, i) => (
            <button key={i} className={`chip daychip ${a.days.includes(i) ? 'on' : ''}`} onClick={() => toggleDay(i)} aria-label={WEEKDAYS_SHORT[i]}>
              {d}
            </button>
          ))}
        </div>
        <div className="chips">
          <button className="chip" onClick={() => set({ days: [1, 2, 3, 4, 5] })}>Weekdays</button>
          <button className="chip" onClick={() => set({ days: [0, 6] })}>Weekends</button>
          <button className="chip" onClick={() => set({ days: [0, 1, 2, 3, 4, 5, 6] })}>Every day</button>
          <button className="chip" onClick={() => set({ days: [] })}>Once</button>
        </div>
      </div>
      <div className="row">
        <label className="field grow">
          Sound
          <select value={a.sound} onChange={(e) => set({ sound: e.target.value as Alarm['sound'] })}>
            {SOUNDS.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <button className="round sm" style={{ alignSelf: 'flex-end' }} onClick={preview} aria-label="Preview sound">
          <IcPlay size={18} />
        </button>
      </div>
      <label className="field">
        Snooze length
        <select value={a.snoozeMin} onChange={(e) => set({ snoozeMin: Number(e.target.value) })}>
          {[1, 3, 5, 9, 10, 15, 20, 30].map((m) => (
            <option key={m} value={m}>{m} minutes</option>
          ))}
        </select>
      </label>
    </Modal>
  );
}
