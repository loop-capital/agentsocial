// BigDBM API Adapter for TaskLinkr
// Service for querying consumer data with income filtering and PQL scoring

const axios = require('axios');

class BigDBMAdapter {
  constructor() {
    this.apiKey = process.env.BIGDBM_API_KEY;
    this.apiSecret = process.env.BIGDBM_API_SECRET;
    this.baseURL = process.env.BIGDBM_BASE_URL || 'https://api.bigdbm.com/v1';
    
    if (!this.apiKey || !this.apiSecret) {
      console.warn('BigDBM API credentials not configured');
    }
    
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Search for consumer contacts with filtering options
   * @param {Object} params - Search parameters
   * @param {string} params.query - Search query (name, phone, email, etc.)
   * @param {number} params.minIncome - Minimum annual income filter
   * @param {number} params.maxIncome - Maximum annual income filter
   * @param {number} params.limit - Maximum results to return (default: 10)
   * @param {number} params.offset - Offset for pagination (default: 0)
   * @param {Array<string>} params.fields - Specific fields to return
   * @returns {Promise<Object>} Search results with contacts and metadata
   */
  async searchContacts(params = {}) {
    try {
      const {
        query = '',
        minIncome,
        maxIncome,
        limit = 10,
        offset = 0,
        fields = []
      } = params;

      // Build search payload
      const searchParams = {
        q: query,
        limit,
        offset
      };

      // Add income filters if specified
      if (minIncome !== undefined || maxIncome !== undefined) {
        searchParams.income_filter = {};
        if (minIncome !== undefined) searchParams.income_filter.min = minIncome;
        if (maxIncome !== undefined) searchParams.income_filter.max = maxIncome;
      }

      // Add field selection if specified
      if (fields.length > 0) {
        searchParams.fields = fields.join(',');
      }

      const response = await this.axiosInstance.post('/contacts/search', searchParams);
      
      // Transform response to standard format
      return {
        contacts: response.data.contacts || [],
        total: response.data.total || 0,
        limit: response.data.limit || limit,
        offset: response.data.offset || offset,
        hasMore: (response.data.offset || 0) + (response.data.contacts || []).length < (response.data.total || 0),
        query: response.data.query || query,
        filters_applied: {
          minIncome,
          maxIncome
        }
      };
    } catch (error) {
      console.error('Error searching BigDBM contacts:', error.response?.data || error.message);
      throw new Error(`BigDBM search failed: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Get pricing information for BigDBM services
   * @returns {Promise<Object>} Pricing tiers and costs
   */
  async getPricing() {
    try {
      const response = await this.axiosInstance.get('/pricing');
      
      return {
        tiers: response.data.tiers || [],
        pay_as_you_go: response.data.pay_as_you_go || {},
        enterprise: response.data.enterprise || {},
        currency: response.data.currency || 'USD',
        last_updated: response.data.last_updated || new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching BigDBM pricing:', error.response?.data || error.message);
      throw new Error(`Failed to fetch BigDBM pricing: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Purchase credits for BigDBM API usage
   * @param {Object} params - Purchase parameters
   * @param {number} params.amount - Amount of credits to purchase
   * @param {string} params.tier - Pricing tier (optional)
   * @param {string} params.paymentMethodId - Payment method identifier
   * @returns {Promise<Object>} Purchase confirmation and transaction details
   */
  async purchaseCredits(params = {}) {
    try {
      const { amount, tier, paymentMethodId } = params;
      
      if (!amount || amount <= 0) {
        throw new Error('Valid amount is required for credit purchase');
      }
      
      if (!paymentMethodId) {
        throw new Error('Payment method ID is required');
      }

      const purchaseData = {
        amount,
        payment_method_id: paymentMethodId
      };

      if (tier) {
        purchaseData.tier = tier;
      }

      const response = await this.axiosInstance.post('/credits/purchase', purchaseData);
      
      return {
        success: true,
        transactionId: response.data.transaction_id,
        creditsAdded: response.data.credits_added,
        newBalance: response.data.new_balance,
        amountCharged: response.data.amount_charged,
        currency: response.data.currency || 'USD',
        timestamp: response.data.timestamp || new Date().toISOString(),
        receiptUrl: response.data.receipt_url
      };
    } catch (error) {
      console.error('Error purchasing BigDBM credits:', error.response?.data || error.message);
      throw new Error(`BigDBM credit purchase failed: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Get current account balance and usage
   * @returns {Promise<Object>} Account balance and usage statistics
   */
  async getAccountInfo() {
    try {
      const response = await this.axiosInstance.get('/account');
      
      return {
        balance: response.data.balance || 0,
        currency: response.data.currency || 'USD',
        creditsUsedToday: response.data.credits_used_today || 0,
        creditsUsedThisMonth: response.data.credits_used_this_month || 0,
        accountStatus: response.data.account_status || 'active',
        tier: response.data.tier || 'free',
        lastUpdated: response.data.last_updated || new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching BigDBM account info:', error.response?.data || error.message);
      throw new Error(`Failed to fetch BigDBM account info: ${error.response?.data?.error || error.message}`);
    }
  }
}

// Export singleton instance
const bigDBMAdapter = new BigDBMAdapter();
module.exports = bigDBMAdapter;

// Also export class for flexibility
module.exports.BigDBMAdapter = BigDBMAdapter;