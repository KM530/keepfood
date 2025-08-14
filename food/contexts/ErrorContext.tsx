import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ErrorInfo {
  id: string;
  timestamp: number;
  error: Error;
  componentStack?: string;
  userInfo?: {
    userId?: string;
    screen?: string;
    action?: string;
  };
}

interface ErrorContextType {
  errors: ErrorInfo[];
  addError: (error: Error, componentStack?: string, userInfo?: ErrorInfo['userInfo']) => void;
  clearErrors: () => void;
  clearError: (id: string) => void;
  hasErrors: boolean;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface ErrorProviderProps {
  children: ReactNode;
}

export function ErrorProvider({ children }: ErrorProviderProps) {
  const [errors, setErrors] = useState<ErrorInfo[]>([]);

  const addError = useCallback((
    error: Error, 
    componentStack?: string, 
    userInfo?: ErrorInfo['userInfo']
  ) => {
    const errorInfo: ErrorInfo = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      error,
      componentStack,
      userInfo,
    };

    setErrors(prev => [...prev, errorInfo]);

    // 记录错误到控制台
    console.group('🚨 Global Error Handler');
    console.error('Error:', error);
    console.error('Component Stack:', componentStack);
    console.error('User Info:', userInfo);
    console.error('Timestamp:', new Date(errorInfo.timestamp).toISOString());
    console.groupEnd();

    // 这里可以添加错误上报逻辑
    reportErrorToService(errorInfo);
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const clearError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  }, []);

  const reportErrorToService = useCallback((errorInfo: ErrorInfo) => {
    try {
      // 可以在这里集成错误上报服务
      // 例如 Sentry, Bugsnag, 或者自己的错误收集服务
      
      // 示例：发送到后端API
      if (__DEV__) {
        console.log('Error would be reported to service:', errorInfo);
      } else {
        // 生产环境下的错误上报
        // fetch('/api/errors', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(errorInfo)
        // });
      }
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  }, []);

  const value: ErrorContextType = {
    errors,
    addError,
    clearErrors,
    clearError,
    hasErrors: errors.length > 0,
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useErrorHandler() {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useErrorHandler must be used within an ErrorProvider');
  }
  return context;
}
