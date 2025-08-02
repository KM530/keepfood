// 认证上下文

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/lib/api';
import type { User, AuthState, LoginRequest, RegisterRequest } from '@/types';

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
  updateUser: (data: Partial<User>) => void;
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
    const restoreAuthState = async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        const userStr = await AsyncStorage.getItem('auth_user');

        if (token && userStr) {
          const user = JSON.parse(userStr);
          
          // 验证token是否仍然有效
          try {
            const currentUser = await apiClient.getCurrentUser();
            dispatch({
              type: 'AUTH_RESTORE',
              payload: { user: currentUser, token },
            });
          } catch (error) {
            // Token无效，清除存储
            await AsyncStorage.multiRemove(['auth_token', 'auth_user']);
            dispatch({ type: 'AUTH_LOGOUT' });
          }
        } else {
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } catch (error) {
        console.error('Failed to restore auth state:', error);
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    };

    restoreAuthState();
  }, []);

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
  const updateUser = (data: Partial<User>) => {
    dispatch({ type: 'UPDATE_USER', payload: data });
    
    // 更新存储中的用户信息
    if (state.user) {
      const updatedUser = { ...state.user, ...data };
      AsyncStorage.setItem('auth_user', JSON.stringify(updatedUser));
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