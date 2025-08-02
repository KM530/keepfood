// 输入框组件

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/contexts';

export type InputVariant = 'default' | 'filled' | 'outline';
export type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  variant?: InputVariant;
  size?: InputSize;
  disabled?: boolean;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
}

export function Input({
  label,
  error,
  hint,
  variant = 'outline',
  size = 'md',
  disabled = false,
  required = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  labelStyle,
  ...textInputProps
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const { theme } = useTheme();

  const containerStyles = [
    {
      marginBottom: theme.spacing.md,
    },
    containerStyle,
  ];

  const inputContainerStyles = [
    {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      borderRadius: theme.borderRadius.md,
      height: size === 'sm' ? 32 : size === 'lg' ? 48 : 40,
      paddingHorizontal: theme.spacing.md,
      ...getVariantStyle(variant, theme),
      ...(isFocused && {
        borderColor: theme.colors.primary,
        borderWidth: 2,
      }),
      ...(error && {
        borderColor: theme.colors.error,
        borderWidth: 1,
      }),
      ...(disabled && {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
      }),
    },
  ];

  const inputStyles = [
    {
      flex: 1,
      fontSize: size === 'sm' ? theme.fontSize.sm : size === 'lg' ? theme.fontSize.lg : theme.fontSize.md,
      color: theme.colors.text,
      padding: 0,
      ...(disabled && { color: theme.colors.textDisabled }),
      ...(leftIcon && { marginLeft: theme.spacing.sm }),
      ...(rightIcon && { marginRight: theme.spacing.sm }),
    },
    inputStyle,
  ];

  const labelStyles = [
    {
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.semibold,
      color: error ? theme.colors.error : theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    labelStyle,
  ];

  return (
    <View style={containerStyles}>
      {label && (
        <Text style={labelStyles}>
          {label}
          {required && <Text style={{ color: theme.colors.error }}> *</Text>}
        </Text>
      )}
      
      <View style={inputContainerStyles}>
        {leftIcon && (
          <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          {...textInputProps}
          style={inputStyles}
          editable={!disabled}
          onFocus={(e) => {
            setIsFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            textInputProps.onBlur?.(e);
          }}
          placeholderTextColor={theme.colors.textHint}
        />
        
        {rightIcon && (
          <TouchableOpacity
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              padding: theme.spacing.xs,
            }}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {(error || hint) && (
        <Text style={{
          fontSize: theme.fontSize.sm,
          color: error ? theme.colors.error : theme.colors.textHint,
          marginTop: theme.spacing.xs,
        }}>
          {error || hint}
        </Text>
      )}
    </View>
  );
}

function getVariantStyle(variant: InputVariant, theme: any) {
  switch (variant) {
    case 'filled':
      return {
        backgroundColor: theme.colors.surface,
        borderWidth: 0,
      };
    case 'outline':
      return {
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
      };
    default:
      return {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
      };
  }
}

// 移除静态样式，改为动态主题样式