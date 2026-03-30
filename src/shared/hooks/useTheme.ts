/**
 * Theme management hook for dark mode support
 */

import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'shortshield-theme';

/**
 * Get the system color scheme preference
 */
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return 'light';
}

/**
 * Apply theme to the document
 */
function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;

  root.classList.remove('light', 'dark');
  root.classList.add(resolvedTheme);
}

/**
 * Hook for managing theme state
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      return stored ?? 'system';
    }
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (theme === 'system') {
      return getSystemTheme();
    }
    return theme;
  });

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Keep resolvedTheme in sync with theme
  const currentResolved = theme === 'system' ? getSystemTheme() : theme;
  if (currentResolved !== resolvedTheme) {
    setResolvedTheme(currentResolved);
  }

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      applyTheme('system');
      setResolvedTheme(getSystemTheme());
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    applyTheme(newTheme);
    setResolvedTheme(newTheme === 'system' ? getSystemTheme() : newTheme);
  }, []);

  return {
    theme,
    resolvedTheme,
    setTheme,
    isDark: resolvedTheme === 'dark',
  };
}
