/**
 * API Service Base
 * Shared configuration for API calls
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG, API_ENDPOINTS } from '../constants/api';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../store/authStore';

class ApiService {
  protected client: AxiosInstance;
  private authStore: ReturnType<typeof useAuthStore.getState>;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Request interceptor to add auth headers
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await SecureStore.getItemAsync('auth-token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add anonymous user ID header
        const authState = this.authStore || useAuthStore.getState();
        if (authState.userId) {
          config.headers['X-Anonymous-User-Id'] = authState.userId;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        // Log error details in development
        if (__DEV__) {
          console.error('API Error:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            data: error.response?.data,
          });
        }

        // Handle common error cases
        if (error.response) {
          const { status, data } = error.response;
          if (status === 401) {
            // Handle unauthorized
            // TODO: Redirect to login or refresh token
          }
          if (status >= 500) {
            // Handle server errors
            throw new Error('Server unavailable. Please try again later.');
          }
          if (data?.message) {
            throw new Error(data.message);
          }
        }
        
        return Promise.reject(error);
      }
    );

    // Initialize auth store for header injection
    this.authStore = useAuthStore.getState();
  }
}

export default ApiService;
