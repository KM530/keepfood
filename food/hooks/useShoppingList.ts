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
      console.log('Shopping list response:', response);
      
      // 确保响应是数组
      if (Array.isArray(response)) {
        setItems(response);
      } else {
        console.error('Invalid response format:', response);
        setItems([]);
        setError('响应格式不正确');
      }
    } catch (err) {
      console.error('Failed to fetch shopping list:', err);
      setError(err instanceof Error ? err.message : '获取购物清单失败');
      setItems([]); // 确保在错误时设置为空数组
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
        item.id === id ? { ...item, is_checked: completed } : item
      ));

      await apiClient.updateShoppingList({
        updates: [{ id, is_checked: completed }]
      });
    } catch (err) {
      console.error('Failed to toggle shopping item:', err);
      // 回滚乐观更新
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, is_checked: !completed } : item
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
        return update ? { ...item, is_checked: update.completed } : item;
      }));

      // 转换字段名给API
      const apiUpdates = updates.map(u => ({ id: u.id, is_checked: u.completed }));
      await apiClient.updateShoppingList({ updates: apiUpdates });
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

      await apiClient.deleteShoppingItem(id);
    } catch (err) {
      console.error('Failed to delete shopping item:', err);
      // 回滚乐观更新
      setItems(originalItems);
      throw err;
    }
  }, [items]);

  // 清空已完成项目
  const clearCompleted = useCallback(async () => {
    const completedIds = items.filter(item => item.is_checked).map(item => item.id);
    if (completedIds.length === 0) return;

    const originalItems = [...items];
    
    try {
      // 乐观更新
      setItems(prev => prev.filter(item => !item.is_checked));

      await apiClient.updateShoppingList({
        updates: [],
        deletions: completedIds
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
    completed: items.filter(item => item.is_checked).length,
    pending: items.filter(item => !item.is_checked).length,
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