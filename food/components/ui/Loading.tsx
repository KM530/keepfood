// 加载组件

import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/contexts';

export type LoadingSize = 'small' | 'large';
export type LoadingVariant = 'default' | 'overlay' | 'inline';

interface LoadingProps {
  size?: LoadingSize;
  variant?: LoadingVariant;
  text?: string;
  style?: ViewStyle;
}

export function Loading({
  size = 'large',
  variant = 'default',
  text,
  style,
}: LoadingProps) {
  const { theme } = useTheme();

  const getContainerStyle = () => {
    const baseStyle = {
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    };

    switch (variant) {
      case 'overlay':
        return {
          ...baseStyle,
          position: 'absolute' as const,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.colors.backdrop,
          zIndex: 9999,
        };
      case 'inline':
        return {
          ...baseStyle,
          padding: theme.spacing.md,
        };
      default:
        return {
          ...baseStyle,
          flex: 1,
        };
    }
  };

  return (
    <View style={[getContainerStyle(), style]}>
      <ActivityIndicator
        size={size}
        color={theme.colors.primary}
      />
      {text && (
        <Text
          style={{
            marginTop: theme.spacing.md,
            fontSize: theme.fontSize.md,
            color: theme.colors.textSecondary,
            textAlign: 'center',
          }}
        >
          {text}
        </Text>
      )}
    </View>
  );
}

// 页面加载组件
export function PageLoading({ text = '加载中...' }: { text?: string }) {
  return <Loading variant="default" text={text} />;
}

// 覆盖层加载组件
export function OverlayLoading({ text }: { text?: string }) {
  return <Loading variant="overlay" text={text} />;
}

// 内联加载组件
export function InlineLoading({ text, size = 'small' }: { text?: string; size?: LoadingSize }) {
  return <Loading variant="inline" size={size} text={text} />;
}

// 骨架屏组件
interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius,
  style,
}: SkeletonProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: theme.colors.surface,
          borderRadius: borderRadius ?? theme.borderRadius.sm,
        },
        style,
      ]}
    />
  );
}

// 食物卡片骨架屏
export function FoodCardSkeleton() {
  const { theme } = useTheme();

  return (
    <View
      style={{
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        ...theme.shadows.sm,
      }}
    >
      <View style={{ flexDirection: 'row' }}>
        {/* 图片骨架 */}
        <Skeleton
          width={60}
          height={60}
          borderRadius={theme.borderRadius.md}
          style={{ marginRight: theme.spacing.md }}
        />

        {/* 内容骨架 */}
        <View style={{ flex: 1 }}>
          <Skeleton
            width="70%"
            height={18}
            style={{ marginBottom: theme.spacing.xs }}
          />
          <Skeleton
            width="40%"
            height={16}
            style={{ marginBottom: theme.spacing.xs }}
          />
          <View style={{ flexDirection: 'row', marginBottom: theme.spacing.xs }}>
            <Skeleton
              width={60}
              height={24}
              borderRadius={theme.borderRadius.sm}
              style={{ marginRight: theme.spacing.sm }}
            />
            <Skeleton
              width={80}
              height={24}
              borderRadius={theme.borderRadius.sm}
            />
          </View>
          <Skeleton width="50%" height={14} />
        </View>
      </View>
    </View>
  );
}

// 列表骨架屏
interface ListSkeletonProps {
  count?: number;
  itemComponent?: React.ComponentType;
}

export function ListSkeleton({ count = 5, itemComponent: ItemComponent = FoodCardSkeleton }: ListSkeletonProps) {
  return (
    <View>
      {Array.from({ length: count }, (_, index) => (
        <ItemComponent key={index} />
      ))}
    </View>
  );
}