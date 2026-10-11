import type { SoundId } from '../types';

export const SOUNDS: { id: SoundId; name: string }[] = [
  { id: 'chime', name: 'Glass Chime' },
  { id: 'digital', name: 'Classic Digital' },
  { id: 'bell', name: 'Temple Bell' },
  { id: 'marimba', name: 'Marimba' },
  { id: 'pulse', name: 'Soft Pulse' },
  { id: 'rise', name: 'Gentle Rise' },
];

let ctx: AudioContext | null = null;
function audio() {
  if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Unlock audio on first user gesture (mobile browsers require it). */
export function primeAudio() {
  try {
    audio();
  } catch {
    /* no audio support */
  }
}

function tone(ac: AudioContext, out: AudioNode, freq: number, start: number, dur: number, type: OscillatorType, peak: number) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(peak, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(out);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

/** Schedule one bar of a sound starting at t; returns the bar length in seconds. */
function bar(id: SoundId, ac: AudioContext, out: AudioNode, t: number, n: number): number {
  switch (id) {
    case 'chime':
      [1046.5, 1318.5, 1568, 2093].forEach((f, i) => tone(ac, out, f, t + i * 0.14, 1.2, 'sine', 0.35));
      return 1.8;
    case 'digital':
      for (let i = 0; i < 4; i++) tone(ac, out, 2048, t + i * 0.13, 0.08, 'square', 0.12);
      return 1.0;
    case 'bell':
      [1, 2.76, 5.4, 8.93].forEach((p, i) => tone(ac, out, 330 * p, t, 2.6 - i * 0.5, 'sine', 0.3 / (i + 1)));
      return 2.8;
    case 'marimba': {
      const notes = [523.25, 659.25, 783.99, 659.25, 880, 783.99];
      notes.forEach((f, i) => {
        tone(ac, out, f, t + i * 0.18, 0.4, 'triangle', 0.4);
        tone(ac, out, f * 4, t + i * 0.18, 0.08, 'sine', 0.05);
      });
      return 1.6;
    }
    case 'pulse':
      tone(ac, out, 440, t, 0.6, 'sine', 0.35);
      tone(ac, out, 554.37, t + 0.3, 0.6, 'sine', 0.25);
      return 1.4;
    case 'rise': {
      const vol = Math.min(0.05 + n * 0.04, 0.45);
      [392, 493.88, 587.33].forEach((f, i) => tone(ac, out, f, t + i * 0.25, 0.9, 'sine', vol));
      return 1.6;
    }
  }
}

/** Play a sound; loops until the returned stop function is called. */
export function playSound(id: SoundId, loop = true): () => void {
  let ac: AudioContext;
  try {
    ac = audio();
  } catch {
    return () => {};
  }
  const master = ac.createGain();
  master.gain.value = 0.9;
  master.connect(ac.destination);
  let next = ac.currentTime + 0.05;
  let n = 0;
  let stopped = false;
  const schedule = () => {
    if (stopped) return;
    while (next < ac.currentTime + 2) {
      next += bar(id, ac, master, next, n++);
      if (!loop) break;
    }
  };
  schedule();
  const timer = loop ? setInterval(schedule, 500) : 0;
  return () => {
    stopped = true;
    clearInterval(timer);
    master.gain.setTargetAtTime(0, ac.currentTime, 0.05);
    setTimeout(() => master.disconnect(), 400);
  };
}

export function vibrate(pattern: number[] = [400, 200, 400, 200, 400]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}
