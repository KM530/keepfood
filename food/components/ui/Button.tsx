// 按钮组件

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '@/contexts';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
}: ButtonProps) {
  const { theme } = useTheme();
  
  const buttonStyle = [
    {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: theme.borderRadius.md,
      gap: theme.spacing.sm,
      // 尺寸
      height: size === 'sm' ? 32 : size === 'lg' ? 48 : 40,
      paddingHorizontal: size === 'sm' ? theme.spacing.sm : theme.spacing.md,
      // 变体样式
      backgroundColor: getButtonBackgroundColor(variant, disabled, loading, theme),
      borderWidth: variant === 'outline' ? 1 : 0,
      borderColor: variant === 'outline' ? (disabled || loading ? theme.colors.border : theme.colors.primary) : 'transparent',
    },
    fullWidth && { width: '100%' },
    style,
  ];

  const buttonTextStyle = [
    {
      fontWeight: theme.fontWeight.semibold,
      textAlign: 'center' as const,
      fontSize: size === 'sm' ? theme.fontSize.sm : size === 'lg' ? theme.fontSize.lg : theme.fontSize.md,
      color: getButtonTextColor(variant, disabled, loading, theme),
    },
    textStyle,
  ];

  const handlePress = () => {
    if (!disabled && !loading) {
      onPress();
    }
  };

  const getActivityIndicatorColor = () => {
    if (variant === 'primary' || variant === 'secondary' || variant === 'danger') {
      return theme.colors.white;
    }
    return theme.colors.primary;
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getActivityIndicatorColor()}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <>{icon}</>
          )}
          <Text style={buttonTextStyle}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <>{icon}</>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

// 辅助函数
function getButtonBackgroundColor(variant: ButtonVariant, disabled: boolean, loading: boolean, theme: any) {
  if (disabled || loading) {
    return theme.colors.border;
  }
  
  switch (variant) {
    case 'primary':
      return theme.colors.primary;
    case 'secondary':
      return theme.colors.secondary;
    case 'danger':
      return theme.colors.error;
    case 'outline':
    case 'ghost':
      return 'transparent';
    default:
      return theme.colors.primary;
  }
}

function getButtonTextColor(variant: ButtonVariant, disabled: boolean, loading: boolean, theme: any) {
  if (disabled || loading) {
    return theme.colors.textDisabled;
  }
  
  switch (variant) {
    case 'primary':
    case 'secondary':
    case 'danger':
      return theme.colors.white;
    case 'outline':
    case 'ghost':
      return theme.colors.primary;
    default:
      return theme.colors.white;
  }
}

// 移除静态样式，改为动态主题样式