import { useState } from 'react';
import { Empty, Modal } from '../components/ui';
import { IcPause, IcPlay, IcPlus, IcReset, IcTimer, IcTrash } from '../icons';
import { SOUNDS } from '../lib/sound';
import { uid, useNow } from '../lib/store';
import { formatDuration } from '../lib/time';
import { useApp } from '../state';
import type { SoundId, Timer } from '../types';

const PRESETS = [
  { label: '1 min', ms: 60000 },
  { label: '3 min', ms: 180000 },
  { label: '5 min', ms: 300000 },
  { label: '10 min', ms: 600000 },
  { label: '15 min', ms: 900000 },
  { label: 'Pomodoro 25', ms: 1500000 },
  { label: '30 min', ms: 1800000 },
  { label: '1 hour', ms: 3600000 },
];

export const remainingOf = (t: Timer, now: number) => (t.endAt ? Math.max(0, t.endAt - now) : t.remaining);

export default function TimersView() {
  const { timers, setTimers, settings } = useApp();
  const now = useNow(250);
  const [adding, setAdding] = useState(false);

  const update = (id: string, fn: (t: Timer) => Timer) => setTimers((l) => l.map((t) => (t.id === id ? fn(t) : t)));
  const create = (ms: number, label: string, sound: SoundId, start: boolean) =>
    setTimers((l) => [
      ...l,
      { id: uid(), label, duration: ms, remaining: ms, endAt: start ? Date.now() + ms : null, sound, done: false },
    ]);

  return (
    <div className="page">
      <div className="card">
        <div className="card-title">
          <IcTimer size={22} />
          <h2>Quick start</h2>
        </div>
        <div className="chips">
          {PRESETS.map((p) => (
            <button key={p.label} className="chip" onClick={() => create(p.ms, p.label, settings.defaultSound, true)}>
              {p.label}
            </button>
          ))}
          <button className="chip on" onClick={() => setAdding(true)}>
            Custom…
          </button>
        </div>
      </div>

      {timers.length === 0 ? (
        <div className="card">
          <Empty icon={<IcTimer size={64} />} title="No timers running" hint="Tap a preset above or build a custom countdown. Run as many as you need." />
        </div>
      ) : (
        <div className="grid">
          {timers.map((t) => {
            const rem = remainingOf(t, now);
            const frac = t.duration ? rem / t.duration : 0;
            const R = 92;
            const C = 2 * Math.PI * R;
            const running = !!t.endAt;
            return (
              <div className="card stack" key={t.id}>
                <div className="row">
                  <input
                    type="text"
                    value={t.label}
                    placeholder="Timer"
                    onChange={(e) => update(t.id, (x) => ({ ...x, label: e.target.value }))}
                    style={{ background: 'transparent', border: 0, fontWeight: 700, padding: '4px 0', boxShadow: 'none' }}
                    aria-label="Timer name"
                  />
                  <button className="iconbtn danger" aria-label="Delete timer" onClick={() => setTimers((l) => l.filter((x) => x.id !== t.id))}>
                    <IcTrash size={18} />
                  </button>
                </div>
                <div className="ring-wrap">
                  <svg width="210" height="210" viewBox="0 0 210 210">
                    <defs>
                      <linearGradient id="ringgrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="var(--accent)" />
                        <stop offset="1" stopColor="var(--accent2)" />
                      </linearGradient>
                    </defs>
                    <circle cx="105" cy="105" r={R} fill="none" strokeWidth="12" className="ring-track" />
                    <circle cx="105" cy="105" r={R} fill="none" strokeWidth="12" strokeLinecap="round" className="ring-prog" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} />
                  </svg>
                  <div className="ring-label">
                    <div className={`v ${t.done ? 'done-pulse' : ''}`}>{t.done ? "Time's up" : formatDuration(Math.ceil(rem / 1000) * 1000)}</div>
                    <div className="small muted">
                      {running ? `Ends ${new Date(t.endAt!).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: !settings.use24h })}` : `of ${formatDuration(t.duration)}`}
                    </div>
                  </div>
                </div>
                <div className="controls">
                  <button className="round sm" aria-label="Reset" onClick={() => update(t.id, (x) => ({ ...x, endAt: null, remaining: x.duration, done: false }))}>
                    <IcReset size={20} />
                  </button>
                  <button
                    className="round primary"
                    style={{ width: 68, height: 68 }}
                    aria-label={running ? 'Pause' : 'Start'}
                    onClick={() =>
                      update(t.id, (x) => {
                        if (x.endAt) return { ...x, remaining: remainingOf(x, Date.now()), endAt: null };
                        const r = x.done || x.remaining <= 0 ? x.duration : x.remaining;
                        return { ...x, endAt: Date.now() + r, remaining: r, done: false };
                      })
                    }
                  >
                    {running ? <IcPause size={26} /> : <IcPlay size={26} />}
                  </button>
                  <button
                    className="round sm"
                    aria-label="Add one minute"
                    style={{ fontWeight: 800, fontSize: '0.85rem' }}
                    onClick={() =>
                      update(t.id, (x) =>
                        x.endAt
                          ? { ...x, endAt: x.endAt + 60000, duration: x.duration + 60000 }
                          : { ...x, remaining: (x.done ? 0 : x.remaining) + 60000, duration: Math.max(x.duration, (x.done ? 0 : x.remaining) + 60000), done: false },
                      )
                    }
                  >
                    +1m
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <button className="fab" aria-label="New timer" onClick={() => setAdding(true)}>
        <IcPlus size={28} />
      </button>
      {adding && (
        <NewTimer
          defaultSound={settings.defaultSound}
          onClose={() => setAdding(false)}
          onCreate={(ms, label, sound) => {
            create(ms, label, sound, true);
            setAdding(false);
          }}
        />
      )}
    </div>
  );
}

function NewTimer({ defaultSound, onClose, onCreate }: { defaultSound: SoundId; onClose: () => void; onCreate: (ms: number, label: string, sound: SoundId) => void }) {
  const [h, setH] = useState(0);
  const [m, setM] = useState(10);
  const [s, setS] = useState(0);
  const [label, setLabel] = useState('');
  const [sound, setSound] = useState<SoundId>(defaultSound);
  const ms = ((h * 60 + m) * 60 + s) * 1000;
  const num = (v: string, max: number) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
  return (
    <Modal
      title="New timer"
      onClose={onClose}
      actions={
        <button className="btn primary" disabled={ms <= 0} onClick={() => onCreate(ms, label || formatDuration(ms), sound)}>
          <IcPlay size={16} /> Start
        </button>
      }
    >
      <div className="hms">
        <input type="number" inputMode="numeric" min={0} max={99} value={h} onChange={(e) => setH(num(e.target.value, 99))} aria-label="Hours" />
        <span>h</span>
        <input type="number" inputMode="numeric" min={0} max={59} value={m} onChange={(e) => setM(num(e.target.value, 59))} aria-label="Minutes" />
        <span>m</span>
        <input type="number" inputMode="numeric" min={0} max={59} value={s} onChange={(e) => setS(num(e.target.value, 59))} aria-label="Seconds" />
        <span>s</span>
      </div>
      <label className="field">
        Label
        <input type="text" placeholder="Pasta, Laundry, Focus…" value={label} onChange={(e) => setLabel(e.target.value)} />
      </label>
      <label className="field">
        Sound
        <select value={sound} onChange={(e) => setSound(e.target.value as SoundId)}>
          {SOUNDS.map((x) => (
            <option key={x.id} value={x.id}>{x.name}</option>
          ))}
        </select>
      </label>
    </Modal>
  );
}
