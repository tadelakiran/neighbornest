import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

/**
 * Dashboard grid — a 12-column layout on desktop with uniform 24px gutters:
 *  - mobile:  single column (cards stack in priority order)
 *  - tablet:  2 equal columns
 *  - desktop: 12 columns, so cards declare their own `lg:col-span-*`
 */
export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-12',
        'md:auto-rows-[minmax(170px,auto)] lg:auto-rows-[minmax(180px,auto)]',
        className
      )}
    >
      {children}
    </div>
  );
}