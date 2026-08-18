import { Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NeighborNestLoaderProps {
  /** Message shown under the wordmark. */
  message?: string;
  className?: string;
}

/**
 * Inline branded loader for page content that is still fetching data.
 *
 * Same Azure Dynasty look as the full-page {@link PageLoader} (compass mark,
 * wordmark, indeterminate bar) but sized for a content area — so Discover,
 * Proposals, and similar pages show a clean NeighborNest loader instead of a
 * blank region while their data is in flight.
 */
export function NeighborNestLoader({
  message = 'Loading your neighborhood…',
  className,
}: NeighborNestLoaderProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn('flex flex-col items-center justify-center gap-5 py-20', className)}
    >
      {/* Indeterminate progress bar */}
      <div className="h-1 w-48 overflow-hidden rounded-full bg-[var(--color-raised)]/60">
        <div className="loading-slide h-full w-1/3 rounded-full bg-[var(--grad-primary)]" />
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <span
            className="absolute inset-0 -m-2.5 rounded-xl bg-[var(--accent-400)]/20 blur-lg animate-pulse"
            aria-hidden="true"
          />
          <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--grad-primary)] shadow-[0_0_20px_rgba(14,165,233,0.3)]">
            <Compass className="h-5 w-5 text-white" aria-hidden="true" />
          </span>
        </div>
        <p className="font-['Space_Grotesk'] text-base font-bold tracking-tight text-[var(--text-primary)]">
          Neighbor<span className="text-gradient">Nest</span>
        </p>
        <p className="-mt-1.5 text-sm text-[var(--text-muted)]">{message}</p>
      </div>
    </div>
  );
}
