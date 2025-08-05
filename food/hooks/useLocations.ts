import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { Location } from '@/types';

export function useLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getLocations();
      // 为每个位置获取食物数量
      const locationsWithCount = await Promise.all(
        response.map(async (location) => {
          try {
            const foodsResponse = await apiClient.getFoods({ 
              page: 1, 
              limit: 1, 
              locationId: location.id 
            });
            return {
              ...location,
              foodCount: foodsResponse.total
            };
          } catch (err) {
            console.error(`Failed to get food count for location ${location.id}:`, err);
            return {
              ...location,
              foodCount: 0
            };
          }
        })
      );
      setLocations(locationsWithCount);
    } catch (err) {
      console.error('Failed to fetch locations:', err);
      setError(err instanceof Error ? err.message : '获取位置失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  return {
    locations,
    loading,
    error,
    refetch: fetchLocations,
  };
}