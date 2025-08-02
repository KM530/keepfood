// 通用页面布局组件

import React from 'react';
import {
  View,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  ViewStyle,
  StatusBar,
} from 'react-native';
import { useTheme } from '@/contexts';

interface LayoutProps {
  children: React.ReactNode;
  scrollable?: boolean;
  safeArea?: boolean;
  padding?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export function Layout({
  children,
  scrollable = false,
  safeArea = true,
  padding = true,
  style,
  contentContainerStyle,
}: LayoutProps) {
  const { theme, isDark } = useTheme();

  const containerStyle = [
    {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    style,
  ];

  const contentStyle = [
    padding && {
      padding: theme.spacing.md,
    },
    contentContainerStyle,
  ];

  const content = scrollable ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[{ flexGrow: 1 }, contentStyle]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, contentStyle]}>
      {children}
    </View>
  );

  const Wrapper = safeArea ? SafeAreaView : View;

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <Wrapper style={containerStyle}>
        {content}
      </Wrapper>
    </>
  );
}

// 页面容器组件
interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  headerRight?: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
}

export function PageContainer({
  children,
  title,
  headerRight,
  scrollable = true,
  style,
}: PageContainerProps) {
  const { theme } = useTheme();

  return (
    <Layout scrollable={scrollable} style={style}>
      {title && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.spacing.lg,
          }}
        >
          <Text
            style={{
              fontSize: theme.fontSize.xxl,
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.text,
            }}
          >
            {title}
          </Text>
          {headerRight}
        </View>
      )}
      {children}
    </Layout>
  );
}