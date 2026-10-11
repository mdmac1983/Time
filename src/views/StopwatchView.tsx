import { Empty } from '../components/ui';
import { IcFlag, IcPause, IcPlay, IcPlus, IcReset, IcStopwatch, IcTrash } from '../icons';
import { uid, useFrameNow } from '../lib/store';
import { formatDuration } from '../lib/time';
import { useApp } from '../state';
import type { Stopwatch } from '../types';

export const elapsedOf = (s: Stopwatch, now: number) => s.elapsed + (s.startedAt ? now - s.startedAt : 0);

export default function StopwatchView() {
  const { stopwatches, setStopwatches } = useApp();
  const running = stopwatches.some((s) => s.startedAt);
  const now = useFrameNow(running);

  const update = (id: string, fn: (s: Stopwatch) => Stopwatch) => setStopwatches((l) => l.map((s) => (s.id === id ? fn(s) : s)));
  const add = () => setStopwatches((l) => [...l, { id: uid(), label: `Stopwatch ${l.length + 1}`, startedAt: null, elapsed: 0, laps: [] }]);

  return (
    <div className="page">
      {stopwatches.length === 0 && (
        <div className="card">
          <Empty icon={<IcStopwatch size={64} />} title="No stopwatches" hint="Run several at once — each with its own laps." action={<button className="btn primary" onClick={add}><IcPlus size={18} /> New stopwatch</button>} />
        </div>
      )}
      <div className="grid">
        {stopwatches.map((s) => {
          const el = elapsedOf(s, Math.max(now, Date.now()));
          const [main, cs] = formatDuration(el, true).split('.');
          const splits = s.laps.map((l, i) => l - (i ? s.laps[i - 1] : 0));
          const best = splits.length > 1 ? Math.min(...splits) : -1;
          const worst = splits.length > 1 ? Math.max(...splits) : -1;
          return (
            <div className="card stack" key={s.id}>
              <div className="row">
                <input
                  type="text"
                  value={s.label}
                  onChange={(e) => update(s.id, (x) => ({ ...x, label: e.target.value }))}
                  style={{ background: 'transparent', border: 0, fontWeight: 700, padding: '4px 0', boxShadow: 'none' }}
                  aria-label="Stopwatch name"
                />
                <button className="iconbtn danger" aria-label="Delete stopwatch" onClick={() => setStopwatches((l) => l.filter((x) => x.id !== s.id))}>
                  <IcTrash size={18} />
                </button>
              </div>
              <div className="sw-time">
                {main}
                <span className="cs">.{cs}</span>
              </div>
              <div className="controls">
                <button
                  className="round"
                  aria-label={s.startedAt ? 'Lap' : 'Reset'}
                  disabled={!s.startedAt && el === 0}
                  onClick={() =>
                    update(s.id, (x) =>
                      x.startedAt ? { ...x, laps: [...x.laps, elapsedOf(x, Date.now())] } : { ...x, elapsed: 0, laps: [] },
                    )
                  }
                >
                  {s.startedAt ? <IcFlag size={22} /> : <IcReset size={22} />}
                </button>
                <button
                  className="round primary"
                  style={{ width: 72, height: 72 }}
                  aria-label={s.startedAt ? 'Pause' : 'Start'}
                  onClick={() =>
                    update(s.id, (x) =>
                      x.startedAt ? { ...x, elapsed: elapsedOf(x, Date.now()), startedAt: null } : { ...x, startedAt: Date.now() },
                    )
                  }
                >
                  {s.startedAt ? <IcPause size={28} /> : <IcPlay size={28} />}
                </button>
              </div>
              {s.laps.length > 0 && (
                <div className="laps">
                  <div className="lap muted small" style={{ borderBottomStyle: 'solid' }}>
                    <span>Lap</span>
                    <span>Split</span>
                    <span style={{ textAlign: 'right' }}>Total</span>
                  </div>
                  {s.laps
                    .map((l, i) => ({ l, i, split: splits[i] }))
                    .reverse()
                    .map(({ l, i, split }) => (
                      <div key={i} className={`lap ${split === best ? 'best' : split === worst ? 'worst' : ''}`}>
                        <span>#{i + 1}</span>
                        <span>{formatDuration(split, true)}</span>
                        <span style={{ textAlign: 'right' }}>{formatDuration(l, true)}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button className="fab" aria-label="New stopwatch" onClick={add}>
        <IcPlus size={28} />
      </button>
    </div>
  );
}
