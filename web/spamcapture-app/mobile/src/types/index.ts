/**
 * TypeScript Types
 * Type definitions for SpamCapture
 */

// Report types
export interface Report {
  id: string;
  phoneNumber: string;
  callerId?: string;
  type: 'sms' | 'call';
  content?: string;
  screenshotUrl?: string;
  category?: 'spam' | 'scam' | 'phishing' | 'robocall' | 'telemarketing' | 'other';
  timestamp: string;
  userId?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  createdAt: string;
}

export interface ReportFilters {
  type?: 'sms' | 'call';
  phoneNumber?: string;
  category?: string;
  page?: number;
  limit?: number;
}

// Block list types
export interface BlockListEntry {
  id: string;
  phoneNumber: string;
  reportCount: number;
  lastReported: string;
  firstReported: string;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  categories?: string[];
}

export interface BlockListFilters {
  limit?: number;
  minReports?: number;
  threatLevel?: 'low' | 'medium' | 'high' | 'critical';
  page?: number;
}

// User types
export interface User {
  id: string;
  anonymousId: string;
  deviceToken?: string;
  spamsuitId?: string;
  createdAt: string;
}

// Stats types
export interface CommunityStats {
  totalReports: number;
  todayReports: number;
  activeBlocks: number;
  protectedUsers: number;
  totalNumbers: number;
}

export interface TrendingNumber {
  phoneNumber: string;
  reportCount: number;
  category: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Navigation types
export type RootStackParamList = {
  MainTabs: undefined;
  Report: { type: 'sms' | 'call' };
  BlockList: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Report: { type?: 'sms' | 'call' };
  BlockList: undefined;
  Settings: undefined;
};
