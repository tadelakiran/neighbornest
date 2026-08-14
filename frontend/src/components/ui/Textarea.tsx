import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

/**
 * Blue Dynasty multiline textarea with label, error/hint text, and an accent
 * focus ring. Forwards its ref so react-hook-form `register` works out of the box.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className, id, rows = 4, ...props },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        className={cn(
          'w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--text-primary)]',
          'placeholder:text-[var(--text-muted)] outline-none transition-all duration-200',
          'focus:border-[var(--accent-400)] focus:ring-2 focus:ring-[var(--accent-400)]/20',
          'disabled:cursor-not-allowed disabled:opacity-60 resize-y',
          error &&
            'border-[var(--error)]/50 focus:border-[var(--error)] focus:ring-[var(--error)]/20',
          className
        )}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error ? (
        <p
          className="mt-1.5 flex items-center gap-1 text-sm text-[var(--error)]"
          role="alert"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4 shrink-0"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-sm text-[var(--text-muted)]">{hint}</p>
      ) : null}
    </div>
  );
});