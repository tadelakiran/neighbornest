import { useCallback, useRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Internal padding. Default true. */
  padded?: boolean;
  /** Removes hover effects for flat/static cards. */
  flat?: boolean;
  /** Renders a top accent hairline that animates in on hover. */
  hairline?: boolean;
}

/**
 * Universal surface card — white/light-blue in light mode, dark navy in dark mode.
 * Features a cursor-tracked spotlight layer, subtle border, and a lift shadow on hover.
 */
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
        'group/card relative overflow-hidden rounded-lg',
        'bg-[var(--color-bg)] border border-[var(--color-border)]',
        'shadow-card transition-all duration-300 theme-transition',
        !flat && 'hover:border-accent-300 hover:shadow-card-hover',
        padded && 'p-6',
        className
      )}
      {...props}
    >
      {/* Hairline top accent */}
      {hairline && (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-0.5 bg-accent-gradient opacity-0 transition-opacity duration-300 group-hover/card:opacity-100 rounded-t-lg"
        />
      )}

      {/* Cursor spotlight */}
      {!flat && (
        <div
          aria-hidden="true"
          className="spotlight-layer"
        />
      )}

      <div className="relative">{children}</div>
    </div>
  );
}
