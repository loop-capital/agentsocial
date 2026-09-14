# Meta API Wrapper Specification

## Overview
A secure wrapper service for interacting with Meta's Graph API (specifically for WhatsApp Business/Manus insights) that handles authentication, error handling, rate limiting, and request/response formatting.

## Endpoints
All endpoints are prefixed with `/api/meta`

### GET `/api/meta/:endpoint`
Proxy for GET requests to Meta Graph API
- `:endpoint` - The Graph API path (e.g., `me/whatsapp_business_management`, `5556350478`)
- Query parameters: passed through to Meta API
- Returns: Meta API response data

### POST `/api/meta/:endpoint`
Proxy for POST requests to Meta Graph API
- `:endpoint` - The Graph API path
- Request body: passed through to Meta API
- Returns: Meta API response data

## Authentication
- Uses stored user/system access token with required permissions:
  - `whatsapp_business_management`
  - `whatsapp_business_messaging`
  - `business_management`
- Token stored in environment variables (never in code)
- Automatic token refresh implemented for long-lived tokens

## Error Handling
- Maps Meta API errors to appropriate HTTP status codes
- 4xx errors: returned as-is with Meta error message
- 5xx errors: retry with exponential backoff (max 3 attempts)
- Rate limiting (429): retry after `Retry-After` header or default 60s

## Rate Limiting & Quota Tracking
- Tracks API calls per workspace per day
- Implements per-workspace credit limits for Manus-like operations
- Logs usage for analytics and alerting

## Usage Example
```javascript
// Get WhatsApp Business Account details
const response = await fetch(`/api/meta/me/whatsapp_business_management`);

// Send a message (for testing)
await fetch(`/api/meta/${phoneNumberId}/messages`, {
  method: 'POST',
  body: JSON.stringify({
    messaging_product: 'whatsapp',
    to: recipientNumber,
    type: 'text',
    text: { body: 'Hello from AgentSocial!' }
  })
});
```

## Security Considerations
- Never exposes tokens to client-side code
- Input validation and sanitization
- Audit logging of all API calls
- Environment-specific token storage (dev/staging/prod)

## Implementation Notes
- Built as Express.js middleware or similar
- Uses axios or node-fetch for HTTP requests
- Caching layer for frequently accessed data (business profile, phone number status)
- Health check endpoint: `/api/meta/health`