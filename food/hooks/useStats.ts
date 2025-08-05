import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";

interface Stats {
  totalFoods: number;
  expiringFoods: number;
  shoppingItems: number;
}

export function useStats() {
  const [stats, setStats] = useState<Stats>({
    totalFoods: 0,
    expiringFoods: 0,
    shoppingItems: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 获取总食物数
      const foodsResponse = await apiClient.getFoods({ page: 1, limit: 1 });
      const totalFoods = foodsResponse.total;

      // 获取即将过期的食物（7天内过期）
      const expiringResponse = await apiClient.getFoods({ 
        page: 1, 
        limit: 1000, // 获取所有食物来计算即将过期的数量
        status: "active"
      });
      
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const expiringFoods = expiringResponse.items.filter(food => {
        if (!food.expiry_date) return false;
        const expiryDate = new Date(food.expiry_date);
        return expiryDate <= sevenDaysFromNow && expiryDate >= now;
      }).length;

      // 获取购物清单数量
      const shoppingResponse = await apiClient.getShoppingList();
      const shoppingItems = Array.isArray(shoppingResponse) ? shoppingResponse.length : 0;

      setStats({
        totalFoods,
        expiringFoods,
        shoppingItems,
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      setError(err instanceof Error ? err.message : "获取统计数据失败");
    } finally {
      setLoading(false);
    }
  }, []);

  // 刷新统计数据
  const refresh = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh,
  };
}
