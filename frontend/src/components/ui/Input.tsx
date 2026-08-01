import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Field label shown above the input. */
  label?: string;
  /** Validation error message shown in rose below the input. */
  error?: string;
  /** Helper text shown below the input when there is no error. */
  hint?: string;
  /** Icon rendered on the left inside the input. */
  icon?: ReactNode;
  /** Element rendered on the right inside the input (e.g. password toggle). */
  trailing?: ReactNode;
}

/**
 * Text input with label, error/hint text, and optional icons.
 * Forwards its ref so react-hook-form `register` works out of the box.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon, trailing, className, id, ...props },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
            {icon}
          </span>
        )}

        <input
          ref={ref}
          id={id}
          className={cn(
            'h-11 w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 text-sm text-slate-100',
            'placeholder:text-slate-500 outline-none transition-colors duration-200',
            'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25',
            'disabled:cursor-not-allowed disabled:opacity-60',
            icon && 'pl-10',
            trailing && 'pr-10',
            error && 'border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/25',
            className
          )}
          aria-invalid={error ? true : undefined}
          {...props}
        />

        {trailing && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-3">{trailing}</span>
        )}
      </div>

      {error ? (
        <p className="mt-1.5 text-xs font-medium text-rose-400" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
});
