import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Modal } from './Modal';

interface PickerOption {
  label: string;
  value: string | number;
}

interface PickerProps {
  label: string;
  value?: string | number;
  options: PickerOption[];
  placeholder?: string;
  onValueChange: (value: string | number) => void;
  onAddNew?: () => void;
  required?: boolean;
  error?: string;
}

export function Picker({
  label,
  value,
  options,
  placeholder = '请选择',
  onValueChange,
  onAddNew,
  required = false,
  error,
}: PickerProps) {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (selectedValue: string | number) => {
    onValueChange(selectedValue);
    setIsVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {label}
          {required && <Text style={{ color: theme.colors.error }}> *</Text>}
        </Text>
        {onAddNew && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={onAddNew}
          >
            <Ionicons name="add" size={16} color={theme.colors.primary} />
            <Text style={[styles.addButtonText, { color: theme.colors.primary }]}>
              新增
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.picker,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.error : theme.colors.border,
          }
        ]}
        onPress={() => setIsVisible(true)}
      >
        <Text style={[
          styles.pickerText,
          {
            color: selectedOption ? theme.colors.text : theme.colors.textSecondary,
          }
        ]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>

      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}

      <Modal
        visible={isVisible}
        onClose={() => setIsVisible(false)}
        title={`选择${label}`}
      >
        <ScrollView style={styles.optionsList}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                { borderBottomColor: theme.colors.border }
              ]}
              onPress={() => handleSelect(option.value)}
            >
              <Text style={[
                styles.optionText,
                {
                  color: option.value === value ? theme.colors.primary : theme.colors.text,
                  fontWeight: option.value === value ? '600' : 'normal',
                }
              ]}>
                {option.label}
              </Text>
              {option.value === value && (
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={theme.colors.primary}
                />
              )}
            </TouchableOpacity>
          ))}
          
          {/* 总是显示新增按钮（如果提供了onAddNew） */}
          {onAddNew && (
            <TouchableOpacity
              style={[
                styles.addNewOption,
                { 
                  backgroundColor: theme.colors.surface,
                  borderTopColor: theme.colors.border,
                  borderBottomColor: theme.colors.border
                }
              ]}
              onPress={() => {
                setIsVisible(false);
                onAddNew();
              }}
            >
              <Ionicons
                name="add-circle"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={[styles.addNewText, { color: theme.colors.primary }]}>
                添加新的{label}
              </Text>
            </TouchableOpacity>
          )}
          
          {options.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                暂无选项
              </Text>
            </View>
          )}
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 48,
  },
  pickerText: {
    fontSize: 16,
    flex: 1,
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
  optionsList: {
    maxHeight: 300,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 16,
  },
  emptyAddButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyAddButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addNewOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    marginTop: 8,
    gap: 8,
  },
  addNewText: {
    fontSize: 16,
    fontWeight: '500',
  },
});