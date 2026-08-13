import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3',
        'auto-rows-[minmax(170px,auto)]',
        className
      )}
    >
      {children}
    </div>
  );
}