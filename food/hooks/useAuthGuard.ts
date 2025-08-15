// 认证守卫Hook

import { useEffect } from 'react';
import { router, useSegments } from 'expo-router';
import { useAuth } from '@/contexts';

export function useAuthGuard() {
  const { isAuthenticated, loading, error } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    // 等待认证状态加载完成
    if (loading) return;

    const currentPath = `/${segments.join('/')}`;
    
    // 定义受保护的路由
    const protectedRoutes = [
      '/(tabs)',
      '/profile',
      '/add-food',
      '/edit-food',
      '/category-management',
      '/location-management',
      '/notification-settings',
    ];

    // 定义认证相关路由
    const authRoutes = ['/login', '/register'];

    // 检查当前路由是否需要认证
    const isProtectedRoute = protectedRoutes.some(route => 
      currentPath.startsWith(route)
    );

    // 检查当前路由是否是认证页面
    const isAuthRoute = authRoutes.some(route => 
      currentPath.startsWith(route)
    );

    // 如果用户未认证且在受保护页面，跳转到登录
    if (!isAuthenticated && isProtectedRoute) {
      console.log('User not authenticated, redirecting to login');
      router.replace('/login');
      return;
    }
    
    // 如果用户已认证且在认证页面，跳转到首页
    if (isAuthenticated && isAuthRoute) {
      console.log('User already authenticated, redirecting to home');
      router.replace('/(tabs)');
      return;
    }

    // 如果有认证错误，跳转到登录页面
    if (error && isProtectedRoute) {
      console.log('Authentication error detected, redirecting to login:', error);
      router.replace('/login');
      return;
    }
  }, [isAuthenticated, loading, error, segments]);

  return {
    isAuthenticated,
    loading,
    error,
    canAccess: isAuthenticated && !loading && !error,
  };
}