// Hand-drawn duotone icon set. Strokes use currentColor; the accent layer
// (.ia) is filled with the theme's --icon-fill so icons recolor per theme.
import type { ReactNode, SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 24, children, ...rest }: P & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** World clock: dial with a globe meridian and an orbiting sun. */
export const IcClock = (p: P) => (
  <Svg {...p}>
    <circle className="ia" cx="16" cy="17" r="11.5" stroke="none" />
    <circle cx="16" cy="17" r="11.5" />
    <path d="M16 5.5c-4 3.2-4 19.8 0 23" strokeWidth={1.2} opacity={0.45} />
    <path d="M5 14.5h22M5 19.5h22" strokeWidth={1.2} opacity={0.35} />
    <path d="M16 17V10.5M16 17l4.5 2.6" strokeWidth={2.4} />
    <circle cx="16" cy="17" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="26.5" cy="6" r="2.6" className="ia-solid" stroke="none" />
  </Svg>
);

/** Twin-bell alarm clock with legs and ring waves. */
export const IcAlarm = (p: P) => (
  <Svg {...p}>
    <path className="ia" stroke="none" d="M16 7a10.5 10.5 0 1 1 0 21a10.5 10.5 0 0 1 0-21z" />
    <circle cx="16" cy="17.5" r="10.5" />
    <path d="M3.6 9.2a5 5 0 0 1 6-5.6M28.4 9.2a5 5 0 0 0-6-5.6" strokeWidth={2.4} />
    <path d="M8.5 26.5L6.5 29M23.5 26.5l2 2.5" />
    <path d="M16 12v5.5l3.5 2" strokeWidth={2.4} />
    <path d="M1.5 15.5h1.4M29.1 15.5h1.4" opacity={0.6} />
  </Svg>
);

/** Stopwatch with crown, side button and an elapsed-time wedge. */
export const IcStopwatch = (p: P) => (
  <Svg {...p}>
    <path className="ia-solid" stroke="none" d="M16 18.5V9a9.5 9.5 0 0 1 8.2 4.7z" opacity={0.85} />
    <circle cx="16" cy="18.5" r="10.5" />
    <path d="M13 3h6M16 3v5" strokeWidth={2.4} />
    <path d="M24.6 8.6l1.9-1.9" strokeWidth={2.4} />
    <path d="M16 18.5l4-6" strokeWidth={2.2} />
    <path d="M16 26.3v1.2M8.2 18.5H7M24.9 18.5h-1.2" strokeWidth={1.4} opacity={0.6} />
    <circle cx="16" cy="18.5" r="1.5" fill="currentColor" stroke="none" />
  </Svg>
);

/** Hourglass with falling sand. */
export const IcTimer = (p: P) => (
  <Svg {...p}>
    <path className="ia-solid" stroke="none" d="M10.5 26.5c0-3 2.6-4.6 5.5-5.6c2.9 1 5.5 2.6 5.5 5.6z" />
    <path className="ia" stroke="none" d="M11.5 9.5h9c-.6 2.2-2.4 3.6-4.5 4.8c-2.1-1.2-3.9-2.6-4.5-4.8z" />
    <path d="M7 3.5h18M7 28.5h18" strokeWidth={2.4} />
    <path d="M9.5 3.5c0 6 2.5 9 6.5 12.5c4-3.5 6.5-6.5 6.5-12.5M9.5 28.5c0-6 2.5-9 6.5-12.5c4 3.5 6.5 6.5 6.5 12.5" />
    <path d="M16 16.5v3.5" strokeWidth={1.4} strokeDasharray="1 1.6" />
  </Svg>
);

/** Calendar page with binder rings and a highlighted date. */
export const IcCalendar = (p: P) => (
  <Svg {...p}>
    <path className="ia" stroke="none" d="M4.5 9a3 3 0 0 1 3-3h17a3 3 0 0 1 3 3v3.5h-23z" />
    <rect x="4.5" y="6" width="23" height="22" rx="3" />
    <path d="M4.5 12.5h23" />
    <path d="M10.5 3.5v5M21.5 3.5v5" strokeWidth={2.6} />
    <circle cx="21" cy="21.5" r="3.2" className="ia-solid" stroke="none" />
    <path d="M9.5 17.5h.01M14 17.5h.01M18.5 17.5h.01M23 17.5h.01M9.5 22h.01M14 22h.01" strokeWidth={2.6} />
  </Svg>
);

/** Clipboard checklist. */
export const IcTodo = (p: P) => (
  <Svg {...p}>
    <path className="ia" stroke="none" d="M7 7.5h18v19a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" />
    <path d="M11 5.5H9a2 2 0 0 0-2 2v19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-19a2 2 0 0 0-2-2h-2" />
    <rect x="11" y="3.5" width="10" height="4" rx="1.5" />
    <path d="M10.5 13.5l1.6 1.6l3-3.2M10.5 19.5l1.6 1.6l3-3.2" strokeWidth={1.9} />
    <path d="M18 14h3.5M18 20h3.5" />
    <rect x="10.5" y="23.5" width="3.5" height="3" rx="0.8" strokeWidth={1.5} />
    <path d="M18 25h3.5" opacity={0.5} />
  </Svg>
);

/** Notebook with ribbon bookmark and pen. */
export const IcJournal = (p: P) => (
  <Svg {...p}>
    <path className="ia" stroke="none" d="M8 3.5h14a2 2 0 0 1 2 2v21a2 2 0 0 1-2 2H8z" />
    <path d="M8 3.5h14a2 2 0 0 1 2 2v21a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-21a2 2 0 0 1 2-2z" />
    <path d="M10.5 3.5v25" />
    <path className="ia-solid" stroke="none" d="M18 3.5h3.5v8l-1.75-1.5L18 11.5z" />
    <path d="M13.5 15.5h6M13.5 19.5h4" strokeWidth={1.6} opacity={0.7} />
    <path d="M29 12.5l-8.5 8.5l-2.5.8l.8-2.5l8.5-8.5a1.2 1.2 0 0 1 1.7 1.7z" strokeWidth={1.7} fill="var(--surface, #fff)" />
  </Svg>
);

/** Layered cake with a lit candle — birthdays, anniversaries, big days. */
export const IcDates = (p: P) => (
  <Svg {...p}>
    <path className="ia-solid" stroke="none" d="M16 2.5c1.6 1.8 2.2 3 2.2 4a2.2 2.2 0 0 1-4.4 0c0-1 .6-2.2 2.2-4z" />
    <path d="M16 9v4" strokeWidth={2.2} />
    <path className="ia" stroke="none" d="M6 17.5h20v10H6z" />
    <rect x="8" y="13" width="16" height="4.5" rx="1.5" />
    <path d="M5 28.5h22M6 28.5V19a1.5 1.5 0 0 1 1.5-1.5h17A1.5 1.5 0 0 1 26 19v9.5" />
    <path d="M6 22c1.7 1.6 3.3 1.6 5 0s3.3-1.6 5 0s3.3 1.6 5 0s3.3-1.6 5 0" strokeWidth={1.6} />
  </Svg>
);

/** Palette with brush — themes & settings. */
export const IcPalette = (p: P) => (
  <Svg {...p}>
    <path className="ia" stroke="none" d="M15 4C8.4 4 3.5 8.9 3.5 15c0 6.3 5 11.5 11 11.5c1.6 0 2.4-1 2.4-2.2c0-1.6-1.5-2.1-1.5-3.6c0-1.4 1.1-2.2 2.6-2.2h3.2c3.5 0 5.8-2.3 5.8-5.6C27 8.6 21.6 4 15 4z" />
    <path d="M15 4C8.4 4 3.5 8.9 3.5 15c0 6.3 5 11.5 11 11.5c1.6 0 2.4-1 2.4-2.2c0-1.6-1.5-2.1-1.5-3.6c0-1.4 1.1-2.2 2.6-2.2h3.2c3.5 0 5.8-2.3 5.8-5.6C27 8.6 21.6 4 15 4z" />
    <circle cx="9.5" cy="15" r="1.8" fill="currentColor" stroke="none" />
    <circle cx="12" cy="9.5" r="1.8" className="ia-solid" stroke="none" />
    <circle cx="18.5" cy="9" r="1.8" fill="currentColor" stroke="none" />
  </Svg>
);

export const IcGear = (p: P) => (
  <Svg {...p}>
    <path className="ia" stroke="none" d="M16 10.5a5.5 5.5 0 1 1 0 11a5.5 5.5 0 0 1 0-11z" />
    <path d="M13.6 3.5h4.8l.7 3.3l2.4 1.4l3.2-1.1l2.4 4.2l-2.5 2.2v2.9l2.5 2.2l-2.4 4.2l-3.2-1.1l-2.4 1.4l-.7 3.3h-4.8l-.7-3.3l-2.4-1.4l-3.2 1.1l-2.4-4.2l2.5-2.2v-2.9l-2.5-2.2l2.4-4.2l3.2 1.1l2.4-1.4z" />
    <circle cx="16" cy="16" r="3.5" />
  </Svg>
);

// ---- Utility glyphs (same stroke language) ----
export const IcPlus = (p: P) => (
  <Svg {...p}><path d="M16 6v20M6 16h20" strokeWidth={2.6} /></Svg>
);
export const IcClose = (p: P) => (
  <Svg {...p}><path d="M8 8l16 16M24 8L8 24" strokeWidth={2.6} /></Svg>
);
export const IcPlay = (p: P) => (
  <Svg {...p}><path d="M10 6.5l15 9.5l-15 9.5z" fill="currentColor" /></Svg>
);
export const IcPause = (p: P) => (
  <Svg {...p}><rect x="8" y="6.5" width="5" height="19" rx="1.5" fill="currentColor" /><rect x="19" y="6.5" width="5" height="19" rx="1.5" fill="currentColor" /></Svg>
);
export const IcReset = (p: P) => (
  <Svg {...p}><path d="M6.5 16a9.5 9.5 0 1 0 3-6.9" strokeWidth={2.4} /><path d="M6 4.5v6h6" strokeWidth={2.4} /></Svg>
);
export const IcFlag = (p: P) => (
  <Svg {...p}><path className="ia-solid" stroke="none" d="M8 5h15l-3 5l3 5H8z" /><path d="M8 28V4.5M8 5h15l-3 5l3 5H8" /></Svg>
);
export const IcTrash = (p: P) => (
  <Svg {...p}><path d="M5.5 8.5h21M12.5 8.5V5.5h7v3M8.5 8.5l1.3 17.2a2 2 0 0 0 2 1.8h8.4a2 2 0 0 0 2-1.8l1.3-17.2" /><path d="M13.5 13.5v9M18.5 13.5v9" opacity={0.6} /></Svg>
);
export const IcEdit = (p: P) => (
  <Svg {...p}><path d="M21.5 5.5l5 5L12 25l-6.5 1.5L7 20z" /><path d="M18.5 8.5l5 5" opacity={0.6} /></Svg>
);
export const IcSnooze = (p: P) => (
  <Svg {...p}><path d="M5 9h7l-7 8h7M16 5h5l-5 6h5M22 17h6l-6 8h6" strokeWidth={2.2} /></Svg>
);
export const IcChevron = ({ dir = 'right', ...p }: P & { dir?: 'left' | 'right' | 'down' | 'up' }) => {
  const r = { right: 0, down: 90, left: 180, up: 270 }[dir];
  return <Svg {...p}><path d="M12 7l9 9l-9 9" strokeWidth={2.6} transform={`rotate(${r} 16 16)`} /></Svg>;
};
export const IcSearch = (p: P) => (
  <Svg {...p}><circle cx="14" cy="14" r="8.5" /><path d="M20.5 20.5l6.5 6.5" strokeWidth={2.6} /></Svg>
);
export const IcCheck = (p: P) => (
  <Svg {...p}><path d="M6.5 16.5l6 6l13-13" strokeWidth={3} /></Svg>
);
export const IcSun = (p: P) => (
  <Svg {...p}><circle cx="16" cy="16" r="5.5" className="ia-solid" /><path d="M16 3v3M16 26v3M3 16h3M26 16h3M6.8 6.8l2.1 2.1M23.1 23.1l2.1 2.1M6.8 25.2l2.1-2.1M23.1 8.9l2.1-2.1" /></Svg>
);
export const IcMoon = (p: P) => (
  <Svg {...p}><path className="ia" d="M26 19.5A11 11 0 0 1 12.5 6a11 11 0 1 0 13.5 13.5z" /><path d="M22 4.5v3M20.5 6h3" strokeWidth={1.5} /></Svg>
);
export const IcBell = (p: P) => (
  <Svg {...p}><path className="ia" d="M8 21.5V14a8 8 0 0 1 16 0v7.5l2.5 3h-21z" /><path d="M13 27.5a3.2 3.2 0 0 0 6 0" /></Svg>
);
export const IcDownload = (p: P) => (
  <Svg {...p}><path d="M16 4.5v15M10 13.5l6 6l6-6M5.5 22.5v3a2 2 0 0 0 2 2h17a2 2 0 0 0 2-2v-3" /></Svg>
);
export const IcUpload = (p: P) => (
  <Svg {...p}><path d="M16 20V5M10 11l6-6l6 6M5.5 22.5v3a2 2 0 0 0 2 2h17a2 2 0 0 0 2-2v-3" /></Svg>
);
export const IcGlobe = (p: P) => (
  <Svg {...p}><circle cx="16" cy="16" r="12" className="ia" /><path d="M4 16h24M16 4c-4.5 4-4.5 20 0 24M16 4c4.5 4 4.5 20 0 24" /></Svg>
);
export const IcStar = (p: P) => (
  <Svg {...p}><path className="ia-solid" d="M16 4l3.6 7.4l8.1 1.2l-5.9 5.7l1.4 8.1L16 22.6l-7.2 3.8l1.4-8.1l-5.9-5.7l8.1-1.2z" /></Svg>
);
export const IcHeart = (p: P) => (
  <Svg {...p}><path className="ia-solid" d="M16 27S4 20 4 11.8A6.3 6.3 0 0 1 16 9a6.3 6.3 0 0 1 12 2.8C28 20 16 27 16 27z" /></Svg>
);
export const IcRings = (p: P) => (
  <Svg {...p}><circle cx="12" cy="19" r="7.5" /><circle cx="20" cy="19" r="7.5" /><path className="ia-solid" d="M20 4l2.5 3l-2.5 3l-2.5-3z" /></Svg>
);
export const IcGift = (p: P) => (
  <Svg {...p}><rect x="5" y="12" width="22" height="15" rx="2" className="ia" /><path d="M3.5 12h25M16 12v15" /><path d="M16 12c-2-5-8-6-8-2.5S13 12 16 12zM16 12c2-5 8-6 8-2.5S19 12 16 12z" /></Svg>
);
export const IcCandle = (p: P) => (
  <Svg {...p}><path className="ia-solid" stroke="none" d="M16 3c2 2.2 2.6 3.6 2.6 4.8a2.6 2.6 0 0 1-5.2 0C13.4 6.6 14 5.2 16 3z" /><rect x="12" y="13" width="8" height="14.5" rx="1.5" /><path d="M16 10.5V13" /></Svg>
);
export const IcSparkle = (p: P) => (
  <Svg {...p}><path className="ia-solid" d="M16 3l2.8 8.2L27 14l-8.2 2.8L16 25l-2.8-8.2L5 14l8.2-2.8z" /><path d="M25 22l1 3l3 1l-3 1l-1 3l-1-3l-3-1l3-1z" strokeWidth={1.4} /></Svg>
);
export const IcFire = (p: P) => (
  <Svg {...p}><path className="ia-solid" d="M16 28c-5.5 0-9-3.6-9-8.5c0-5.2 4.5-7.5 5-13c3.5 2.5 5 5 5.5 8c1-1 1.6-2.4 1.8-4c2.6 2.6 5.7 5.6 5.7 9C25 24.4 21.5 28 16 28z" /></Svg>
);

/** Mood faces for the journal. */
export function MoodFace({ mood, size = 28 }: { mood: string; size?: number }) {
  const mouth: Record<string, string> = {
    great: 'M10 18.5c2.5 4.5 9.5 4.5 12 0z',
    good: 'M10.5 19c2.5 3 8.5 3 11 0',
    okay: 'M11 20h10',
    meh: 'M11 21c2.5-1.5 7.5-1.5 10 0',
    rough: 'M10.5 22c2.5-3.5 8.5-3.5 11 0',
  };
  const color: Record<string, string> = {
    great: 'var(--mood-great)',
    good: 'var(--mood-good)',
    okay: 'var(--mood-okay)',
    meh: 'var(--mood-meh)',
    rough: 'var(--mood-rough)',
  };
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="13" fill={color[mood]} />
      <g stroke="rgba(0,0,0,.72)" strokeWidth={2} strokeLinecap="round" fill="none">
        {mood === 'great' ? (
          <path d="M9.5 13c1-1.6 3-1.6 4 0M18.5 13c1-1.6 3-1.6 4 0" />
        ) : (
          <path d="M11.5 12.5v1.5M20.5 12.5v1.5" strokeWidth={2.6} />
        )}
        <path d={mouth[mood]} fill={mood === 'great' ? 'rgba(0,0,0,.72)' : 'none'} />
      </g>
    </svg>
  );
}

/** Full-color app mark used in the header and About screen. */
export function AppMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="am-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent2)" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#am-bg)" />
      <circle cx="32" cy="35" r="19" fill="none" stroke="#fff" strokeWidth="5" />
      <rect x="18" y="8" width="6" height="12" rx="3" fill="#fff" />
      <rect x="40" y="8" width="6" height="12" rx="3" fill="#fff" />
      <path d="M23.5 35.5l6 6l12-13" fill="none" stroke="#fff" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
