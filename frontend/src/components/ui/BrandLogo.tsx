import { Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  compact?: boolean;
  className?: string;
}

export function BrandLogo({ compact = false, className }: BrandLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-gradient shadow-glow-sm ring-1 ring-accent-400/20">
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