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
      setLocations(response);
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