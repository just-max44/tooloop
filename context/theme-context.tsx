import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

export type ThemeScheme = 'light' | 'dark' | 'auto';

const THEME_STORAGE_KEY = 'tooloop_theme_preference';

interface ThemeContextProps {
  scheme: ThemeScheme;
  setScheme: (scheme: ThemeScheme) => void;
}

const ThemeContext = createContext<ThemeContextProps>({ scheme: 'auto', setScheme: () => {} });

type ThemeProviderProps = { children: React.ReactNode };
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemScheme = useRNColorScheme();
  const [scheme, setSchemeState] = useState<ThemeScheme>('auto');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'auto') {
        setSchemeState(saved);
      }
    });
  }, []);

  const setScheme = (next: ThemeScheme) => {
    setSchemeState(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, next);
  };

  const effectiveScheme = scheme === 'auto' ? (systemScheme === 'dark' ? 'dark' : 'light') : scheme;

  return (
    <ThemeContext.Provider value={{ scheme: effectiveScheme, setScheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeScheme = () => useContext(ThemeContext);