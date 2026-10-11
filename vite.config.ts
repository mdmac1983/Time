import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
// Displayed version drops the patch part: 1.0.0 -> 1.0, 1.1.0 -> 1.1
const shortVersion = pkg.version.split('.').slice(0, 2).join('.');

export default defineConfig({
  base: './',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(shortVersion),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
