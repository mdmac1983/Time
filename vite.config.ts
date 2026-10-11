import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
// Displayed version drops the patch part: 1.0.0 -> 1.0, 1.1.0 -> 1.1
const shortVersion = pkg.version.split('.').slice(0, 2).join('.');

export default defineConfig({
  base: './',
  // Inline all JS/CSS into index.html so the web build also works when opened
  // straight from disk (file://), where browsers block separate script files.
  plugins: [react(), viteSingleFile()],
  define: {
    __APP_VERSION__: JSON.stringify(shortVersion),
  },
  build: {
    outDir: 'dist',
    // Older Android System WebViews / iOS Safari still get transpiled syntax.
    target: ['chrome70', 'safari13'],
    sourcemap: false,
  },
});
