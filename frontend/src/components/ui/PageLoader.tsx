import { Spinner } from '@/components/ui/Spinner';

/**
 * Full-page loading state shown while lazy route chunks download.
 * Centered spinner on the app background.
 */
export function PageLoader() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]"
      role="status"
      aria-label="Loading page"
    >
      {/* Indeterminate progress bar at the top */}
      <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-accent-100">
        <div className="loading-slide absolute inset-y-0 w-1/3 rounded-full bg-accent-500" />
      </div>

      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      </div>
    </div>
  );
}
