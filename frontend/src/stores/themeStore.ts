import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (t: 'light' | 'dark') => void;
}

/**
 * Applies the active theme to the <html> element.
 * Both the `.dark` class AND the `data-theme` attribute are set — components
 * in the codebase use `dark:` variants and `[data-theme="dark"]` selectors.
 */
function applyTheme(theme: 'light' | 'dark'): void {
  const html = document.documentElement;
  if (theme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  html.setAttribute('data-theme', theme);
}

/**
 * Theme store — Blue Dynasty is dark-first, so the default is 'dark'.
 * The key is versioned (`v2`) so users carrying a stale 'light' preference
 * from the old design get the new dark default instead of a white flash.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      toggleTheme: () =>
        set((s) => {
          const next = s.theme === 'light' ? 'dark' : 'light';
          applyTheme(next);
          return { theme: next };
        }),
      setTheme: (theme) =>
        set(() => {
          applyTheme(theme);
          return { theme };
        }),
    }),
    {
      name: 'neighbornest.theme.v2',
      onRehydrateStorage: () => (state) => {
        // Apply immediately on rehydrate so the theme is correct before paint.
        if (state) applyTheme(state.theme);
      },
    }
  )
);
