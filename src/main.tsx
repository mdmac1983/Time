import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Offline support for the installable web version (not needed inside the Android shell).
if ('serviceWorker' in navigator && import.meta.env.PROD && !('Capacitor' in window && (window as unknown as { Capacitor: { isNativePlatform(): boolean } }).Capacitor.isNativePlatform())) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
