import { useCallback, useRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SpotlightWrapperProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Radius of the spotlight radial gradient. */
  radius?: number;
  /** Opacity of the spotlight color. */
  intensity?: number;
}

/**
 * Adds a cursor-tracking spotlight layer to its children.
 *
 * On mousemove it writes `--mouse-x` / `--mouse-y` CSS variables (relative to
 * this element) which the child spotlight layer consumes via a radial-gradient.
 * The spotlight layer is rendered as the first child so it sits underneath the
 * real content. Spotlights are intentionally subtle and only meaningful on
 * pointer devices — the layer is always present but `md:` gating is up to the
 * consumer's own layers.
 */
export function SpotlightWrapper({
  children,
  radius = 600,
  intensity = 0.06,
  className,
  ...props
}: SpotlightWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
    el.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--mouse-x', `-999px`);
    el.style.setProperty('--mouse-y', `-999px`);
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn('group relative', className)}
      {...props}
    >
      {/* Spotlight layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px z-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(${radius}px circle at var(--mouse-x, -999px) var(--mouse-y, -999px), rgba(56,189,248,${intensity}), transparent 40%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}