import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

/**
 * Responsive bento container: 1 column on mobile, 2 on tablet, 3 on desktop.
 * Cells self-size via the `col-span-*` / `row-span-*` classes on BentoCard.
 */
export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3',
        'auto-rows-[minmax(180px,auto)]',
        className
      )}
    >
      {children}
    </div>
  );
}
