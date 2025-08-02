// 上下文统一导出和组合

import React, { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { AppProvider } from './AppContext';
import { ThemeProvider } from './ThemeContext';

// ============= 组合所有Provider =============

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          {children}
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// ============= 导出所有上下文和Hook =============

export { AuthProvider, useAuth, useAuthGuard } from './AuthContext';
export { AppProvider, useApp } from './AppContext';
export { ThemeProvider, useTheme, useThemedStyles } from './ThemeContext';

// ============= 便捷Hook =============

export { useAuth as useAuthContext } from './AuthContext';
export { useApp as useAppContext } from './AppContext';
export { useTheme as useThemeContext } from './ThemeContext';