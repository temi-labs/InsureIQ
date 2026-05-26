import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeColor = 'orange' | 'purple' | 'red' | 'burgundy';
type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const themeColors = {
  orange: {
    primary: '#EC5E24',
    primaryDark: '#d6511e',
    primaryLight: '#fff6f3',
    selection: '#EC5E24',
  },
  purple: {
    primary: '#8b5cf6',
    primaryDark: '#7c3aed',
    primaryLight: '#f5f3ff',
    selection: '#8b5cf6',
  },
  red: {
    primary: '#ef4444',
    primaryDark: '#dc2626',
    primaryLight: '#fef2f2',
    selection: '#ef4444',
  },
  burgundy: {
    primary: '#800020',
    primaryDark: '#5c0015',
    primaryLight: '#fdf2f4',
    selection: '#800020',
  }
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeColor, setThemeColor] = useState<ThemeColor>(() => {
    return (localStorage.getItem('themeColor') as ThemeColor) || 'orange';
  });
  
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('themeMode') as ThemeMode) || 'light';
  });

  useEffect(() => {
    localStorage.setItem('themeColor', themeColor);
    const colors = themeColors[themeColor] || themeColors['orange'];
    
    // Apply colors to CSS variables
    document.documentElement.style.setProperty('--color-primary', colors.primary);
    document.documentElement.style.setProperty('--color-primary-dark', colors.primaryDark);
    document.documentElement.style.setProperty('--color-primary-light', colors.primaryLight);
    
    // Apply dark mode
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('themeMode', themeMode);
    
  }, [themeColor, themeMode]);

  return (
    <ThemeContext.Provider value={{ themeColor, setThemeColor, themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
