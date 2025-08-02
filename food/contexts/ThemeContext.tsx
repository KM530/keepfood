// 主题上下文

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { getTheme, lightTheme, darkTheme, Theme, ThemeMode } from '@/constants/Theme';

interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

const THEME_STORAGE_KEY = 'theme_mode';

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [isLoading, setIsLoading] = useState(true);

  // 从存储加载主题设置
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
          setThemeMode(savedTheme);
        } else {
          // 如果没有保存的主题，使用系统主题
          setThemeMode(systemColorScheme === 'dark' ? 'dark' : 'light');
        }
      } catch (error) {
        console.warn('Failed to load theme from storage:', error);
        setThemeMode(systemColorScheme === 'dark' ? 'dark' : 'light');
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, [systemColorScheme]);

  // 保存主题设置到存储
  const saveTheme = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.warn('Failed to save theme to storage:', error);
    }
  };

  // 切换主题
  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    saveTheme(newMode);
  };

  // 设置特定主题
  const setTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    saveTheme(mode);
  };

  const theme = getTheme(themeMode);
  const isDark = themeMode === 'dark';

  const value: ThemeContextValue = {
    theme,
    themeMode,
    isDark,
    toggleTheme,
    setTheme,
  };

  // 在加载主题时显示空白，避免闪烁
  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// 主题Hook
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// 样式Hook - 提供基于主题的样式创建函数
export function useThemedStyles<T>(
  createStyles: (theme: Theme) => T
): T {
  const { theme } = useTheme();
  return createStyles(theme);
}