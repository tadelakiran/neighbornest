import '@testing-library/jest-dom/vitest';

/**
 * Global Vitest setup.
 * - Extends `expect` with jest-dom matchers (toBeInTheDocument, etc.).
 * - `matchMedia` is used by the magnetic Button and reduced-motion checks;
 *   jsdom does not implement it, so provide a no-op stub.
 */
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}
