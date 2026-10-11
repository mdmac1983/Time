// Renders public/icon.svg into PWA icons and Android launcher/splash/notification
// assets using the system Chromium (playwright-core). Run: npm run icons
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const icon = readFileSync(root + 'public/icon.svg', 'utf8');
const mono = readFileSync(root + 'public/icon-mono.svg', 'utf8');
const inner = icon.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const defs = inner.match(/<defs>[\s\S]*?<\/defs>/)[0];
const art = inner.replace(defs, '').replace(/<rect width="512" height="512"[^>]*\/>/g, '');
const BG = '#0d0f22';

const svg = (body, vb = 512) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vb} ${vb}">${body}</svg>`;
const full = icon;
const round = svg(`${defs}<clipPath id="c"><circle cx="256" cy="256" r="256"/></clipPath><g clip-path="url(#c)"><rect width="512" height="512" fill="url(#bg)"/><rect width="512" height="512" fill="url(#glow)"/>${art}</g>`);
const fg = (s) => svg(`${defs}<g transform="translate(${256 * (1 - s)} ${256 * (1 - s) - 8 * s}) scale(${s})">${art}</g>`);
const maskable = svg(`${defs}<rect width="512" height="512" fill="url(#bg)"/><rect width="512" height="512" fill="url(#glow)"/><g transform="translate(${256 * 0.25} ${256 * 0.25 - 6}) scale(0.75)">${art}</g>`);

// Prefer a preinstalled Chromium when present (cloud containers); else Playwright's default.
const local = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(existsSync(local) ? { executablePath: local } : {});
const page = await browser.newPage();

async function render(markup, w, h, out, background = 'transparent', fit = 1) {
  const size = Math.round(Math.min(w, h) * fit);
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(
    `<html><body style="margin:0;background:${background};display:grid;place-items:center;width:${w}px;height:${h}px;overflow:hidden">` +
      `<div style="width:${size}px;height:${size}px">${markup.replace('<svg ', `<svg width="${size}" height="${size}" `)}</div></body></html>`,
  );
  mkdirSync(dirname(root + out), { recursive: true });
  writeFileSync(root + out, await page.screenshot({ omitBackground: background === 'transparent', type: 'png' }));
}

// PWA
await render(full, 192, 192, 'public/icons/icon-192.png');
await render(full, 512, 512, 'public/icons/icon-512.png');
await render(maskable, 512, 512, 'public/icons/maskable-512.png');

const res = 'android/app/src/main/res/';
const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
if (existsSync(root + res)) {
  for (const [d, k] of Object.entries(dens)) {
    await render(full, 48 * k, 48 * k, `${res}mipmap-${d}/ic_launcher.png`);
    await render(round, 48 * k, 48 * k, `${res}mipmap-${d}/ic_launcher_round.png`);
    await render(fg(0.76), 108 * k, 108 * k, `${res}mipmap-${d}/ic_launcher_foreground.png`);
    await render(mono, 24 * k, 24 * k, `${res}drawable-${d}/ic_stat_timehub.png`);
    // Themed-icon (Android 13+) layer: monochrome art inside the adaptive safe zone.
    await render(mono, 108 * k, 108 * k, `${res}mipmap-${d}/ic_launcher_monochrome.png`, 'transparent', 0.5);
    // Splash screens: icon centered on the app background.
    await render(full, 320 * k, 480 * k, `${res}drawable-port-${d}/splash.png`, BG, 0.4);
    await render(full, 480 * k, 320 * k, `${res}drawable-land-${d}/splash.png`, BG, 0.4);
  }
  await render(full, 480, 320, `${res}drawable/splash.png`, BG, 0.4);
}
await browser.close();
console.log('Icons rendered');
