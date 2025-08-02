import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import type { ShoppingListItem, CreateShoppingItemRequest } from '@/types';

export function useShoppingList() {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取购物清单
  const fetchShoppingList = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await apiClient.getShoppingList();
      setItems(response);
    } catch (err) {
      console.error('Failed to fetch shopping list:', err);
      setError(err instanceof Error ? err.message : '获取购物清单失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 刷新数据
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchShoppingList(false);
  }, [fetchShoppingList]);

  // 添加购物项
  const addItem = useCallback(async (data: CreateShoppingItemRequest) => {
    try {
      const newItem = await apiClient.addShoppingItem(data);
      setItems(prev => [...prev, newItem]);
      return newItem;
    } catch (err) {
      console.error('Failed to add shopping item:', err);
      throw err;
    }
  }, []);

  // 切换购物项完成状态
  const toggleItem = useCallback(async (id: number, completed: boolean) => {
    try {
      // 乐观更新
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, completed } : item
      ));

      await apiClient.updateShoppingList({
        items: [{ id, completed }]
      });
    } catch (err) {
      console.error('Failed to toggle shopping item:', err);
      // 回滚乐观更新
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, completed: !completed } : item
      ));
      throw err;
    }
  }, []);

  // 批量操作
  const batchUpdate = useCallback(async (updates: { id: number; completed: boolean }[]) => {
    const originalItems = [...items];
    
    try {
      // 乐观更新
      setItems(prev => prev.map(item => {
        const update = updates.find(u => u.id === item.id);
        return update ? { ...item, completed: update.completed } : item;
      }));

      await apiClient.updateShoppingList({ items: updates });
    } catch (err) {
      console.error('Failed to batch update shopping items:', err);
      // 回滚乐观更新
      setItems(originalItems);
      throw err;
    }
  }, [items]);

  // 删除购物项
  const deleteItem = useCallback(async (id: number) => {
    const originalItems = [...items];
    
    try {
      // 乐观更新
      setItems(prev => prev.filter(item => item.id !== id));

      await apiClient.updateShoppingList({
        items: [{ id, completed: false }], // 这里需要根据实际API调整
        deleteIds: [id]
      });
    } catch (err) {
      console.error('Failed to delete shopping item:', err);
      // 回滚乐观更新
      setItems(originalItems);
      throw err;
    }
  }, [items]);

  // 清空已完成项目
  const clearCompleted = useCallback(async () => {
    const completedIds = items.filter(item => item.completed).map(item => item.id);
    if (completedIds.length === 0) return;

    const originalItems = [...items];
    
    try {
      // 乐观更新
      setItems(prev => prev.filter(item => !item.completed));

      await apiClient.updateShoppingList({
        items: [],
        deleteIds: completedIds
      });
    } catch (err) {
      console.error('Failed to clear completed items:', err);
      // 回滚乐观更新
      setItems(originalItems);
      throw err;
    }
  }, [items]);

  useEffect(() => {
    fetchShoppingList();
  }, [fetchShoppingList]);

  // 统计信息
  const stats = {
    total: items.length,
    completed: items.filter(item => item.completed).length,
    pending: items.filter(item => !item.completed).length,
  };

  return {
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
  };
}