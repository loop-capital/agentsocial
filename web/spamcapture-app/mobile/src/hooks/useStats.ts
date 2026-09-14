/**
 * useStats Hook
 * Fetch community statistics
 */

import { useQuery } from '@tanstack/react-query';
import { statsAPI } from '../services/api';

interface StatsData {
  totalReports: number;
  todayReports: number;
  activeBlocks: number;
  protectedUsers: number;
}

interface TrendingNumber {
  phoneNumber: string;
  reportCount: number;
  category: string;
}

export function useStats() {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<StatsData>({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await statsAPI.getOverall();
      return response.data || {
        totalReports: 0,
        todayReports: 0,
        activeBlocks: 0,
        protectedUsers: 0,
      };
    },
  });

  const { data: trending, isLoading: trendingLoading } = useQuery<TrendingNumber[]>({
    queryKey: ['trending'],
    queryFn: async () => {
      const response = await statsAPI.getTrending(5);
      return response.data || [];
    },
  });

  return {
    stats,
    trending,
    isLoading: statsLoading || trendingLoading,
    refetch: async () => {
      await refetchStats();
    },
  };
}
