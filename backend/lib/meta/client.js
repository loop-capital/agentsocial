/**
 * Meta Graph API Client
 * Wraps calls to Meta's Graph API with auth, retry, and rate-limit handling.
 */

const axios = require('axios');

const META_API_BASE = 'https://graph.facebook.com/v21.0';
const MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000; // 1 second base

class MetaAPIClient {
  constructor() {
    this.token = process.env.META_USER_ACCESS_TOKEN;
    if (!this.token) {
      console.warn('[MetaAPIClient] META_USER_ACCESS_TOKEN not set in environment');
    }
  }

  /**
   * Build headers for Meta API requests
   */
  getHeaders() {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Sleep helper with exponential backoff
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make a request to Meta Graph API with retry logic
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint path
   * @param {object} data - Request body (for POST)
   * @param {object} params - Query parameters
   * @param {number} attempt - Current attempt number (internal)
   */
  async request(method, endpoint, data = null, params = {}, attempt = 1) {
    const url = `${META_API_BASE}/${endpoint}`;
    const headers = this.getHeaders();

    try {
      const response = await axios({
        method,
        url,
        data,
        params,
        headers,
        timeout: 30000,
      });

      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      const status = error.response?.status;
      const metaError = error.response?.data?.error || {};

      // Rate limiting — retry after specified time
      if (status === 429) {
        const retryAfter = error.response?.headers?.['retry-after'];
        const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : 60000;

        if (attempt < MAX_RETRIES) {
          console.log(`[MetaAPI] Rate limited (429). Retry ${attempt + 1}/${MAX_RETRIES} in ${delay}ms`);
          await this.sleep(delay);
          return this.request(method, endpoint, data, params, attempt + 1);
        }

        return {
          success: false,
          error: metaError.message || 'Rate limited',
          status: 429,
          retryAfter: delay,
        };
      }

      // 5xx errors — retry with exponential backoff
      if (status >= 500 && status < 600 && attempt < MAX_RETRIES) {
        const delay = DEFAULT_RETRY_DELAY * Math.pow(2, attempt - 1);
        console.log(`[MetaAPI] Server error ${status}. Retry ${attempt + 1}/${MAX_RETRIES} in ${delay}ms`);
        await this.sleep(delay);
        return this.request(method, endpoint, data, params, attempt + 1);
      }

      // 4xx errors — return immediately (client error)
      if (status && status >= 400 && status < 500) {
        return {
          success: false,
          error: metaError.message || `Meta API error ${status}`,
          status,
          type: metaError.type || null,
          code: metaError.code || null,
        };
      }

      // Network errors
      return {
        success: false,
        error: error.message || 'Network error',
        status: 0,
      };
    }
  }

  get(endpoint, params = {}) {
    return this.request('GET', endpoint, null, params);
  }

  post(endpoint, data) {
    return this.request('POST', endpoint, data, {});
  }
}

module.exports = new MetaAPIClient();
