import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Vite configuration for the NeighborNest frontend.
 *
 * - Resolves the `@/` alias to the `src/` directory for clean imports.
 * - Proxies `/api` to the API Gateway during development so the app also
 *   works without CORS (set `VITE_API_URL=` to an empty string in `.env.local`
 *   to use same-origin requests through this proxy).
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
