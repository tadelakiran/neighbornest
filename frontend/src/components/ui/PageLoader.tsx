import { Bird } from 'lucide-react';

/**
 * Branded full-screen loader shown by the router's Suspense fallback while a
 * lazy page chunk downloads (only happens once per route, off the critical
 * path of the initial load).
 */
export function PageLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-900">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/25">
        <Bird className="h-6 w-6 text-emerald-950" aria-hidden="true" />
      </span>
      <div className="h-1 w-44 overflow-hidden rounded-full bg-slate-800">
        <div className="loading-slide h-full w-1/2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" />
      </div>
      <p className="text-xs font-medium text-slate-500">Loading your Nest…</p>
    </div>
  );
}
