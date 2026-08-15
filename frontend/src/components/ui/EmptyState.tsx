import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /** Lucide icon component (or any node) to render in the accent tile. */
  icon: ReactNode;
  /** Short headline explaining the empty state. */
  title: string;
  /** What's missing / why it's empty / what to do next. */
  description: string;
  /** Optional primary action. */
  action?: ReactNode;
  /** Optional secondary action. */
  secondaryAction?: ReactNode;
  className?: string;
  /** Renders a subtle background image behind the panel. */
  image?: string;
  imageAlt?: string;
}

/**
 * Shared empty state — consistent "what's missing / why / next step" pattern
 * used across dashboards, lists, and feeds. Optionally layers a soft
 * background photograph for warmth instead of a bare gray panel.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  image,
  imageAlt = '',
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-[var(--radius-xl)]',
        'border border-[var(--color-border)] bg-[var(--color-surface)] text-center',
        className
      )}
    >
      {image && (
        <>
          <div className="relative h-40 overflow-hidden">
            <img
              src={image}
              alt={imageAlt}
              loading="lazy"
              className="pointer-events-none h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] to-transparent"
            />
          </div>
        </>
      )}

      <div className="flex flex-col items-center px-8 pb-12 pt-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--accent-400)]/25 bg-[var(--accent-400)]/10">
          {icon}
        </span>

        <h2 className="mt-6 font-['Space_Grotesk'] text-xl font-bold text-[var(--text-primary)]">
          {title}
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]">
          {description}
        </p>

        {(action || secondaryAction) && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {action}
            {secondaryAction}
          </div>
        )}
      </div>
    </div>
  );
}
