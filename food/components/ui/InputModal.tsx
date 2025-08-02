import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';

interface InputModalProps {
  visible: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function InputModal({
  visible,
  title,
  message,
  placeholder,
  defaultValue = '',
  onConfirm,
  onCancel,
}: InputModalProps) {
  const { theme } = useTheme();
  const [value, setValue] = useState(defaultValue);

  const handleConfirm = () => {
    onConfirm(value);
    setValue('');
  };

  const handleCancel = () => {
    onCancel();
    setValue('');
  };

  return (
    <Modal
      visible={visible}
      onClose={handleCancel}
      title={title}
    >
      <View style={styles.content}>
        {message && (
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
            {message}
          </Text>
        )}
        
        <Input
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          autoFocus
        />
        
        <View style={styles.buttons}>
          <Button
            title="取消"
            onPress={handleCancel}
            variant="outline"
            style={styles.button}
          />
          <Button
            title="确定"
            onPress={handleConfirm}
            style={styles.button}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: 16,
  },
  message: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
  },
});