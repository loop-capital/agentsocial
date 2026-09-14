/**
 * Reports Store
 * Manages spam reports state
 */

import { create } from 'zustand';
import { reportsAPI } from '../services/api';
import { Report, ReportFilters } from '../types';

interface ReportsState {
  reports: Report[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  
  // Actions
  submitReport: (data: Partial<Report>) => Promise<boolean>;
  fetchReports: (filters?: ReportFilters, reset?: boolean) => Promise<void>;
  fetchNextPage: () => Promise<void>;
  clearError: () => void;
}

export const useReportsStore = create<ReportsState>()((set, get) => ({
  reports: [],
  isLoading: false,
  error: null,
  hasMore: true,
  page: 1,

  submitReport: async (data) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await reportsAPI.submit(data);
      
      if (response.success) {
        // Add new report to the list
        set((state) => ({
          reports: [response.data, ...state.reports],
          isLoading: false,
        }));
        return true;
      } else {
        throw new Error(response.message || 'Failed to submit report');
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
      return false;
    }
  },

  fetchReports: async (filters = {}, reset = false) => {
    set({ isLoading: true, error: null });
    
    try {
      const page = reset ? 1 : get().page;
      const response = await reportsAPI.getAll({ ...filters, page, limit: 20 });
      
      if (response.success) {
        set((state) => ({
          reports: reset ? response.data : [...state.reports, ...response.data],
          hasMore: response.data.length === 20,
          page: page + 1,
          isLoading: false,
        }));
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch reports',
        isLoading: false,
      });
    }
  },

  fetchNextPage: async () => {
    if (!get().hasMore || get().isLoading) return;
    await get().fetchReports({}, false);
  },

  clearError: () => set({ error: null }),
}));
