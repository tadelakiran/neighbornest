import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (t: 'light' | 'dark') => void;
}

function applyTheme(theme: 'light' | 'dark') {
  const html = document.documentElement;
  if (theme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
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
      name: 'neighbornest.theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    }
  )
);
