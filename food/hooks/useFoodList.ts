import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import type { FoodListItem, GetFoodsParams, SortBy } from '@/types';

interface UseFoodListOptions {
  initialSortBy?: SortBy;
  pageSize?: number;
}

export function useFoodList(options: UseFoodListOptions = {}) {
  const { initialSortBy = 'expiry_date', pageSize = 20 } = options;
  
  const [foods, setFoods] = useState<FoodListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  // 筛选和排序状态
  const [sortBy, setSortBy] = useState<SortBy>(initialSortBy);
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>();
  const [locationFilter, setLocationFilter] = useState<number | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchFoods = useCallback(async (params: {
    page?: number;
    reset?: boolean;
    showLoading?: boolean;
  } = {}) => {
    const { page = 1, reset = false, showLoading = true } = params;
    
    if (showLoading) {
      setLoading(true);
    }
    setError(null);

    try {
      const requestParams: GetFoodsParams = {
        page,
        limit: pageSize,
        sortBy,
        categoryId: categoryFilter,
        locationId: locationFilter,
        status: statusFilter,
        search: searchQuery || undefined,
      };

      const response = await apiClient.getFoods(requestParams);
      
      if (reset || page === 1) {
        setFoods(response.items);
      } else {
        setFoods(prev => [...prev, ...response.items]);
      }
      
      setCurrentPage(page);
      setTotalCount(response.total);
      setHasMore(response.items.length === pageSize && foods.length + response.items.length < response.total);
      
    } catch (err) {
      console.error('Failed to fetch foods:', err);
      setError(err instanceof Error ? err.message : '获取食物列表失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sortBy, categoryFilter, locationFilter, statusFilter, searchQuery, pageSize, foods.length]);

  // 初始化加载
  useEffect(() => {
    fetchFoods({ page: 1, reset: true });
  }, [sortBy, categoryFilter, locationFilter, statusFilter, searchQuery]);

  // 刷新数据
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFoods({ page: 1, reset: true, showLoading: false });
  }, [fetchFoods]);

  // 加载更多
  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      await fetchFoods({ page: currentPage + 1, reset: false });
    }
  }, [loading, hasMore, currentPage, fetchFoods]);

  // 更新排序
  const updateSort = useCallback((newSortBy: SortBy) => {
    setSortBy(newSortBy);
    setCurrentPage(1);
  }, []);

  // 更新筛选
  const updateFilters = useCallback((filters: {
    categoryId?: number;
    locationId?: number;
    status?: string;
  }) => {
    setCategoryFilter(filters.categoryId);
    setLocationFilter(filters.locationId);
    setStatusFilter(filters.status);
    setCurrentPage(1);
  }, []);

  // 搜索
  const search = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  // 清除筛选
  const clearFilters = useCallback(() => {
    setCategoryFilter(undefined);
    setLocationFilter(undefined);
    setStatusFilter(undefined);
    setSearchQuery('');
    setCurrentPage(1);
  }, []);

  return {
    // 数据
    foods,
    loading,
    refreshing,
    error,
    hasMore,
    totalCount,
    
    // 筛选状态
    sortBy,
    categoryFilter,
    locationFilter,
    statusFilter,
    searchQuery,
    
    // 操作方法
    refresh,
    loadMore,
    updateSort,
    updateFilters,
    search,
    clearFilters,
  };
}