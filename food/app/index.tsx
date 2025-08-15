import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts';

export default function IndexPage() {
  const { isAuthenticated, loading } = useAuth();
  
  console.log('🏠 IndexPage rendered:', { isAuthenticated, loading });
  
  // 如果正在加载认证状态，显示加载状态
  if (loading) {
    return null; // 返回null，让父组件处理加载状态
  }
  
  // 根据认证状态重定向
  if (isAuthenticated) {
    console.log('🏠 User authenticated, redirecting to tabs');
    return <Redirect href="/(tabs)" />;
  } else {
    console.log('🏠 User not authenticated, redirecting to login');
    return <Redirect href="/login" />;
  }
}

