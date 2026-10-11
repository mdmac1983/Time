import type { ThemeId } from './types';

export const THEMES: { id: ThemeId; name: string; desc: string; swatch: [string, string, string] }[] = [
  { id: 'aurora', name: 'Aurora', desc: 'Deep night sky with northern-lights glow', swatch: ['#0d0f22', '#7c6cff', '#2de1c2'] },
  { id: 'daylight', name: 'Daylight', desc: 'Crisp, bright and airy', swatch: ['#f4f6fb', '#2f6bff', '#ff8a3d'] },
  { id: 'sunset', name: 'Sunset', desc: 'Warm dusk purples and golden orange', swatch: ['#1c0f1f', '#ff7a45', '#ffc04d'] },
  { id: 'forest', name: 'Forest', desc: 'Mossy greens with amber firelight', swatch: ['#0e1a14', '#5fd38d', '#f5b041'] },
  { id: 'ocean', name: 'Ocean', desc: 'Deep-sea navy and bioluminescent cyan', swatch: ['#06182a', '#22c4ee', '#4f7cff'] },
  { id: 'synthwave', name: 'Synthwave', desc: 'Neon pink & cyan, retro glow', swatch: ['#0b0618', '#ff2bd6', '#21f0ff'] },
  { id: 'paper', name: 'Paper', desc: 'Warm sepia notebook with ink accents', swatch: ['#f3ead8', '#9c3d2e', '#2f5d62'] },
  { id: 'rose', name: 'Rosé', desc: 'Soft blush and rose gold', swatch: ['#fff3f5', '#e0567a', '#c9935a'] },
  { id: 'mono', name: 'Midnight OLED', desc: 'Pure black, battery-friendly, minimal', swatch: ['#000000', '#ffffff', '#8a8a8a'] },
];

export function applyTheme(id: ThemeId) {
  document.documentElement.dataset.theme = id;
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg || '#0d0f22');
}
