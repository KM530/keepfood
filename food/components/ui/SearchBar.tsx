import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: (text: string) => void;
  onClear?: () => void;
}

export function SearchBar({
  placeholder = '搜索食物...',
  value,
  onChangeText,
  onSubmit,
  onClear,
}: SearchBarProps) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = () => {
    onSubmit?.(value);
  };

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: theme.colors.surface,
        borderColor: isFocused ? theme.colors.primary : theme.colors.border,
      }
    ]}>
      <Ionicons
        name="search"
        size={20}
        color={theme.colors.textSecondary}
        style={styles.searchIcon}
      />
      
      <TextInput
        style={[
          styles.input,
          { color: theme.colors.text }
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={handleSubmit}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        returnKeyType="search"
      />
      
      {value.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          style={styles.clearButton}
        >
          <Ionicons
            name="close-circle"
            size={20}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: 8,
    padding: 2,
  },
});