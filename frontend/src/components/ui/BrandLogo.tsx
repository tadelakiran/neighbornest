import { Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  /** Hide the wordmark (logo mark only). Default false. */
  compact?: boolean;
  className?: string;
}

/**
 * NeighborNest brand logo — gradient compass mark + Space Grotesk wordmark.
 * Used across the public layouts, navbar, and onboarding.
 */
export function BrandLogo({ compact = false, className }: BrandLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-gradient shadow-glow">
        <Compass className="h-5 w-5 text-white" aria-hidden="true" />
      </span>
      {!compact && (
        <span className="font-display text-lg font-bold tracking-tight text-primary">
          Neighbor<span className="text-gradient">Nest</span>
        </span>
      )}
    </span>
  );
}
