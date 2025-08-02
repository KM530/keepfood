import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Layout } from '@/components/ui/Layout';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { ShoppingListItem } from '@/components/ui/ShoppingListItem';
import { useShoppingList } from '@/hooks/useShoppingList';
import type { ShoppingListItem as ShoppingItem } from '@/types';

export default function ShoppingScreen() {
  const { theme } = useTheme();
  const {
    items,
    loading,
    refreshing,
    error,
    stats,
    refresh,
    addItem,
    toggleItem,
    batchUpdate,
    deleteItem,
    clearCompleted,
  } = useShoppingList();

  const [batchMode, setBatchMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // 处理添加新项目
  const handleAddItem = () => {
    Alert.prompt(
      '添加购物项',
      '请输入要购买的物品',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '添加',
          onPress: async (value) => {
            if (!value?.trim()) return;
            
            try {
              await addItem({ name: value.trim() });
            } catch (error) {
              Alert.alert('添加失败', '添加购物项失败，请重试');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  // 处理切换项目状态
  const handleToggleItem = useCallback(async (id: number, completed: boolean) => {
    try {
      await toggleItem(id, completed);
    } catch (error) {
      Alert.alert('操作失败', '更新购物项状态失败');
    }
  }, [toggleItem]);

  // 处理删除项目
  const handleDeleteItem = useCallback(async (id: number) => {
    Alert.alert(
      '删除购物项',
      '确定要删除这个购物项吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem(id);
            } catch (error) {
              Alert.alert('删除失败', '删除购物项失败，请重试');
            }
          },
        },
      ]
    );
  }, [deleteItem]);

  // 处理批量选择
  const handleSelectItem = useCallback((id: number, selected: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  // 切换批量模式
  const toggleBatchMode = () => {
    setBatchMode(!batchMode);
    setSelectedItems(new Set());
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  // 批量标记完成
  const handleBatchComplete = async () => {
    if (selectedItems.size === 0) return;

    try {
      const updates = Array.from(selectedItems).map(id => ({ id, completed: true }));
      await batchUpdate(updates);
      setSelectedItems(new Set());
    } catch (error) {
      Alert.alert('操作失败', '批量操作失败，请重试');
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedItems.size === 0) return;

    Alert.alert(
      '批量删除',
      `确定要删除选中的 ${selectedItems.size} 个购物项吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(Array.from(selectedItems).map(id => deleteItem(id)));
              setSelectedItems(new Set());
            } catch (error) {
              Alert.alert('删除失败', '批量删除失败，请重试');
            }
          },
        },
      ]
    );
  };

  // 清空已完成项目
  const handleClearCompleted = async () => {
    if (stats.completed === 0) return;

    Alert.alert(
      '清空已完成',
      `确定要清空所有 ${stats.completed} 个已完成的购物项吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清空',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearCompleted();
            } catch (error) {
              Alert.alert('清空失败', '清空已完成项目失败，请重试');
            }
          },
        },
      ]
    );
  };

  // 渲染购物项
  const renderShoppingItem = useCallback(({ item }: { item: ShoppingItem }) => (
    <ShoppingListItem
      item={item}
      onToggle={handleToggleItem}
      onDelete={handleDeleteItem}
      selectable={batchMode}
      selected={selectedItems.has(item.id)}
      onSelect={handleSelectItem}
    />
  ), [handleToggleItem, handleDeleteItem, batchMode, selectedItems, handleSelectItem]);

  // 渲染空状态
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="list-outline"
        size={64}
        color={theme.colors.textSecondary}
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        购物清单为空
      </Text>
      <Text style={[styles.emptyDescription, { color: theme.colors.textSecondary }]}>
        添加您需要购买的物品
      </Text>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleAddItem}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.addButtonText}>添加购物项</Text>
      </TouchableOpacity>
    </View>
  );

  // 渲染错误状态
  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Ionicons
        name="alert-circle-outline"
        size={64}
        color={theme.colors.error}
      />
      <Text style={[styles.errorTitle, { color: theme.colors.error }]}>
        加载失败
      </Text>
      <Text style={[styles.errorDescription, { color: theme.colors.textSecondary }]}>
        {error}
      </Text>
      <Button
        title="重试"
        onPress={refresh}
        style={styles.retryButton}
      />
    </View>
  );

  if (loading && items.length === 0) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  return (
    <Layout>
      <SafeAreaView style={styles.container}>
        {/* 头部 */}
        <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              购物清单
            </Text>
            {stats.total > 0 && (
              <Text style={[styles.stats, { color: theme.colors.textSecondary }]}>
                {stats.completed}/{stats.total} 已完成
              </Text>
            )}
          </View>
          
          <View style={styles.headerActions}>
            {stats.total > 0 && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={toggleBatchMode}
              >
                <Ionicons
                  name={batchMode ? "close" : "checkmark-done"}
                  size={24}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleAddItem}
            >
              <Ionicons
                name="add-circle"
                size={28}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 批量操作栏 */}
        {batchMode && (
          <View style={[styles.batchBar, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity
              style={styles.batchAction}
              onPress={toggleSelectAll}
            >
              <Ionicons
                name={selectedItems.size === items.length ? "checkbox" : "square-outline"}
                size={20}
                color={theme.colors.primary}
              />
              <Text style={[styles.batchActionText, { color: theme.colors.primary }]}>
                {selectedItems.size === items.length ? '取消全选' : '全选'}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.selectedCount, { color: theme.colors.textSecondary }]}>
              已选择 {selectedItems.size} 项
            </Text>

            <View style={styles.batchActions}>
              <TouchableOpacity
                style={styles.batchAction}
                onPress={handleBatchComplete}
                disabled={selectedItems.size === 0}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color={selectedItems.size > 0 ? '#4CAF50' : theme.colors.textSecondary}
                />
                <Text style={[
                  styles.batchActionText,
                  { color: selectedItems.size > 0 ? '#4CAF50' : theme.colors.textSecondary }
                ]}>
                  完成
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.batchAction}
                onPress={handleBatchDelete}
                disabled={selectedItems.size === 0}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={selectedItems.size > 0 ? theme.colors.error : theme.colors.textSecondary}
                />
                <Text style={[
                  styles.batchActionText,
                  { color: selectedItems.size > 0 ? theme.colors.error : theme.colors.textSecondary }
                ]}>
                  删除
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {error && items.length === 0 ? (
          renderErrorState()
        ) : (
          <FlatList
            data={items}
            renderItem={renderShoppingItem}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
            contentContainerStyle={[
              styles.listContent,
              items.length === 0 && styles.emptyListContent
            ]}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* 底部操作栏 */}
        {!batchMode && stats.completed > 0 && (
          <View style={[styles.bottomBar, { backgroundColor: theme.colors.background }]}>
            <Button
              title={`清空已完成 (${stats.completed})`}
              onPress={handleClearCompleted}
              variant="outline"
              style={[styles.clearButton, { borderColor: theme.colors.error }]}
            />
          </View>
        )}
      </SafeAreaView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  stats: {
    fontSize: 14,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 4,
  },
  batchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  batchAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  batchActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedCount: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
  },
  batchActions: {
    flexDirection: 'row',
    gap: 16,
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  clearButton: {
    borderColor: '#F44336',
  },
});