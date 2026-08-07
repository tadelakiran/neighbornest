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
 * - Splits node_modules into focused vendor chunks (react, router, http,
 *   forms, icons, animation, state) so the initial payload only contains what
 *   the first route actually needs; page-level React.lazy() chunks the rest.
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
  // Pre-bundle heavy deps when the dev server starts (not on first page load),
  // so the very first visit isn't blocked by esbuild dependency discovery.
  // react/react-dom are pre-bundled automatically and don't need listing here.
  optimizeDeps: {
    include: [
      'react-router-dom',
      'axios',
      'zustand',
      'framer-motion',
      'lucide-react',
      'react-hook-form',
      'zod',
      '@hookform/resolvers',
    ],
  },
  build: {
    target: 'es2020',
    // 559 kB single-chunk baseline -> focused vendor chunks + lazy routes.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          if (id.includes('framer-motion') || id.includes('/motion/')) return 'anim';
          if (id.includes('react-router')) return 'router';
          if (id.includes('axios')) return 'http';
          if (id.includes('react-hook-form') || id.includes('zod') || id.includes('hookform')) return 'forms';
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('zustand')) return 'state';
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
            return 'react-vendor';
          }
          return 'vendor';
        },
      },
    },
  },
});
