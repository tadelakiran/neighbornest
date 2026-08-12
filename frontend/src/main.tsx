import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/App';
import '@/index.css';

// sockjs-client assumes a Node-style `global` — polyfill it for the browser
// before any chat/websocket module is evaluated.
if (typeof (window as unknown as Record<string, unknown>).global === 'undefined') {
  (window as unknown as Record<string, unknown>).global = window;
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found — check index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);

/**
 * Fades out the inline splash screen from index.html once React has mounted.
 * The fade is purely visual — the element is removed from the DOM afterwards
 * so it never blocks interaction or memory.
 */
function dismissSplash(): void {
  const splash = document.getElementById('app-splash');
  if (!splash) return;
  requestAnimationFrame(() => {
    splash.classList.add('is-done');
    window.setTimeout(() => splash.remove(), 600);
  });
}

// Wait for the first paint of the app before hiding the branded loader —
// this makes the handoff from splash -> app seamless instead of flashing blank.
requestAnimationFrame(() => requestAnimationFrame(dismissSplash));
