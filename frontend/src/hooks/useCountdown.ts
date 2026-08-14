import { useCallback, useEffect, useState } from 'react';

/**
 * Seconds-based countdown used for OTP resend cooldowns and code expiry.
 *
 * Starts at `initialSeconds` (0 = idle) and ticks down to zero every second.
 * Call `reset(seconds)` to start (or restart) the countdown.
 *
 * @param initialSeconds - starting value (default 0 = idle)
 * @returns `{ secondsLeft, reset }` — `reset(seconds)` (re)starts the timer
 */
export function useCountdown(initialSeconds = 0) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [secondsLeft]);

  const reset = useCallback((seconds: number) => {
    setSecondsLeft(Math.max(0, seconds));
  }, []);

  return { secondsLeft, reset };
}
