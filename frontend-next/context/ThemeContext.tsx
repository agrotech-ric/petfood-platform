import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'standard' | 'dark';

const STORAGE_KEY = 'settings.theme';

type ThemeContextType = {
  theme: Theme;
  isDarkTheme: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function readStoredTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'standard';
  } catch {
    return 'standard';
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export function initTheme() {
  applyTheme(readStoredTheme());
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme());

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  const setTheme = (next: Theme) => setThemeState(next);

  const toggleTheme = () => {
    setThemeState((current) => (current === 'dark' ? 'standard' : 'dark'));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDarkTheme: theme === 'dark',
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
