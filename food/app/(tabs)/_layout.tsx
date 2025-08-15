import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, ActivityIndicator, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useTheme } from '@/contexts';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function TabLayout() {
  const { theme } = useTheme();
  const { canAccess, loading, error } = useAuthGuard();

  // 如果正在检查权限，显示加载状态
  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: theme.colors.background
      }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ 
          marginTop: 16, 
          color: theme.colors.text,
          fontSize: 16
        }}>
          正在检查权限...
        </Text>
      </View>
    );
  }

  // 如果有认证错误，显示错误状态
  if (error) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: theme.colors.background
      }}>
        <Ionicons name="warning" size={64} color="#FF6B6B" />
        <Text style={{ 
          marginTop: 16, 
          color: theme.colors.text,
          fontSize: 18,
          fontWeight: 'bold'
        }}>
          认证失败
        </Text>
        <Text style={{ 
          marginTop: 8, 
          color: theme.colors.textSecondary,
          fontSize: 14,
          textAlign: 'center',
          paddingHorizontal: 20
        }}>
          {error}
        </Text>
        <Text style={{ 
          marginTop: 16, 
          color: theme.colors.primary,
          fontSize: 14
        }}>
          正在跳转到登录页面...
        </Text>
      </View>
    );
  }

  // 如果用户没有访问权限，显示空白（等待重定向）
  if (!canAccess) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 10,
          ...Platform.select({
            ios: {
              position: 'absolute',
            },
            default: {},
          }),
        },
        tabBarLabelStyle: {
          fontSize: theme.fontSize.xs,
          fontWeight: theme.fontWeight.medium,
        },
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={24} 
              name={focused ? "house.fill" : "house"} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: '菜谱',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={24} 
              name={focused ? "book.fill" : "book"} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: '购物清单',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={24} 
              name={focused ? "cart.fill" : "cart"} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={24} 
              name={focused ? "person.fill" : "person"} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
