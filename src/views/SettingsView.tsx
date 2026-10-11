import { useRef } from 'react';
import { Seg, Switch } from '../components/ui';
import { AppMark, IcBell, IcDownload, IcPalette, IcUpload } from '../icons';
import { CATEGORY_LABELS, REGION_LABELS } from '../lib/holidays';
import { isNative, requestNotifyPermission } from '../lib/notify';
import { playSound, SOUNDS } from '../lib/sound';
import { exportAll, importAll } from '../lib/store';
import { useApp } from '../state';
import { THEMES } from '../themes';
import type { HolidayCategory, RegionId, Settings, SoundId } from '../types';

export default function SettingsView() {
  const { settings, setSettings, toast } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (p: Partial<Settings>) => setSettings((s) => ({ ...s, ...p }));
  const toggleIn = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const doExport = () => {
    const blob = new Blob([exportAll()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `time-hub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const doImport = async (f: File) => {
    try {
      importAll(await f.text());
      toast('Backup restored — reloading…');
      setTimeout(() => location.reload(), 800);
    } catch (e) {
      toast((e as Error).message || 'Could not read that file');
    }
  };

  return (
    <div className="page">
      <section className="card">
        <div className="card-title"><IcPalette size={22} /><h2>Theme</h2></div>
        <div className="themes">
          {THEMES.map((t) => (
            <button key={t.id} className={`theme-card ${settings.theme === t.id ? 'on' : ''}`} onClick={() => set({ theme: t.id })}>
              <div className="prev" style={{ background: `linear-gradient(135deg, ${t.swatch[0]} 55%, ${t.swatch[1]} 140%)` }}>
                <i style={{ background: t.swatch[1] }} />
                <i style={{ background: t.swatch[2] }} />
              </div>
              <div className="nm">
                {t.name}
                <small>{t.desc}</small>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-title"><h2>Clock</h2></div>
        <div className="setrow">
          <div className="grow">Clock face</div>
          <Seg value={settings.clockFace} onChange={(v) => set({ clockFace: v })} options={[{ id: 'analog', label: 'Analog' }, { id: 'digital', label: 'Digital' }, { id: 'both', label: 'Both' }]} />
        </div>
        <div className="setrow">
          <div className="grow">24-hour time</div>
          <Switch checked={settings.use24h} onChange={(v) => set({ use24h: v })} />
        </div>
        <div className="setrow">
          <div className="grow">Show seconds</div>
          <Switch checked={settings.showSeconds} onChange={(v) => set({ showSeconds: v })} />
        </div>
        <div className="setrow">
          <div className="grow">Week starts on</div>
          <Seg value={String(settings.weekStart) as '0' | '1'} onChange={(v) => set({ weekStart: Number(v) as 0 | 1 })} options={[{ id: '0', label: 'Sunday' }, { id: '1', label: 'Monday' }]} />
        </div>
        <div className="setrow">
          <div className="grow">Default alarm & timer sound</div>
          <select
            value={settings.defaultSound}
            style={{ width: 'auto' }}
            onChange={(e) => {
              const id = e.target.value as SoundId;
              set({ defaultSound: id });
              const stop = playSound(id);
              setTimeout(stop, 2000);
            }}
          >
            {SOUNDS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </section>

      <section className="card">
        <div className="card-title"><h2>Holidays</h2></div>
        <div className="small muted" style={{ marginBottom: 6 }}>Countries</div>
        <div className="chips" style={{ marginBottom: 12 }}>
          {(Object.keys(REGION_LABELS) as RegionId[]).map((r) => (
            <button key={r} className={`chip ${settings.regions.includes(r) ? 'on' : ''}`} onClick={() => set({ regions: toggleIn(settings.regions, r) })}>
              {REGION_LABELS[r]}
            </button>
          ))}
        </div>
        <div className="small muted" style={{ marginBottom: 6 }}>Show on calendar</div>
        <div className="chips">
          {(Object.keys(CATEGORY_LABELS) as HolidayCategory[]).map((c) => (
            <button key={c} className={`chip ${settings.holidayCats.includes(c) ? 'on' : ''}`} onClick={() => set({ holidayCats: toggleIn(settings.holidayCats, c) })}>
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-title"><IcBell size={22} /><h2>Notifications</h2></div>
        <p className="small muted" style={{ marginTop: 0 }}>
          {isNative()
            ? 'Alarms, timers and save-the-date reminders are scheduled with Android so they ring even when the app is closed.'
            : 'In the browser, alarms and timers ring while Time Hub is open (even in a background tab). Install the Android app for alarms that ring when closed.'}
        </p>
        <button className="btn" onClick={async () => toast((await requestNotifyPermission()) ? 'Notifications enabled' : 'Notifications are blocked — check system settings')}>
          <IcBell size={18} /> Enable notifications
        </button>
      </section>

      <section className="card">
        <div className="card-title"><h2>Backup</h2></div>
        <p className="small muted" style={{ marginTop: 0 }}>Everything is stored privately on this device. Export a backup to move it to another device.</p>
        <div className="row wrap">
          <button className="btn" onClick={doExport}><IcDownload size={18} /> Export backup</button>
          <button className="btn" onClick={() => fileRef.current?.click()}><IcUpload size={18} /> Restore backup</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
        </div>
      </section>

      <section className="card row">
        <AppMark size={52} />
        <div className="grow">
          <strong>Time Hub</strong>
          <div className="small muted">Version {__APP_VERSION__} · Clock · Alarms · Stopwatch · Timers · Calendar · To-do · Journal · Save the Date</div>
        </div>
      </section>
    </div>
  );
}
