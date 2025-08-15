// 上下文统一导出和组合

import React, { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { AppProvider } from './AppContext';
import { ThemeProvider } from './ThemeContext';
import { LanguageProvider } from './LanguageContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorProvider, useErrorHandler } from './ErrorContext';

// ============= 组合所有Provider =============

interface ProvidersProps {
	children: ReactNode;
}

function BoundaryWrapper({ children }: { children: ReactNode }) {
	const { addError } = useErrorHandler();
	return (
		<ErrorBoundary onError={(error, stack) => addError(error, stack)}>
			{children}
		</ErrorBoundary>
	);
}

export function Providers({ children }: ProvidersProps) {
	return (
		<ErrorProvider>
			<ErrorBoundary onError={(error, stack) => {
				console.error('Root ErrorBoundary caught error:', error, stack);
			}}>
				<ThemeProvider>
					<LanguageProvider>
						<AuthProvider>
							<AppProvider>
								{children}
							</AppProvider>
						</AuthProvider>
					</LanguageProvider>
				</ThemeProvider>
			</ErrorBoundary>
		</ErrorProvider>
	);
}

// ============= 导出所有上下文和Hook =============

export { AuthProvider, useAuth, useAuthGuard } from './AuthContext';
export { AppProvider, useApp } from './AppContext';
export { ThemeProvider, useTheme, useThemedStyles } from './ThemeContext';
export { LanguageProvider, useLanguage } from './LanguageContext';

// ============= 便捷Hook =============

export { useAuth as useAuthContext } from './AuthContext';
export { useApp as useAppContext } from './AppContext';
export { useTheme as useThemeContext } from './ThemeContext';