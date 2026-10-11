// Bumps the app version by 0.1 (1.0 -> 1.1 ... 1.9 -> 2.0) everywhere it lives.
// Usage: npm run bump
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const pkgPath = root + 'package.json';
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
let [major, minor] = pkg.version.split('.').map(Number);
const from = `${major}.${minor}`;
minor += 1;
if (minor >= 10) {
  major += 1;
  minor = 0;
}
const to = `${major}.${minor}`;
pkg.version = `${to}.0`;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

const lockPath = root + 'package-lock.json';
const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
lock.version = pkg.version;
if (lock.packages?.['']) lock.packages[''].version = pkg.version;
writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');

// New service-worker cache name so installed web copies pick up the update.
const swPath = root + 'public/sw.js';
writeFileSync(swPath, readFileSync(swPath, 'utf8').replace(/timehub-v[\d.]+/, `timehub-v${to}`));

console.log(`Version bumped ${from} -> ${to}`);
