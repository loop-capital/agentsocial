// BigDBM API Adapter for TaskLinkr
// Service for querying consumer data with income filtering and PQL scoring

import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Type definitions for BigDBM API responses
export interface BigDBMContact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumbers: Array<{
    number: string;
    type: 'mobile' | 'home' | 'work' | 'other';
    isPrimary: boolean;
  }>;
  addresses: Array<{
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    type: 'residential' | 'business' | 'other';
  }>;
  demographics: {
    ageRange?: string;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    incomeRange?: string;
    educationLevel?: string;
    occupation?: string;
    maritalStatus?: string;
  };
  pqlScore: number; // Predictive Quality Lead score (0-100)
  dataQuality: {
    completeness: number; // 0-100
    recency: number; // 0-100 (days since last update)
    confidence: number; // 0-100
  };
  lastUpdated: string; // ISO timestamp
}

export interface BigDBMSearchResponse {
  contacts: BigDBMContact[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  query: string;
  facets?: {
    incomeRanges: Array<{ range: string; count: number }>;
    ageRanges: Array<{ range: string; count: number }>;
    locations: Array<{ location: string; count: number }>;
  };
}

export interface BigDBMPricingTier {
  name: string;
  monthlyFee: number;
  creditsIncluded: number;
  overageRate: number; // cost per credit over limit
  features: string[];
}

export interface BigDBMPricingResponse {
  tiers: BigDBMPricingTier[];
  payAsYouGo: {
    ratePerCredit: number;
    volumeDiscounts: Array<{ minQuantity: number; ratePerCredit: number }>;
  };
  enterprise: {
    customPricing: boolean;
    contactRequired: boolean;
    minMonthlyCommitment: number;
  };
  currency: string;
  lastUpdated: string; // ISO timestamp
}

export interface BigDMBCreditPurchaseResponse {
  success: boolean;
  transactionId: string;
  creditsAdded: number;
  newBalance: number;
  amountCharged: number;
  currency: string;
  timestamp: string; // ISO timestamp
  receiptUrl?: string;
}

export interface BigDBMAccountInfo {
  balance: number;
  currency: string;
  creditsUsedToday: number;
  creditsUsedThisMonth: number;
  accountStatus: 'active' | 'suspended' | 'closed' | 'pending_verification';
  tier: 'free' | 'starter' | 'growth' | 'enterprise';
  lastUpdated: string; // ISO timestamp
}

// Search parameters interface
export interface BigDBMSearchParams {
  query?: string;
  minIncome?: number; // minimum annual income in USD
  maxIncome?: number; // maximum annual income in USD
  limit?: number; // default: 10
  offset?: number; // default: 0
  fields?: Array<'id' | 'firstName' | 'lastName' | 'email' | 'phoneNumbers' | 'addresses' | 'demographics' | 'pqlScore'>;
  includeDataQuality?: boolean;
}

export class BigDBMAdapter {
  private axiosInstance: AxiosInstance;
  
  constructor() {
    const apiKey = process.env.BIGDBM_API_KEY;
    const apiSecret = process.env.BIGDBM_API_SECRET;
    const baseURL = process.env.BIGDBM_BASE_URL || 'https://api.bigdbm.com/v1';
    
    if (!apiKey || !apiSecret) {
      console.warn('BigDBM API credentials not configured');
    }
    
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // Add request interceptor for logging
    this.axiosInstance.interceptors.request.use((config) => {
      // console.log(`BigDBM API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });
    
    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          // Server responded with error status
          console.error(`BigDBM API Error: ${error.response.status} - ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`);
        } else if (error.request) {
          // Request made but no response
          console.error('BigDBM API Error: No response received');
        } else {
          // Something else caused error
          console.error('BigDBM API Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Search for consumer contacts with filtering options
   * @param {BigDBMSearchParams} params - Search parameters
   * @returns {Promise<BigDBMSearchResponse>} Search results with contacts and metadata
   */
  async searchContacts(params: BigDBMSearchParams = {}): Promise<BigDBMSearchResponse> {
    try {
      const {
        query = '',
        minIncome,
        maxIncome,
        limit = 10,
        offset = 0,
        fields,
        includeDataQuality = false
      } = params;

      // Build search payload according to BigDBM API specification
      const searchParams: any = {
        q: query,
        limit,
        offset
      };

      // Add income filters if specified (BigDBM uses annual income in USD)
      if (minIncome !== undefined || maxIncome !== undefined) {
        searchParams.income_filter = {
          min: minIncome,
          max: maxIncome
        };
        // Remove undefined values
        if (searchParams.income_filter.min === undefined) delete searchParams.income_filter.min;
        if (searchParams.income_filter.max === undefined) delete searchParams.income_filter.max;
      }

      // Add field selection if specified
      if (fields && fields.length > 0) {
        searchParams.fields = fields.join(',');
      }

      // Include data quality metrics if requested
      if (includeDataQuality) {
        searchParams.include_data_quality = true;
      }

      const response: AxiosResponse<BigDBMSearchResponse> = await this.axiosInstance.post(
        '/contacts/search',
        searchParams
      );

      // Transform and validate response
      const result = response.data;
      
      // Ensure we have the expected structure
      return {
        contacts: result.contacts || [],
        total: result.total || 0,
        limit: result.limit || limit,
        offset: result.offset || offset,
        hasMore: result.hasMore !== undefined ? result.hasMore : 
                 ((result.offset || 0) + (result.contacts || []).length) < (result.total || 0),
        query: result.query || query,
        facets: result.facets
      };
    } catch (error: any) {
      console.error('Error searching BigDBM contacts:', error.response?.data || error.message);
      
      // Provide more specific error messages based on HTTP status
      if (error.response) {
        switch (error.response.status) {
          case 401:
            throw new Error('BigDBM authentication failed - check API credentials');
          case 402:
            throw new Error('Insufficient BigDBM credits - purchase more credits');
          case 403:
            throw new Error('BigDBM access forbidden - check account permissions');
          case 429:
            throw new Error('BigDBM rate limit exceeded - try again later');
          case 500:
            throw new Error('BigDBM internal server error - try again later');
          default:
            throw new Error(`BigDBM search failed: ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`);
        }
      } else {
        throw new Error(`BigDBM search failed: ${error.message || 'Network error'}`);
      }
    }
  }

  /**
   * Get pricing information for BigDBM services
   * @returns {Promise<BigDBMPricingResponse>} Pricing tiers and costs
   */
  async getPricing(): Promise<BigDBMPricingResponse> {
    try {
      const response: AxiosResponse<BigDBMPricingResponse> = await this.axiosInstance.get('/pricing');
      
      // Validate and return pricing data
      return {
        tiers: response.data.tiers || [],
        payAsYouGo: response.data.payAsYouGo || {
          ratePerCredit: 0,
          volumeDiscounts: []
        },
        enterprise: response.data.enterprise || {
          customPricing: true,
          contactRequired: true,
          minMonthlyCommitment: 0
        },
        currency: response.data.currency || 'USD',
        lastUpdated: response.data.lastUpdated || new Date().toISOString()
      };
    } catch (error: any) {
      console.error('Error fetching BigDBM pricing:', error.response?.data || error.message);
      throw new Error(`Failed to fetch BigDBM pricing: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Purchase credits for BigDBM API usage
   * @param {Object} params - Purchase parameters
   * @param {number} params.amount - Amount of credits to purchase
   * @param {string} params.tier - Pricing tier (optional)
   * @param {string} params.paymentMethodId - Payment method identifier (required)
   * @returns {Promise<BigDMBCreditPurchaseResponse>} Purchase confirmation and transaction details
   */
  async purchaseCredits(params: { 
    amount: number; 
    tier?: string; 
    paymentMethodId: string 
  }): Promise<BigDMBCreditPurchaseResponse> {
    try {
      const { amount, tier, paymentMethodId } = params;
      
      // Validate required parameters
      if (!amount || amount <= 0) {
        throw new Error('Valid amount (> 0) is required for credit purchase');
      }
      
      if (!paymentMethodId || paymentMethodId.trim() === '') {
        throw new Error('Payment method ID is required');
      }

      const purchaseData: any = {
        amount,
        payment_method_id: paymentMethodId
      };

      // Add tier if specified
      if (tier) {
        purchaseData.tier = tier;
      }

      const response: AxiosResponse<BigDMBCreditPurchaseResponse> = await this.axiosInstance.post(
        '/credits/purchase',
        purchaseData
      );

      // Validate response
      const result = response.data;
      
      return {
        success: result.success !== undefined ? result.success : true,
        transactionId: result.transactionId || '',
        creditsAdded: result.creditsAdded || 0,
        newBalance: result.newBalance || 0,
        amountCharged: result.amountCharged || 0,
        currency: result.currency || 'USD',
        timestamp: result.timestamp || new Date().toISOString(),
        receiptUrl: result.receiptUrl
      };
    } catch (error: any) {
      console.error('Error purchasing BigDBM credits:', error.response?.data || error.message);
      
      // Handle specific error cases
      if (error.response) {
        switch (error.response.status) {
          case 402:
            throw new Error('Payment required - insufficient funds or invalid payment method');
          case 400:
            throw new Error(`Invalid purchase request: ${error.response.data?.error || error.response.data?.message}`);
          case 401:
            throw new Error('Authentication failed - check API credentials');
          default:
            throw new Error(`BigDBM credit purchase failed: ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`);
        }
      } else {
        throw new Error(`BigDBM credit purchase failed: ${error.message || 'Network error'}`);
      }
    }
  }

  /**
   * Get current account balance and usage statistics
   * @returns {Promise<BigDBMAccountInfo>} Account balance and usage
   */
  async getAccountInfo(): Promise<BigDBMAccountInfo> {
    try {
      const response: AxiosResponse<BigDBMAccountInfo> = await this.axiosInstance.get('/account');
      
      // Validate and return account info
      return {
        balance: response.data.balance || 0,
        currency: response.data.currency || 'USD',
        creditsUsedToday: response.data.creditsUsedToday || 0,
        creditsUsedThisMonth: response.data.creditsUsedThisMonth || 0,
        accountStatus: response.data.accountStatus || 'active',
        tier: response.data.tier || 'free',
        lastUpdated: response.data.lastUpdated || new Date().toISOString()
      };
    } catch (error: any) {
      console.error('Error fetching BigDBM account info:', error.response?.data || error.message);
      throw new Error(`Failed to fetch BigDBM account info: ${error.response?.data?.error || error.message}`);
    }
  }
}

// Export singleton instance for convenience
const bigDBMAdapter = new BigDBMAdapter();
export default bigDBMAdapter;