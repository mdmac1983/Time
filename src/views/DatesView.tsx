import { useEffect, useState } from 'react';
import { Empty, Modal, Seg, Switch } from '../components/ui';
import { IcCandle, IcDates, IcGift, IcHeart, IcPlus, IcRings, IcStar, IcTrash } from '../icons';
import { uid } from '../lib/store';
import { daysBetween, MONTHS, ordinal, startOfDay } from '../lib/time';
import { useApp } from '../state';
import type { SaveDate, SaveDateKind } from '../types';

export const KINDS: { id: SaveDateKind; label: string; Icon: typeof IcGift }[] = [
  { id: 'birthday', label: 'Birthday', Icon: IcGift },
  { id: 'anniversary', label: 'Anniversary', Icon: IcRings },
  { id: 'event', label: 'Big day', Icon: IcStar },
  { id: 'memorial', label: 'Memorial', Icon: IcCandle },
  { id: 'other', label: 'Other', Icon: IcHeart },
];
export const kindIcon = (k: SaveDateKind) => KINDS.find((x) => x.id === k)!.Icon;

/** Next date (today or later) this save-the-date occurs; null if a one-off date has passed. */
export function nextOccurrence(sd: SaveDate, from: Date): Date | null {
  const today = startOfDay(from);
  if (!sd.recurring) {
    if (!sd.year) return null;
    const d = new Date(sd.year, sd.month - 1, sd.day);
    return d >= today ? d : null;
  }
  for (const y of [today.getFullYear(), today.getFullYear() + 1, today.getFullYear() + 2]) {
    // Feb 29 birthdays are celebrated Feb 28 in non-leap years.
    let d = new Date(y, sd.month - 1, sd.day);
    if (d.getMonth() !== sd.month - 1) d = new Date(y, sd.month - 1, sd.day - 1);
    if (d >= today) return d;
  }
  return null;
}

export function milestone(sd: SaveDate, occ: Date) {
  if (!sd.year || !sd.recurring) return '';
  const n = occ.getFullYear() - sd.year;
  if (n <= 0) return '';
  if (sd.kind === 'birthday') return `Turns ${n}`;
  if (sd.kind === 'anniversary') return `${ordinal(n)} anniversary`;
  return `${n} year${n === 1 ? '' : 's'}`;
}

export default function DatesView() {
  const { dates, setDates, intent, clearIntent } = useApp();
  const [editing, setEditing] = useState<SaveDate | null>(null);
  const [filter, setFilter] = useState<'all' | SaveDateKind>('all');
  const now = new Date();

  const blank = (month = now.getMonth() + 1, day = now.getDate()): SaveDate => ({
    id: uid(),
    kind: 'birthday',
    name: '',
    month,
    day,
    year: null,
    recurring: true,
    remindDays: 1,
    notes: '',
  });

  useEffect(() => {
    if (intent?.kind === 'newDate') {
      setEditing(blank(intent.month, intent.day));
      clearIntent();
    }
  }, [intent]);

  const items = dates
    .filter((d) => filter === 'all' || d.kind === filter)
    .map((d) => ({ d, occ: nextOccurrence(d, now) }))
    .sort((a, b) => (a.occ ? a.occ.getTime() : Infinity) - (b.occ ? b.occ.getTime() : Infinity));

  const upcoming = items.filter((x) => x.occ && daysBetween(now, x.occ) <= 30);
  const later = items.filter((x) => !x.occ || daysBetween(now, x.occ) > 30);

  const Row = ({ d, occ }: { d: SaveDate; occ: Date | null }) => {
    const days = occ ? daysBetween(now, occ) : null;
    const Icon = kindIcon(d.kind);
    return (
      <div className="sdate" onClick={() => setEditing(d)}>
        <div className={`countdown ${days === 0 ? 'today' : ''}`}>
          {days === 0 ? (
            <>
              <span className="v">🎉</span>
              <span className="l">Today</span>
            </>
          ) : days != null ? (
            <>
              <span className="v">{days}</span>
              <span className="l">{days === 1 ? 'day' : 'days'}</span>
            </>
          ) : (
            <span className="l">Past</span>
          )}
        </div>
        <div className="grow">
          <div className="row" style={{ gap: 6 }}>
            <span className="kind-ic"><Icon size={18} /></span>
            <strong className="ellipsis">{d.name || 'Untitled'}</strong>
          </div>
          <div className="small muted">
            {occ ? occ.toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: occ.getFullYear() !== now.getFullYear() ? 'numeric' : undefined }) : `${MONTHS[d.month - 1]} ${d.day}, ${d.year}`}
          </div>
          {occ && milestone(d, occ) && <span className="tag alt" style={{ marginTop: 4 }}>{milestone(d, occ)}</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="page">
      <Seg
        value={filter}
        onChange={setFilter}
        options={[{ id: 'all', label: 'All' }, ...KINDS.map((k) => ({ id: k.id, label: k.label + 's' }))] as { id: 'all' | SaveDateKind; label: string }[]}
      />
      {dates.length === 0 ? (
        <div className="card">
          <Empty icon={<IcDates size={64} />} title="Never miss a special day" hint="Save birthdays, anniversaries and big days. You'll get a countdown and a reminder." action={<button className="btn primary" onClick={() => setEditing(blank())}><IcPlus size={18} /> Save a date</button>} />
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="card">
              <div className="card-title"><h2>Coming up · next 30 days</h2></div>
              <div className="list">{upcoming.map((x) => <Row key={x.d.id} {...x} />)}</div>
            </div>
          )}
          {later.length > 0 && (
            <div className="card">
              <div className="card-title"><h2>Later</h2></div>
              <div className="list">{later.map((x) => <Row key={x.d.id} {...x} />)}</div>
            </div>
          )}
        </>
      )}
      <button className="fab" aria-label="Save a date" onClick={() => setEditing(blank())}>
        <IcPlus size={28} />
      </button>
      {editing && (
        <DateEditor
          initial={editing}
          isNew={!dates.some((d) => d.id === editing.id)}
          onClose={() => setEditing(null)}
          onSave={(d) => {
            setDates((l) => (l.some((x) => x.id === d.id) ? l.map((x) => (x.id === d.id ? d : x)) : [...l, d]));
            setEditing(null);
          }}
          onDelete={() => {
            setDates((l) => l.filter((x) => x.id !== editing.id));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function DateEditor({ initial, isNew, onClose, onSave, onDelete }: { initial: SaveDate; isNew: boolean; onClose: () => void; onSave: (d: SaveDate) => void; onDelete: () => void }) {
  const [d, setD] = useState(initial);
  const set = (p: Partial<SaveDate>) => setD((x) => ({ ...x, ...p }));
  const daysInMonth = new Date(2024, d.month, 0).getDate();
  return (
    <Modal
      title={isNew ? 'Save the date' : 'Edit date'}
      onClose={onClose}
      actions={
        <>
          {!isNew && <button className="btn danger" onClick={onDelete}><IcTrash size={18} /> Delete</button>}
          <button className="btn primary" disabled={!d.name.trim() || (!d.recurring && !d.year)} onClick={() => onSave({ ...d, name: d.name.trim() })}>Save</button>
        </>
      }
    >
      <div className="kinds">
        {KINDS.map(({ id, label, Icon }) => (
          <button key={id} className={d.kind === id ? 'on' : ''} onClick={() => set({ kind: id })}>
            <Icon size={26} />
            {label}
          </button>
        ))}
      </div>
      <label className="field">
        {d.kind === 'birthday' ? "Whose birthday?" : d.kind === 'anniversary' ? 'Anniversary of…' : 'Name'}
        <input type="text" autoFocus value={d.name} placeholder={d.kind === 'birthday' ? 'Mom' : d.kind === 'anniversary' ? 'Our wedding' : 'Graduation'} onChange={(e) => set({ name: e.target.value })} />
      </label>
      <div className="row">
        <label className="field grow">
          Month
          <select value={d.month} onChange={(e) => set({ month: Number(e.target.value), day: Math.min(d.day, new Date(2024, Number(e.target.value), 0).getDate()) })}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </label>
        <label className="field" style={{ width: 90 }}>
          Day
          <select value={d.day} onChange={(e) => set({ day: Number(e.target.value) })}>
            {Array.from({ length: daysInMonth }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
          </select>
        </label>
        <label className="field" style={{ width: 110 }}>
          Year {d.recurring && <span className="small">(optional)</span>}
          <input type="number" inputMode="numeric" placeholder="YYYY" value={d.year ?? ''} onChange={(e) => set({ year: e.target.value ? Number(e.target.value) : null })} />
        </label>
      </div>
      <div className="setrow">
        <div className="grow">
          Repeats every year
          <small>{d.year && d.recurring ? 'Shows ages & milestones' : 'Add a year to see ages & milestones'}</small>
        </div>
        <Switch checked={d.recurring} onChange={(v) => set({ recurring: v })} />
      </div>
      <label className="field">
        Remind me
        <select value={d.remindDays} onChange={(e) => set({ remindDays: Number(e.target.value) })}>
          <option value={0}>On the day</option>
          <option value={1}>1 day before</option>
          <option value={3}>3 days before</option>
          <option value={7}>1 week before</option>
          <option value={14}>2 weeks before</option>
          <option value={30}>1 month before</option>
        </select>
      </label>
      <label className="field">
        Notes & gift ideas
        <textarea style={{ minHeight: 70 }} value={d.notes} onChange={(e) => set({ notes: e.target.value })} />
      </label>
    </Modal>
  );
}
