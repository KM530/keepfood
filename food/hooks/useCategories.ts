import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { Category } from '@/types';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getCategories();
      // 为每个分类获取食物数量
      const categoriesWithCount = await Promise.all(
        response.map(async (category) => {
          try {
            const foodsResponse = await apiClient.getFoods({ 
              page: 1, 
              limit: 1, 
              categoryId: category.id 
            });
            return {
              ...category,
              foodCount: foodsResponse.total
            };
          } catch (err) {
            console.error(`Failed to get food count for category ${category.id}:`, err);
            return {
              ...category,
              foodCount: 0
            };
          }
        })
      );
      setCategories(categoriesWithCount);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError(err instanceof Error ? err.message : '获取分类失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  };
}