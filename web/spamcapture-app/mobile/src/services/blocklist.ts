/**
 * Blocklist API Service
 * Handle block list retrieval and export
 */

import ApiService from './api';
import { ApiResponse } from '../types';

class BlocklistService extends ApiService {
  async getAll(filters: { limit?: number; minReports?: number; threatLevel?: string; page?: number } = {}): 
    Promise<ApiResponse<{ data: BlockListEntry[]; hasMore: boolean }>> {
    const response = await this.client.get<ApiResponse<{ data: BlockListEntry[]; hasMore: boolean }>>(
      API_ENDPOINTS.blocklist,
      { params: filters }
    );
    return response.data;
  }

  async export(format: 'json' | 'csv' | 'txt' = 'json', limit: number = 1000): 
    Promise<any> {
    const response = await this.client.get(
      `${API_ENDPOINTS.blocklist}/export`,
      {
        params: { format, limit },
        responseType: format === 'json' ? 'json' : 'text',
      }
    );
    return response;
  }

  async checkNumbers(phoneNumbers: string[]): Promise<ApiResponse<{ [phone: string]: boolean }>> {
    const response = await this.client.post<ApiResponse<{ [phone: string]: boolean }>>(
      `${API_ENDPOINTS.blocklist}/check`,
      { phoneNumbers }
    );
    return response.data;
  }

  async subscribe(options: { userId?: string; deviceToken: string; threshold?: number }): 
    Promise<ApiResponse<any>> {
    const response = await this.client.post<ApiResponse<any>>(
      `${API_ENDPOINTS.blocklist}/subscribe`,
      options
    );
    return response.data;
  }

  async getStats(): Promise<ApiResponse<any>> {
    const response = await this.client.get<ApiResponse<any>>(
      `${API_ENDPOINTS.blocklist}/stats`
    );
    return response.data;
  }
}

export const blocklistAPI = new BlocklistService();
