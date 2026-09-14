/**
 * Reports API Service
 * Handle spam report submissions and retrieval
 */

import ApiService from './api';
import { ApiResponse } from '../types';

class ReportsService extends ApiService {
  async submit(reportData: Partial<ApiResponse['data']>): Promise<ApiResponse<Report>> {
    const response = await this.client.post<ApiResponse<Report>>(
      API_ENDPOINTS.reports,
      reportData
    );
    return response.data;
  }

  async getAll(filters: ReportFilters = {}): Promise<ApiResponse<Report[]>> {
    const response = await this.client.get<ApiResponse<Report[]>>(
      API_ENDPOINTS.reports,
      { params: filters }
    );
    return response.data;
  }

  async getById(id: string): Promise<ApiResponse<Report>> {
    const response = await this.client.get<ApiResponse<Report>>(
      `${API_ENDPOINTS.reports}/${id}`
    );
    return response.data;
  }

  async getByPhoneNumber(phoneNumber: string): Promise<ApiResponse<Report[]>> {
    const response = await this.client.get<ApiResponse<Report[]>>(
      `${API_ENDPOINTS.reports}/phone/${phoneNumber}`
    );
    return response.data;
  }
}

export const reportsAPI = new ReportsService();
