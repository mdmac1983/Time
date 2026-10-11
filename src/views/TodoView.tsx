import { useEffect, useMemo, useState } from 'react';
import { Empty, Modal, Seg } from '../components/ui';
import { IcCheck, IcFlag, IcPlus, IcTodo, IcTrash } from '../icons';
import { uid } from '../lib/store';
import { addDays, daysBetween, parseYmd, ymd } from '../lib/time';
import { useApp } from '../state';
import type { Priority, Todo } from '../types';

type Filter = 'all' | 'today' | 'upcoming' | 'overdue' | 'done';
const PRIO_RANK: Record<Priority, number> = { high: 0, normal: 1, low: 2 };

function dueLabel(due: string) {
  const n = daysBetween(new Date(), parseYmd(due));
  if (n === 0) return { text: 'Today', cls: 'warn' };
  if (n === 1) return { text: 'Tomorrow', cls: '' };
  if (n === -1) return { text: 'Yesterday', cls: 'danger' };
  if (n < 0) return { text: `${-n}d overdue`, cls: 'danger' };
  if (n < 7) return { text: parseYmd(due).toLocaleDateString(undefined, { weekday: 'long' }), cls: '' };
  return { text: parseYmd(due).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), cls: '' };
}

export default function TodoView() {
  const { todos, setTodos, intent, clearIntent } = useApp();
  const [filter, setFilter] = useState<Filter>('all');
  const [list, setList] = useState<string>('All lists');
  const [text, setText] = useState('');
  const [editing, setEditing] = useState<Todo | null>(null);
  const today = ymd(new Date());

  const lists = useMemo(() => Array.from(new Set(['Personal', 'Work', 'Shopping', ...todos.map((t) => t.list)])), [todos]);

  const blank = (due: string | null = null): Todo => ({
    id: uid(),
    title: '',
    notes: '',
    due,
    priority: 'normal',
    done: false,
    list: list === 'All lists' ? 'Personal' : list,
    createdAt: Date.now(),
  });

  useEffect(() => {
    if (intent?.kind === 'newTodo') {
      setEditing(blank(intent.due));
      clearIntent();
    }
  }, [intent]);

  const quickAdd = () => {
    const title = text.trim();
    if (!title) return;
    // Light natural-language: "... today" / "... tomorrow" / "!" for high priority.
    let due: string | null = filter === 'today' ? today : null;
    let t = title;
    if (/\btoday$/i.test(t)) { due = today; t = t.replace(/\s*today$/i, ''); }
    else if (/\btomorrow$/i.test(t)) { due = ymd(addDays(new Date(), 1)); t = t.replace(/\s*tomorrow$/i, ''); }
    const priority: Priority = t.endsWith('!') ? 'high' : 'normal';
    t = t.replace(/!+$/, '').trim();
    setTodos((l) => [{ ...blank(due), title: t || title, priority }, ...l]);
    setText('');
  };

  const shown = todos
    .filter((t) => list === 'All lists' || t.list === list)
    .filter((t) => {
      switch (filter) {
        case 'today': return !t.done && t.due != null && t.due <= today;
        case 'upcoming': return !t.done && t.due != null && t.due > today;
        case 'overdue': return !t.done && t.due != null && t.due < today;
        case 'done': return t.done;
        default: return true;
      }
    })
    .sort((a, b) => Number(a.done) - Number(b.done) || (a.due ?? '9999').localeCompare(b.due ?? '9999') || PRIO_RANK[a.priority] - PRIO_RANK[b.priority] || b.createdAt - a.createdAt);

  const doneCount = todos.filter((t) => t.done).length;
  const toggle = (id: string) => setTodos((l) => l.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  return (
    <div className="page">
      <div className="card stack">
        <div className="addbar">
          <input
            type="text"
            placeholder='Add a task… (try "Call mom tomorrow" or "Pay rent!")'
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && quickAdd()}
          />
          <button className="btn primary" onClick={quickAdd} aria-label="Add task"><IcPlus size={18} /></button>
        </div>
        <div className="row wrap spread">
          <Seg
            value={filter}
            onChange={setFilter}
            options={[
              { id: 'all', label: 'All' },
              { id: 'today', label: 'Today' },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'overdue', label: 'Overdue' },
              { id: 'done', label: 'Done' },
            ]}
          />
          <select value={list} onChange={(e) => setList(e.target.value)} style={{ width: 'auto' }} aria-label="List">
            <option>All lists</option>
            {lists.map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        {shown.length === 0 ? (
          <Empty icon={<IcTodo size={64} />} title={filter === 'done' ? 'Nothing completed yet' : 'Nothing to do here'} hint="Add a task above — set due dates to see them on your calendar." />
        ) : (
          <div>
            {shown.map((t) => {
              const dl = t.due ? dueLabel(t.due) : null;
              return (
                <div key={t.id} className={`todo ${t.done ? 'done' : ''}`}>
                  <button className={`check p-${t.priority} ${t.done ? 'on' : ''}`} onClick={() => toggle(t.id)} aria-label={t.done ? 'Mark not done' : 'Mark done'}>
                    <IcCheck size={16} />
                  </button>
                  <div className="grow" onClick={() => setEditing(t)}>
                    <div className="title">{t.title}</div>
                    {t.notes && <div className="small muted ellipsis">{t.notes}</div>}
                    <div className="row" style={{ gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                      {dl && !t.done && <span className={`tag ${dl.cls}`}>{dl.text}</span>}
                      {t.priority === 'high' && <span className="tag danger"><IcFlag size={12} /> High</span>}
                      <span className="tag alt">{t.list}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {doneCount > 0 && (
          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn sm ghost danger" onClick={() => setTodos((l) => l.filter((t) => !t.done))}>
              <IcTrash size={16} /> Clear {doneCount} completed
            </button>
          </div>
        )}
      </div>

      <button className="fab" aria-label="New task" onClick={() => setEditing(blank(filter === 'today' ? today : null))}>
        <IcPlus size={28} />
      </button>

      {editing && (
        <TodoEditor
          initial={editing}
          lists={lists}
          isNew={!todos.some((t) => t.id === editing.id)}
          onClose={() => setEditing(null)}
          onSave={(t) => {
            setTodos((l) => (l.some((x) => x.id === t.id) ? l.map((x) => (x.id === t.id ? t : x)) : [t, ...l]));
            setEditing(null);
          }}
          onDelete={() => {
            setTodos((l) => l.filter((x) => x.id !== editing.id));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function TodoEditor({ initial, lists, isNew, onClose, onSave, onDelete }: { initial: Todo; lists: string[]; isNew: boolean; onClose: () => void; onSave: (t: Todo) => void; onDelete: () => void }) {
  const [t, setT] = useState(initial);
  const [newList, setNewList] = useState('');
  const set = (p: Partial<Todo>) => setT((x) => ({ ...x, ...p }));
  return (
    <Modal
      title={isNew ? 'New task' : 'Edit task'}
      onClose={onClose}
      actions={
        <>
          {!isNew && <button className="btn danger" onClick={onDelete}><IcTrash size={18} /> Delete</button>}
          <button className="btn primary" disabled={!t.title.trim()} onClick={() => onSave({ ...t, title: t.title.trim(), list: newList.trim() || t.list })}>Save</button>
        </>
      }
    >
      <label className="field">
        Task
        <input type="text" autoFocus value={t.title} onChange={(e) => set({ title: e.target.value })} />
      </label>
      <div className="row">
        <label className="field grow">
          Due date
          <input type="date" value={t.due ?? ''} onChange={(e) => set({ due: e.target.value || null })} />
        </label>
        <label className="field grow">
          Priority
          <select value={t.priority} onChange={(e) => set({ priority: e.target.value as Priority })}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </label>
      </div>
      <div className="chips">
        <button className="chip" onClick={() => set({ due: ymd(new Date()) })}>Today</button>
        <button className="chip" onClick={() => set({ due: ymd(addDays(new Date(), 1)) })}>Tomorrow</button>
        <button className="chip" onClick={() => set({ due: ymd(addDays(new Date(), 7)) })}>Next week</button>
        <button className="chip" onClick={() => set({ due: null })}>No date</button>
      </div>
      <div className="row">
        <label className="field grow">
          List
          <select value={t.list} onChange={(e) => set({ list: e.target.value })}>
            {lists.map((l) => <option key={l}>{l}</option>)}
          </select>
        </label>
        <label className="field grow">
          …or new list
          <input type="text" placeholder="e.g. Errands" value={newList} onChange={(e) => setNewList(e.target.value)} />
        </label>
      </div>
      <label className="field">
        Notes
        <textarea style={{ minHeight: 70 }} value={t.notes} onChange={(e) => set({ notes: e.target.value })} />
      </label>
    </Modal>
  );
}
