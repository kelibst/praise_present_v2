import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectTheme, setTheme as setReduxTheme } from './settingSlice';
import { AppDispatch } from './store';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const reduxTheme = useSelector(selectTheme);
  const dispatch = useDispatch<AppDispatch>();
  const [theme, setLocalTheme] = useState<Theme>(reduxTheme);

  // Sync with Redux state
  useEffect(() => {
    setLocalTheme(reduxTheme);
  }, [reduxTheme]);

  // Custom setTheme that updates both local and Redux state
  const setTheme = (newTheme: Theme) => {
    dispatch(setReduxTheme(newTheme));
    setLocalTheme(newTheme);
  };

  // Function to apply theme
  const applyTheme = (newTheme: Theme) => {
    const root = window.document.documentElement;
    
    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.remove('light', 'dark');
      root.classList.add(systemTheme);
    } else {
      root.classList.remove('light', 'dark');
      root.classList.add(newTheme);
    }
  };

  // Apply theme immediately on mount to prevent flash
  useEffect(() => {
    applyTheme(reduxTheme);
  }, []);

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 