import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import type { ShoppingListItem as ShoppingItem } from '@/types';

interface ShoppingListItemProps {
  item: ShoppingItem;
  onToggle: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: number, selected: boolean) => void;
}

export function ShoppingListItem({
  item,
  onToggle,
  onDelete,
  selectable = false,
  selected = false,
  onSelect,
}: ShoppingListItemProps) {
  const { theme } = useTheme();

  const handleToggle = () => {
    onToggle(item.id, !item.is_checked);
  };

  const handleSelect = () => {
    if (selectable && onSelect) {
      onSelect(item.id, !selected);
    }
  };

  const handleDelete = () => {
    onDelete(item.id);
  };

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
      }
    ]}>
      {/* 选择框（批量操作模式） */}
      {selectable && (
        <TouchableOpacity
          style={styles.selectButton}
          onPress={handleSelect}
        >
          <Ionicons
            name={selected ? 'checkbox' : 'square-outline'}
            size={24}
            color={selected ? theme.colors.primary : theme.colors.textSecondary}
          />
        </TouchableOpacity>
      )}

      {/* 完成状态按钮 */}
      <TouchableOpacity
        style={styles.checkButton}
        onPress={handleToggle}
      >
        <Ionicons
          name={item.is_checked ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={item.is_checked ? '#4CAF50' : theme.colors.textSecondary}
        />
      </TouchableOpacity>

      {/* 内容区域 */}
      <TouchableOpacity
        style={styles.content}
        onPress={selectable ? handleSelect : handleToggle}
        activeOpacity={0.7}
      >
        <View style={styles.itemInfo}>
          <Text style={[
            styles.itemName,
            {
              color: item.is_checked ? theme.colors.textSecondary : theme.colors.text,
              textDecorationLine: item.is_checked ? 'line-through' : 'none',
            }
          ]}>
            {item.item_name}
          </Text>
          
          {item.quantity && (
            <Text style={[
              styles.itemQuantity,
              {
                color: item.is_checked ? theme.colors.textSecondary : theme.colors.textSecondary,
                textDecorationLine: item.is_checked ? 'line-through' : 'none',
              }
            ]}>
              {item.quantity}{item.unit ? ` ${item.unit}` : ''}
            </Text>
          )}

          {item.note && (
            <Text style={[
              styles.itemNote,
              {
                color: theme.colors.textSecondary,
                textDecorationLine: item.is_checked ? 'line-through' : 'none',
              }
            ]}>
              {item.note}
            </Text>
          )}
        </View>

        {/* 优先级指示器 */}
        {item.priority && item.priority !== 'normal' && (
          <View style={[
            styles.priorityBadge,
            {
              backgroundColor: item.priority === 'high' ? '#FF5722' : 
                              item.priority === 'medium' ? '#FF9800' : theme.colors.textSecondary,
            }
          ]}>
            <Text style={styles.priorityText}>
              {item.priority === 'high' ? '高' : 
               item.priority === 'medium' ? '中' : '低'}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* 删除按钮 */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDelete}
      >
        <Ionicons
          name="trash-outline"
          size={20}
          color={theme.colors.error}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  selectButton: {
    padding: 4,
  },
  checkButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 14,
    marginBottom: 2,
  },
  itemNote: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
});