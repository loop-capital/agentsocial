/**
 * API Constants
 * Backend API configuration
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 30000,
  retries: 3,
};

export const API_ENDPOINTS = {
  reports: '/api/reports',
  blocklist: '/api/blocklist',
  users: '/api/users',
  stats: '/api/stats',
  health: '/health',
};
