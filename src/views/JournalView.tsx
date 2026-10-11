import { useEffect, useMemo, useState } from 'react';
import { Empty, Modal } from '../components/ui';
import { IcFire, IcJournal, IcPlus, IcSearch, IcTrash, MoodFace } from '../icons';
import { uid } from '../lib/store';
import { addDays, MONTHS, parseYmd, ymd } from '../lib/time';
import { useApp } from '../state';
import type { JournalEntry, Mood } from '../types';

const MOODS: { id: Mood; label: string }[] = [
  { id: 'great', label: 'Great' },
  { id: 'good', label: 'Good' },
  { id: 'okay', label: 'Okay' },
  { id: 'meh', label: 'Meh' },
  { id: 'rough', label: 'Rough' },
];

const PROMPTS = [
  'What made you smile today?',
  'What are three things you are grateful for?',
  'What did you learn today?',
  'What would make tomorrow great?',
  'Who made a difference in your day?',
  'What is something you are looking forward to?',
  'Describe a moment you want to remember.',
];

export default function JournalView() {
  const { journal, setJournal, intent, clearIntent } = useApp();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const today = ymd(new Date());

  const openFor = (date: string) => {
    const existing = journal.find((j) => j.date === date);
    setEditing(existing ?? { id: uid(), date, title: '', body: '', mood: 'good', updatedAt: Date.now() });
  };

  useEffect(() => {
    if (intent?.kind === 'journal') {
      openFor(intent.date);
      clearIntent();
    }
  }, [intent]);

  const sorted = [...journal].sort((a, b) => b.date.localeCompare(a.date));
  const shown = q ? sorted.filter((j) => (j.title + ' ' + j.body).toLowerCase().includes(q.toLowerCase())) : sorted;

  const streak = useMemo(() => {
    const set = new Set(journal.map((j) => j.date));
    let n = 0;
    let d = new Date();
    if (!set.has(ymd(d))) d = addDays(d, -1);
    while (set.has(ymd(d))) {
      n++;
      d = addDays(d, -1);
    }
    return n;
  }, [journal]);
  const words = journal.reduce((s, j) => s + (j.body.trim() ? j.body.trim().split(/\s+/).length : 0), 0);
  const prompt = PROMPTS[new Date().getDate() % PROMPTS.length];

  return (
    <div className="page">
      <div className="row">
        <div className="stat"><span className="v row" style={{ gap: 4 }}><span style={{ color: 'var(--warn)', display: 'flex' }}><IcFire size={22} /></span>{streak}</span><span className="l">Day streak</span></div>
        <div className="stat"><span className="v">{journal.length}</span><span className="l">Entries</span></div>
        <div className="stat"><span className="v">{words.toLocaleString()}</span><span className="l">Words</span></div>
      </div>

      <button className="card row" style={{ textAlign: 'left', cursor: 'pointer', color: 'inherit' }} onClick={() => openFor(today)}>
        <span style={{ color: 'var(--accent)' }}><IcJournal size={40} /></span>
        <div className="grow">
          <strong>{journal.some((j) => j.date === today) ? "Continue today's entry" : "Write today's entry"}</strong>
          <div className="small muted">{prompt}</div>
        </div>
      </button>

      <div className="card">
        <div className="row" style={{ marginBottom: 6 }}>
          <IcSearch size={20} />
          <input type="search" placeholder="Search your journal" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {shown.length === 0 ? (
          <Empty icon={<IcJournal size={56} />} title={q ? 'No matching entries' : 'Your journal is empty'} hint={q ? undefined : 'A few lines a day adds up to a story.'} />
        ) : (
          shown.map((j) => {
            const d = parseYmd(j.date);
            return (
              <div className="jentry" key={j.id} onClick={() => setEditing(j)}>
                <div className="date">
                  <div className="d">{d.getDate()}</div>
                  <div className="m">{MONTHS[d.getMonth()].slice(0, 3)} {String(d.getFullYear()).slice(2)}</div>
                </div>
                <div className="grow">
                  <div className="row" style={{ gap: 6 }}>
                    <MoodFace mood={j.mood} size={20} />
                    <strong className="ellipsis">{j.title || d.toLocaleDateString(undefined, { weekday: 'long' })}</strong>
                  </div>
                  <div className="snip">{j.body || 'No text'}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <button className="fab" aria-label="New journal entry" onClick={() => openFor(today)}>
        <IcPlus size={28} />
      </button>

      {editing && (
        <JournalEditor
          initial={editing}
          isNew={!journal.some((j) => j.id === editing.id)}
          onClose={() => setEditing(null)}
          onSave={(e) => {
            setJournal((l) => (l.some((x) => x.id === e.id) ? l.map((x) => (x.id === e.id ? e : x)) : [...l, e]));
            setEditing(null);
          }}
          onDelete={() => {
            setJournal((l) => l.filter((x) => x.id !== editing.id));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function JournalEditor({ initial, isNew, onClose, onSave, onDelete }: { initial: JournalEntry; isNew: boolean; onClose: () => void; onSave: (e: JournalEntry) => void; onDelete: () => void }) {
  const [e, setE] = useState(initial);
  const set = (p: Partial<JournalEntry>) => setE((x) => ({ ...x, ...p }));
  const words = e.body.trim() ? e.body.trim().split(/\s+/).length : 0;
  return (
    <Modal
      title={parseYmd(e.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
      onClose={onClose}
      actions={
        <>
          <span className="small muted grow">{words} words</span>
          {!isNew && <button className="btn danger" onClick={onDelete}><IcTrash size={18} /> Delete</button>}
          <button className="btn primary" disabled={!e.body.trim() && !e.title.trim()} onClick={() => onSave({ ...e, updatedAt: Date.now() })}>Save</button>
        </>
      }
    >
      <div className="field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span className="small muted" style={{ fontWeight: 600 }}>How was your day?</span>
        <div className="moods">
          {MOODS.map((m) => (
            <button key={m.id} className={e.mood === m.id ? 'on' : ''} onClick={() => set({ mood: m.id })}>
              <MoodFace mood={m.id} size={34} />
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <input type="text" placeholder="Title (optional)" value={e.title} onChange={(ev) => set({ title: ev.target.value })} />
      <textarea autoFocus style={{ minHeight: 220 }} placeholder="Dear diary…" value={e.body} onChange={(ev) => set({ body: ev.target.value })} />
      <label className="field">
        Date
        <input type="date" value={e.date} onChange={(ev) => ev.target.value && set({ date: ev.target.value })} />
      </label>
    </Modal>
  );
}
