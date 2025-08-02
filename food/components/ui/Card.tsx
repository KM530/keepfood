// 卡片组件

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/contexts';

export type CardVariant = 'default' | 'elevated' | 'outlined';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: number;
  margin?: number;
  borderRadius?: number;
}

export function Card({
  children,
  variant = 'default',
  onPress,
  style,
  padding,
  margin,
  borderRadius,
}: CardProps) {
  const { theme } = useTheme();
  
  const cardStyle = [
    {
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius ?? theme.borderRadius.lg,
      padding: padding ?? theme.spacing.md,
      margin: margin ?? 0,
    },
    getVariantStyle(variant, theme),
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
}

function getVariantStyle(variant: CardVariant, theme: any) {
  switch (variant) {
    case 'elevated':
      return theme.shadows.md;
    case 'outlined':
      return {
        borderWidth: 1,
        borderColor: theme.colors.border,
      };
    default:
      return theme.shadows.sm;
  }
}