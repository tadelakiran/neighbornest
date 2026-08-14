import { useCallback, useRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  flat?: boolean;
  hairline?: boolean;
}

export function Card({ padded = true, flat = false, hairline = false, className, children, ...props }: CardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el || flat) return;
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
      el.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
    },
    [flat]
  );

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--mouse-x', '-999px');
    el.style.setProperty('--mouse-y', '-999px');
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'group/card relative overflow-hidden rounded-[var(--radius-lg)]',
        'bg-[var(--color-surface)] border border-[var(--color-border)]',
        'shadow-card transition-all duration-300',
        !flat && 'hover:border-[var(--accent-400)]/25 hover:shadow-card-hover',
        padded && 'p-6',
        className
      )}
      {...props}
    >
      {hairline && (
        <div
          aria-hidden="true"
          className="absolute inset-x-8 top-0 h-[2px] rounded-b-full bg-accent-gradient opacity-0 transition-opacity duration-300 group-hover/card:opacity-100 shadow-[0_0_8px_rgba(14,165,233,0.4)]"
        />
      )}

      {!flat && <div aria-hidden="true" className="spotlight-layer" />}

      <div className="relative">{children}</div>
    </div>
  );
}