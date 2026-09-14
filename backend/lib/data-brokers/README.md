# BigDBM API Adapter

BigDBM (Big Data Management) API adapter for TaskLinkr platform. This service provides access to consumer data with income filtering and PQL (Predictive Quality Lead) scoring.

## Overview

The BigDBM adapter enables TaskLinkr to:
- Search consumer contacts with income-based filtering
- Query consumer demographics and contact information
- Access PQL scores for lead quality assessment
- Manage API credits and pricing tiers

## Environment Variables

Add these to your `.env` file:

```bash
# BigDBM API Configuration
BIGDBM_API_KEY=your_bigdbm_api_key_here
BIGDBM_API_SECRET=your_bigdbm_api_secret_here
BIGDBM_BASE_URL=https://api.bigdbm.com/v1
```

## Usage

### JavaScript

```javascript
const BigDBMAdapter = require('./lib/data-brokers/bigdbm');

// Using singleton instance
const bigDBM = new BigDBMAdapter();

// Search for contacts
const results = await bigDBM.searchContacts({
  query: 'business owner',
  minIncome: 100000,
  maxIncome: 500000,
  limit: 10,
  fields: ['firstName', 'lastName', 'email', 'phoneNumbers', 'pqlScore']
});

// Get pricing
const pricing = await bigDBM.getPricing();

// Purchase credits
const purchase = await bigDBM.purchaseCredits({
  amount: 1000,
  paymentMethodId: 'pm_card_visa'
});

// Get account info
const account = await bigDBM.getAccountInfo();
```

### TypeScript

```typescript
import BigDBMAdapter, { 
  BigDBMSearchParams, 
  BigDBMSearchResponse,
  BigDBMPricingResponse,
  BigDMBCreditPurchaseResponse,
  BigDBMAccountInfo
} from './lib/data-brokers/bigdbm';

// Using singleton instance
const bigDBM = new BigDBMAdapter();

// Search with full type safety
const params: BigDBMSearchParams = {
  query: 'business owner',
  minIncome: 100000,
  maxIncome: 500000,
  limit: 10
};

const results: BigDBMSearchResponse = await bigDBM.searchContacts(params);
```

## API Methods

### `searchContacts(params: BigDBMSearchParams): Promise<BigDBMSearchResponse>`

Search for consumer contacts with optional income filtering and PQL scoring.

**Parameters:**
- `query` (string, optional): Search query for name, occupation, etc.
- `minIncome` (number, optional): Minimum annual income in USD
- `maxIncome` (number, optional): Maximum annual income in USD
- `limit` (number, optional): Maximum results to return (default: 10)
- `offset` (number, optional): Pagination offset (default: 0)
- `fields` (array, optional): Specific fields to return
- `includeDataQuality` (boolean, optional): Include data quality metrics

**Returns:**
- `contacts`: Array of consumer contact objects
- `total`: Total number of matching records
- `limit`: Current page size
- `offset`: Current offset
- `hasMore`: Whether more results are available
- `facets`: Aggregated data for filtering

### `getPricing(): Promise<BigDBMPricingResponse>`

Get pricing information for BigDBM services.

**Returns:**
- `tiers`: Array of pricing tiers
- `payAsYouGo`: Pay-as-you-go pricing details
- `enterprise`: Enterprise pricing information
- `currency`: Currency code (e.g., 'USD')

### `purchaseCredits(params: { amount: number; tier?: string; paymentMethodId: string }): Promise<BigDMBCreditPurchaseResponse>`

Purchase credits for BigDBM API usage.

**Parameters:**
- `amount` (number, required): Amount of credits to purchase
- `tier` (string, optional): Pricing tier
- `paymentMethodId` (string, required): Payment method identifier

**Returns:**
- `success`: Whether purchase was successful
- `transactionId`: Transaction ID
- `creditsAdded`: Credits added to account
- `newBalance`: Updated account balance
- `amountCharged`: Amount charged
- `receiptUrl`: URL to receipt (if available)

### `getAccountInfo(): Promise<BigDBMAccountInfo>`

Get current account balance and usage statistics.

**Returns:**
- `balance`: Current credit balance
- `creditsUsedToday`: Credits used today
- `creditsUsedThisMonth`: Credits used this month
- `accountStatus`: Account status ('active', 'suspended', 'closed', 'pending_verification')
- `tier`: Current pricing tier

## Type Definitions

See `bigdbm.ts` for full TypeScript interfaces:

- `BigDBMContact`: Consumer contact information
- `BigDBMSearchResponse`: Search results structure
- `BigDBMPricingTier`: Pricing tier details
- `BigDBMPricingResponse`: Full pricing information
- `BigDMBCreditPurchaseResponse`: Credit purchase confirmation
- `BigDBMAccountInfo`: Account status and usage
- `BigDBMSearchParams`: Search parameter options

## Error Handling

The adapter provides specific error messages for common issues:

- `401`: Authentication failed - check API credentials
- `402`: Insufficient credits - purchase more credits
- `403`: Access forbidden - check account permissions
- `429`: Rate limit exceeded - try again later
- `500`: Internal server error - try again later

## Files

- `bigdbm.js` - JavaScript implementation
- `bigdbm.ts` - TypeScript implementation with full type definitions
- `bigdbm.example.js` - Usage examples

## Dependencies

- `axios`: For HTTP requests to BigDBM API

## Notes

- The adapter uses a singleton pattern by default but can also be instantiated
- Income values are in USD (annual)
- PQL scores range from 0-100 (higher is better)
- Rate limits may apply depending on your pricing tier