// 模态框组件

import React from 'react';
import {
  Modal as RNModal,
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/contexts';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: ModalSize;
  closable?: boolean;
  maskClosable?: boolean;
  animationType?: 'none' | 'slide' | 'fade';
  style?: ViewStyle;
}

export function Modal({
  visible,
  onClose,
  children,
  size = 'md',
  closable = true,
  maskClosable = true,
  animationType = 'fade',
  style,
}: ModalProps) {
  const { theme } = useTheme();

  const handleMaskPress = () => {
    if (maskClosable && closable) {
      onClose();
    }
  };

  const getModalStyle = () => {
    const baseStyle = {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      margin: theme.spacing.md,
      maxHeight: '90%',
    };

    switch (size) {
      case 'sm':
        return { ...baseStyle, width: '70%' };
      case 'md':
        return { ...baseStyle, width: '85%' };
      case 'lg':
        return { ...baseStyle, width: '95%' };
      case 'xl':
        return { ...baseStyle, width: '98%' };
      case 'full':
        return {
          ...baseStyle,
          width: '100%',
          height: '100%',
          margin: 0,
          borderRadius: 0,
        };
      default:
        return { ...baseStyle, width: '85%' };
    }
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={closable ? onClose : undefined}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={handleMaskPress}>
          <View style={[styles.backdrop, { backgroundColor: theme.colors.backdrop }]}>
            <TouchableWithoutFeedback>
              <View style={[getModalStyle(), style]}>
                {children}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});