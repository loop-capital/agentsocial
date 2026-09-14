/**
 * useBlockList Hook
 * Fetch and manage block list data
 */

import { useState, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { blocklistAPI } from '../services/api';
import { BlockListEntry } from '../types';

interface UseBlockListOptions {
  limit?: number;
  minReports?: number;
  threatLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export function useBlockList(options: UseBlockListOptions = {}) {
  const { limit = 50, minReports = 1, threatLevel } = options;

  const fetchBlockList = useCallback(async ({ pageParam = 1 }) => {
    const response = await blocklistAPI.getAll({
      limit,
      minReports,
      threatLevel,
      page: pageParam,
    });

    return {
      data: response.data || [],
      nextPage: pageParam + 1,
      hasMore: (response.data || []).length === limit,
    };
  }, [limit, minReports, threatLevel]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['blocklist', minReports, threatLevel],
    queryFn: fetchBlockList,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextPage : undefined,
    initialPageParam: 1,
  });

  const blockList = data?.pages.flatMap((page) => page.data) || [];

  return {
    blockList: blockList as BlockListEntry[],
    isLoading,
    hasMore: hasNextPage || false,
    loadMore: fetchNextPage,
    isLoadingMore: isFetchingNextPage,
    refetch,
  };
}
