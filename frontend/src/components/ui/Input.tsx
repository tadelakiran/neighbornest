import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
}

/**
 * Minimal text input — elevated surface background, blue accent focus ring.
 * Dark mode: deep surface + accent ring.
 * Forwards its ref for react-hook-form.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon, trailing, className, id, ...props },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
        >
          {label}
        </label>
      )}

      <div className="relative group">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--text-subtle)] transition-colors group-focus-within:text-[var(--accent-400)]">
            {icon}
          </span>
        )}

        <input
          ref={ref}
          id={id}
          className={cn(
            'h-11 w-full rounded-[var(--radius)] border px-3.5 text-sm',
            'bg-[var(--color-surface-2)] text-[var(--text-primary)]',
            'border-[var(--color-border)] placeholder:text-[var(--text-subtle)]',
            'outline-none transition-all duration-200',
            'focus:border-[var(--accent-400)] focus:ring-2 focus:ring-[var(--accent-400)]/15',
            'hover:border-[var(--color-border-2)]',
            'disabled:cursor-not-allowed disabled:opacity-60',
            icon && 'pl-10',
            trailing && 'pr-10',
            error && 'border-[var(--error)] focus:border-[var(--error)] focus:ring-[var(--error)]/15',
            className
          )}
          aria-invalid={error ? true : undefined}
          {...props}
        />

        {trailing && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-3">
            {trailing}
          </span>
        )}
      </div>

      {error ? (
        <p
          key={error}
          role="alert"
          className="error-shake mt-1.5 flex items-center gap-1.5 text-xs text-[var(--error)]"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5 shrink-0"
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
        <p className="mt-1.5 text-xs text-[var(--text-muted)]">{hint}</p>
      ) : null}
    </div>
  );
});