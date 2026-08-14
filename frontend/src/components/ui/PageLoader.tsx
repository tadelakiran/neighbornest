import { Compass } from 'lucide-react';

/**
 * Full-page loading state shown while lazy route chunks download.
 * Branded Blue Dynasty loader: logo mark, animated indeterminate bar,
 * and a subtle pulse — consistent with the index.html splash screen.
 */
export function PageLoader() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]"
      role="status"
      aria-label="Loading page"
    >
      {/* Indeterminate progress bar at the top */}
      <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-[var(--color-raised)]/50">
        <div className="loading-slide absolute inset-y-0 w-1/3 rounded-full bg-[var(--grad-primary)]" />
      </div>

      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <span
            className="absolute inset-0 -m-3 rounded-2xl bg-[var(--accent-400)]/20 blur-xl animate-pulse"
            aria-hidden="true"
          />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--grad-primary)] shadow-[0_0_24px_rgba(14,165,233,0.3)]">
            <Compass className="h-7 w-7 text-white" aria-hidden="true" />
          </span>
        </div>
        <p className="font-['Space_Grotesk'] text-lg font-bold tracking-tight text-[var(--text-primary)]">
          Neighbor<span className="text-gradient">Nest</span>
        </p>
        <p className="-mt-3 text-sm text-[var(--text-muted)]">Loading your neighborhood…</p>
      </div>
    </div>
  );
}