import { useEffect, useState } from 'react';

interface UseTypewriterOptions {
  /** Delay between characters in ms. Default 28. */
  speed?: number;
  /** Pause before typing begins in ms. Default 250. */
  startDelay?: number;
}

/**
 * Types out `text` character-by-character for an animated header effect.
 * Restarts from the beginning whenever `text` changes.
 *
 * @param text - the full string to type
 * @param options - typing speed and initial delay
 * @returns the currently typed prefix of `text`
 */
export function useTypewriter(text: string, options: UseTypewriterOptions = {}): string {
  const { speed = 28, startDelay = 250 } = options;
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (!text) {
      setTyped('');
      return;
    }

    let index = 0;
    let timeout: number;
    let interval: number;

    const begin = () => {
      interval = window.setInterval(() => {
        index += 1;
        setTyped(text.slice(0, index));
        if (index >= text.length) {
          window.clearInterval(interval);
        }
      }, speed);
    };

    timeout = window.setTimeout(begin, startDelay);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [text, speed, startDelay]);

  return typed;
}
