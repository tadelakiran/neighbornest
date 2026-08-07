import { useEffect, useRef, useState } from 'react';

interface UseCountUpOptions {
  /** Animation duration in ms. Default 1000. */
  duration?: number;
  /** Restart the animation whenever the target changes. Default true. */
  restartOnChange?: boolean;
  /** Delay before the animation starts, in ms. Default 0. */
  delay?: number;
}

/**
 * Animates a number from 0 to `target` using requestAnimationFrame with an
 * ease-out curve. Respects `prefers-reduced-motion` by jumping straight to
 * the final value.
 *
 * @param target - the number to count up to
 * @param options - duration and restart behavior
 * @returns the current (animating) value
 */
export function useCountUp(target: number, options: UseCountUpOptions = {}): number {
  const { duration = 1000, restartOnChange = true, delay = 0 } = options;
  const [value, setValue] = useState(0);
  const frame = useRef<number>(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    // Reduced motion: skip the animation entirely.
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || !restartOnChange) {
      setValue(target);
      return;
    }

    let delayId = 0;
    startRef.current = null;
    cancelAnimationFrame(frame.current);

    const begin = () => {
      const step = (timestamp: number) => {
        if (startRef.current === null) startRef.current = timestamp;
        const elapsed = timestamp - startRef.current;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutCubic — fast start, gentle landing.
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(target * eased);
        if (progress < 1) {
          frame.current = requestAnimationFrame(step);
        } else {
          setValue(target);
        }
      };
      frame.current = requestAnimationFrame(step);
    };

    if (delay > 0) {
      delayId = window.setTimeout(begin, delay);
    } else {
      begin();
    }

    return () => {
      window.clearTimeout(delayId);
      cancelAnimationFrame(frame.current);
    };
  }, [target, duration, restartOnChange, delay]);

  return value;
}
