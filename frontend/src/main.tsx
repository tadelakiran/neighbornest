import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/App';
import KeepAlive from '@/components/KeepAlive';
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
    {/*
      Invisible, opt-in keep-alive (see VITE_ENABLE_KEEP_ALIVE). Mounted
      outside the app tree so it can never interfere with the router,
      rendering, auth, or chat WebSockets. Renders nothing.
    */}
    <KeepAlive />
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
