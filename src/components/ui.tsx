import { useEffect, type ReactNode } from 'react';
import { IcClose } from '../icons';

export function Modal({ title, onClose, children, actions }: { title: string; onClose: () => void; children: ReactNode; actions?: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="iconbtn" onClick={onClose} aria-label="Close">
            <IcClose size={20} />
          </button>
        </div>
        {children}
        {actions && <div className="row" style={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>{actions}</div>}
      </div>
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="switch" aria-label={label}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span />
    </label>
  );
}

export function Seg<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="seg" role="tablist">
      {options.map((o) => (
        <button key={o.id} className={o.id === value ? 'on' : ''} onClick={() => onChange(o.id)} role="tab" aria-selected={o.id === value}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Empty({ icon, title, hint, action }: { icon: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      {icon}
      <strong style={{ color: 'var(--text)' }}>{title}</strong>
      {hint && <span className="small">{hint}</span>}
      {action}
    </div>
  );
}

export function AnalogClock({ date, size = 220, showSeconds = true, small = false }: { date: Date; size?: number; showSeconds?: boolean; small?: boolean }) {
  const s = date.getSeconds() + date.getMilliseconds() / 1000;
  const m = date.getMinutes() + s / 60;
  const h = (date.getHours() % 12) + m / 60;
  const hand = (deg: number, len: number, w: number, cls: string, tail = 0) => (
    <line x1="100" y1={100 + tail} x2="100" y2={100 - len} strokeWidth={w} strokeLinecap="round" className={cls} transform={`rotate(${deg} 100 100)`} />
  );
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className="analog" aria-label={date.toLocaleTimeString()}>
      <defs>
        <radialGradient id="face" cx="50%" cy="35%" r="70%">
          <stop offset="0" stopColor="var(--surface2)" />
          <stop offset="1" stopColor="var(--surface)" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="96" fill="url(#face)" stroke="var(--border)" strokeWidth="2" />
      <circle cx="100" cy="100" r="88" fill="none" stroke="var(--accent)" strokeOpacity="0.25" strokeWidth="1" />
      {Array.from({ length: 60 }, (_, i) => {
        const major = i % 5 === 0;
        if (small && !major) return null;
        return (
          <line
            key={i}
            x1="100"
            y1={major ? 14 : 16}
            x2="100"
            y2={major ? 26 : 21}
            stroke={major ? 'var(--text)' : 'var(--muted)'}
            strokeWidth={major ? 3 : 1.2}
            strokeLinecap="round"
            transform={`rotate(${i * 6} 100 100)`}
            opacity={major ? 0.9 : 0.5}
          />
        );
      })}
      {!small &&
        [12, 3, 6, 9].map((n, i) => {
          const a = (i * 90 * Math.PI) / 180;
          return (
            <text key={n} x={100 + Math.sin(a) * 60} y={100 - Math.cos(a) * 60 + 7} textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--text)" style={{ fontFamily: 'var(--font-display)' }}>
              {n}
            </text>
          );
        })}
      <g stroke="var(--text)">{hand(h * 30, 48, 7, '', 10)}</g>
      <g stroke="var(--text)">{hand(m * 6, 70, 4.5, '', 12)}</g>
      {showSeconds && <g stroke="var(--accent)">{hand(s * 6, 78, 2, '', 20)}</g>}
      <circle cx="100" cy="100" r="6" fill="var(--accent)" />
      <circle cx="100" cy="100" r="2.5" fill="var(--surface)" />
    </svg>
  );
}

export function Toast({ text }: { text: string }) {
  return <div className="toast">{text}</div>;
}
