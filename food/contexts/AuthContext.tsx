// 认证上下文

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/lib/api';
import type { User, AuthState, LoginRequest, RegisterRequest, ChangePasswordRequest } from '@/types';

// ============= 认证状态管理 =============

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_RESTORE'; payload: { user: User; token: string } }
  | { type: 'UPDATE_USER'; payload: Partial<User> };

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true, // 初始时为true，等待从存储恢复状态
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null,
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      };

    case 'AUTH_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: action.payload,
      };

    case 'AUTH_LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null,
      };

    case 'AUTH_RESTORE':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
        loading: false,
        error: null,
      };

    default:
      return state;
  }
}

// ============= 认证上下文 =============

interface AuthContextValue {
  // 状态
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;

  // 方法
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: FormData) => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============= 认证提供者 =============

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 从存储恢复认证状态
  useEffect(() => {
    const restoreAuth = async () => {
      try {
        const [token, userData] = await Promise.all([
          AsyncStorage.getItem('auth_token'),
          AsyncStorage.getItem('auth_user')
        ]);

        if (token && userData) {
          try {
            const user = JSON.parse(userData);
            // 验证token是否有效
            try {
              const currentUser = await apiClient.getCurrentUser();
              dispatch({ type: 'AUTH_RESTORE', payload: { user: currentUser, token } });
            } catch (apiError) {
              console.warn('Token validation failed:', apiError);
              // Token无效，清除存储并设置为未认证状态
              await Promise.all([
                AsyncStorage.removeItem('auth_token'),
                AsyncStorage.removeItem('auth_user')
              ]);
              dispatch({ type: 'AUTH_FAILURE', payload: '令牌已过期，请重新登录' });
            }
          } catch (parseError) {
            console.warn('Failed to parse user data:', parseError);
            // 数据损坏时清除存储
            await Promise.all([
              AsyncStorage.removeItem('auth_token'),
              AsyncStorage.removeItem('auth_user')
            ]);
            dispatch({ type: 'AUTH_FAILURE', payload: '认证数据损坏' });
          }
        } else {
          dispatch({ type: 'AUTH_FAILURE', payload: '未找到认证信息' });
        }
      } catch (error) {
        console.warn('Failed to restore auth from storage:', error);
        // 存储访问失败时设置为未认证状态
        dispatch({ type: 'AUTH_FAILURE', payload: '无法访问存储' });
      }
    };

    restoreAuth();
  }, []);

  // 处理认证错误
  const handleAuthError = useCallback((error: string) => {
    console.warn('Authentication error:', error);
    
    // 清除认证状态
    dispatch({ type: 'AUTH_LOGOUT' });
    
    // 跳转到登录页面
    if (typeof window !== 'undefined') {
      // Web环境
      window.location.href = '/login';
    } else {
      // React Native环境，通过router跳转
      // 这里需要导入router，但为了避免循环依赖，我们通过其他方式处理
      console.log('Redirecting to login page...');
    }
  }, []);

  // 监听API客户端的认证失效事件
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // 检查API客户端是否标记为认证失效
        if (apiClient.http.authExpired) {
          console.warn('API client marked as auth expired, logging out...');
          handleAuthError('令牌已过期，请重新登录');
          // 重置标志
          apiClient.http.authExpired = false;
        }
      } catch (error) {
        console.warn('Failed to check auth status:', error);
      }
    };

    // 定期检查认证状态
    const interval = setInterval(checkAuthStatus, 1000);
    return () => clearInterval(interval);
  }, [handleAuthError]);

  // 登录
  const login = async (credentials: LoginRequest) => {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await apiClient.login(credentials);
      
      // 保存到存储
      await AsyncStorage.setItem('auth_token', response.token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(response.user));

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          token: response.token,
        },
      });
    } catch (error: any) {
      const errorMessage = error.message || '登录失败';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // 注册
  const register = async (data: RegisterRequest) => {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await apiClient.register(data);
      
      // 保存到存储
      await AsyncStorage.setItem('auth_token', response.token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(response.user));

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          token: response.token,
        },
      });
    } catch (error: any) {
      const errorMessage = error.message || '注册失败';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // 登出
  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      // 即使登出请求失败也要清除本地状态
      console.warn('Logout request failed:', error);
    } finally {
      // 清除存储
      await AsyncStorage.multiRemove(['auth_token', 'auth_user']);
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // 更新用户信息
  const updateUser = async (data: FormData) => {
    try {
      const updatedUser = await apiClient.updateUser(data);
      
      // 更新状态
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
      
      // 更新存储中的用户信息
      if (state.user) {
        const newUser = { ...state.user, ...updatedUser };
        await AsyncStorage.setItem('auth_user', JSON.stringify(newUser));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新用户信息失败';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // 修改密码
  const changePassword = async (data: ChangePasswordRequest) => {
    try {
      await apiClient.changePassword(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '修改密码失败';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // 清除错误
  const clearError = () => {
    if (state.error) {
      dispatch({ type: 'AUTH_FAILURE', payload: '' });
    }
  };

  const value: AuthContextValue = {
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    updateUser,
    changePassword,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============= 认证Hook =============

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ============= 认证守卫Hook =============

export function useAuthGuard() {
  const { isAuthenticated, loading } = useAuth();

  return {
    isAuthenticated,
    loading,
    canAccess: isAuthenticated && !loading,
  };
}