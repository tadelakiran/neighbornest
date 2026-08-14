import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface OtpInputProps {
  /** Number of digit boxes (default 6). */
  length?: number;
  /** The accumulated code — must contain only digits. */
  value: string;
  /** Called whenever the code changes (digits only, may be partial). */
  onChange: (code: string) => void;
  /** Fired once every box is filled. */
  onComplete?: (code: string) => void;
  /** Inline error message shown under the boxes. */
  error?: string;
  /** Disables editing while a verification request is in flight. */
  disabled?: boolean;
}

/**
 * Per-digit OTP input — six individual boxes with automatic focus advance,
 * backspace traversal, arrow-key navigation, and full paste support.
 *
 * UX details:
 * - Each box is a real input with `inputMode="numeric"` so mobile keyboards
 *   show the number pad.
 * - Typing a digit moves focus to the next empty box; backspace on an empty
 *   box moves focus back (classic OTP behavior).
 * - Pasting a full code fills every box at once and fires `onComplete`.
 * - The group carries `aria-label` and boxes carry `aria-invalid` so screen
 *   readers announce failures.
 */
export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  error,
  disabled = false,
}: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // Focus the first empty box when the component mounts (or becomes enabled).
  useEffect(() => {
    if (disabled) return;
    const index = Math.min(value.length, length - 1);
    inputsRef.current[index]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  const setDigit = (index: number, digit: string) => {
    const next = value.slice(0, index) + digit + value.slice(index + 1);
    onChange(next);
    if (next.length === length) {
      onComplete?.(next);
    }
    if (index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  /** Removes the digit at `index`, stepping back when the box was empty. */
  const clearDigit = (index: number) => {
    if (value[index]) {
      onChange(value.slice(0, index) + value.slice(index + 1));
    } else if (index > 0) {
      onChange(value.slice(0, index - 1) + value.slice(index));
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      clearDigit(index);
      return;
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      inputsRef.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (index: number, event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '');
    if (!pasted) return;
    event.preventDefault();
    const next = (value.slice(0, index) + pasted + value.slice(index + pasted.length)).slice(0, length);
    onChange(next);
    if (next.length === length) {
      onComplete?.(next);
      inputsRef.current[length - 1]?.focus();
    } else {
      inputsRef.current[Math.min(next.length, length - 1)]?.focus();
    }
  };

  return (
    <div>
      <div
        role="group"
        aria-label="One-time verification code"
        className="flex justify-between gap-2 sm:gap-3"
      >
        {Array.from({ length }).map((_, index) => {
          const filled = index < value.length;
          return (
            <input
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={value[index] ?? ''}
              disabled={disabled}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '');
                if (!digits) {
                  // Box was cleared — behave like a backspace.
                  clearDigit(index);
                  return;
                }
                setDigit(index, digits[0]);
              }}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={(e) => handlePaste(index, e)}
              onFocus={(e) => e.target.select()}
              aria-invalid={error ? true : undefined}
              className={cn(
                'h-12 w-full max-w-[46px] flex-1 rounded-xl border text-center text-xl font-bold tracking-widest sm:h-14 sm:max-w-[52px]',
                'bg-[var(--color-surface-2)] text-[var(--text-primary)]',
                'border-[var(--color-border)] outline-none transition-all duration-200',
                'placeholder:text-[var(--text-subtle)]',
                'focus:border-[var(--accent-400)] focus:ring-2 focus:ring-[var(--accent-400)]/15',
                filled && 'border-[var(--color-border-2)]',
                error && 'border-[var(--error)] focus:border-[var(--error)] focus:ring-[var(--error)]/15',
                disabled && 'cursor-not-allowed opacity-60'
              )}
            />
          );
        })}
      </div>

      {error ? (
        <p
          key={error}
          role="alert"
          className="error-shake mt-2 text-center text-sm font-medium text-[var(--error)]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default OtpInput;
