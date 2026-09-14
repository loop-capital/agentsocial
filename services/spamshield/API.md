# SpamShield API Documentation

Complete API reference for the SpamShield Blocking Service.

## Base URL

```
Development: http://localhost:3001
Production:  https://api.spamshield.io
```

## Authentication

All API requests require an API key in the header:

```
X-API-Key: your_api_key
```

For testing, use `demo_key`.

## Response Format

All responses follow this structure:

```json
{
  "success": true|false,
  "data": { ... },      // On success
  "error": "...",        // On error
  "message": "..."       // On error
}
```

## Endpoints

### Check Phone Number

Check a single phone number for spam risk.

**POST** `/api/v1/check`

#### Request

```json
{
  "phoneNumber": "+15551234567",
  "context": "call",
  "sensitivity": "medium"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phoneNumber | string | Yes | Phone number in E.164 format |
| context | string | No | `call`, `text`, `sms`, or `unknown` (default) |
| sensitivity | string | No | `low`, `medium` (default), `high` |

#### Response

```json
{
  "success": true,
  "data": {
    "phoneNumber": "+15551234567",
    "score": 85,
    "level": "high",
    "recommendation": "LIKELY_BLOCK",
    "action": "screen_call",
    "sensitivity": "medium",
    "factors": [
      {
        "name": "report_frequency",
        "contribution": 40,
        "details": "10 total reports"
      },
      {
        "name": "recency",
        "contribution": 25,
        "details": "Last report 2 days ago"
      }
    ],
    "metadata": {
      "totalReports": 10,
      "recentReports": 8,
      "firstSeen": "2024-01-01T00:00:00Z",
      "lastSeen": "2024-01-13T00:00:00Z",
      "reportTypes": ["auto-dialer", "no-consent"],
      "uniqueVictims": 7,
      "attorneyMatches": 2,
      "falsePositiveReports": 0
    },
    "cached": false
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| phoneNumber | string | Normalized phone number |
| score | integer | Risk score (0-100) |
| level | string | `safe`, `low`, `medium`, `high`, `critical` |
| recommendation | string | `SAFE`, `LIKELY_SAFE`, `CAUTION`, `LIKELY_BLOCK`, `BLOCK` |
| action | string | Recommended action |
| factors | array | Score breakdown by factor |
| metadata | object | Detailed report statistics |
| cached | boolean | Whether result was cached |

### Check via URL

**GET** `/api/v1/check/:number`

```bash
curl "http://localhost:3001/api/v1/check/+15551234567?context=call&sensitivity=high" \
  -H "X-API-Key: demo_key"
```

### Batch Check

Check multiple numbers at once (Premium feature).

**POST** `/api/v1/check/batch`

#### Request

```json
{
  "phoneNumbers": ["+15551234567", "+15559876543", "+15551112222"],
  "context": "call",
  "sensitivity": "high"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "checked": 3,
    "errors": 0,
    "results": [
      { "phoneNumber": "+15551234567", "score": 85, ... },
      { "phoneNumber": "+15559876543", "score": 42, ... },
      { "phoneNumber": "+15551112222", "score": 95, ... }
    ],
    "errors": []
  }
}
```

### Get Statistics

**GET** `/api/v1/stats`

```json
{
  "success": true,
  "data": {
    "total_numbers": 15420,
    "total_reports": 89345,
    "reports_today": 234,
    "reports_last_7_days": 1847,
    "active_cases": 45,
    "total_victims": 32456,
    "validated_reports": 78234
  }
}
```

### Get Top Offenders

**GET** `/api/v1/stats/top-offenders`

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | integer | 20 | Number of results (1-100) |
| days | integer | 30 | Lookback period in days |

#### Response

```json
{
  "success": true,
  "data": {
    "period": "30 days",
    "count": 20,
    "offenders": [
      {
        "phoneNumber": "+15551234567",
        "reportCount": 156,
        "victimCount": 134,
        "lastReport": "2024-01-15T10:30:00Z",
        "violationTypes": ["auto-dialer", "spoofed"]
      }
    ]
  }
}
```

### Get System Stats (Auth Required)

**GET** `/api/v1/stats/system`

Requires valid API key. Returns detailed system metrics.

### Add Manual Override (Admin)

Manually block or allow a phone number.

**POST** `/api/v1/admin/override`

#### Request

```json
{
  "phoneNumber": "+15550000000",
  "decision": "block",
  "reason": "Confirmed scam operation by authorities"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phoneNumber | string | Yes | Phone number to override |
| decision | string | Yes | `block` or `allow` |
| reason | string | Yes | Explanation (5-500 chars) |

#### Response

```json
{
  "success": true,
  "data": {
    "override": {
      "id": "...",
      "phone_number": "+15550000000",
      "decision": "block",
      "reason": "Confirmed scam operation by authorities",
      "created_by": "admin",
      "created_at": "2024-01-15T10:30:00Z",
      "expires_at": "2024-04-15T10:30:00Z"
    },
    "message": "Phone number +15550000000 has been manually set to block"
  }
}
```

### Remove Override (Admin)

**DELETE** `/api/v1/admin/override/:number`

### List Overrides (Admin)

**GET** `/api/v1/admin/overrides`

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | integer | 100 | Max results |
| offset | integer | 0 | Pagination offset |

### Get Check Stats (Admin)

**GET** `/api/v1/admin/check-stats`

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| hours | integer | 24 | Lookback period |

#### Response

```json
{
  "success": true,
  "data": {
    "period": "24 hours",
    "total_checks": 15234,
    "unique_numbers": 8923,
    "avg_risk_score": 42.5,
    "critical_count": 456,
    "high_count": 1234,
    "medium_count": 3456,
    "safe_count": 10088
  }
}
```

### Health Check

**GET** `/health`

No authentication required.

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "database": { "status": "healthy" },
    "cache": { "status": "healthy" },
    "intelligence": {
      "lastRefresh": "2024-01-15T10:25:00Z",
      "schedule": "*/5 * * * *",
      "isRunning": true
    }
  }
}
```

## Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_PHONE | Phone number format invalid |
| 400 | VALIDATION_ERROR | Request validation failed |
| 401 | UNAUTHORIZED | Missing or invalid API key |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |
| 503 | SERVICE_UNAVAILABLE | Database or cache unavailable |

## Rate Limits

- **Basic tier**: 100 requests/minute
- **Premium tier**: 1000 requests/minute
- **Enterprise**: Custom limits

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705312200
```

## Phone Number Format

### E.164 Format

All phone numbers should be provided in E.164 format:
- `+` followed by country code
- Followed by national number
- No spaces, dashes, or other formatting

**Examples:**
- US: `+15551234567`
- UK: `+447123456789`
- Germany: `+4915123456789`

### Input Validation

The API accepts various formats and normalizes them:
- `(555) 123-4567`
- `555-123-4567`
- `555.123.4567`
- `+1 555 123 4567`

But always returns E.164 format in responses.

## Action Recommendations

| Action | Description | Implementation |
|--------|-------------|----------------|
| `block_all` | Block all communication | Silent hangup for calls, drop SMS |
| `block_call` | Block calls only | Let calls through, block SMS |
| `block_text` | Block texts only | Let SMS through, block calls |
| `screen_call` | Screen/flag calls | Show warning, log for review |
| `filter_text` | Filter texts | Send to spam folder |
| `warn_user` | Warn only | Show notification, don't block |
| `allow` | Allow normally | No action needed |

## Sensitivity Levels

### Low
- Fewer false positives
- Only blocks high-confidence spam
- Good for: General consumer use

### Medium (Default)
- Balanced approach
- Recommended for most use cases

### High
- More aggressive blocking
- May have more false positives
- Good for: High-security environments, premium users

## Code Examples

### cURL

```bash
# Check a number
curl -X POST http://localhost:3001/api/v1/check \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo_key" \
  -d '{"phoneNumber": "+15551234567", "context": "call"}'

# Get stats
curl http://localhost:3001/api/v1/stats

# Add override (admin)
curl -X POST http://localhost:3001/api/v1/admin/override \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_admin_key" \
  -d '{"phoneNumber": "+15550000000", "decision": "block", "reason": "Scam confirmed"}'
```

### JavaScript

```javascript
async function checkNumber(phoneNumber) {
  const response = await fetch('http://localhost:3001/api/v1/check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'demo_key',
    },
    body: JSON.stringify({
      phoneNumber,
      context: 'call',
    }),
  });

  const result = await response.json();
  
  if (result.success) {
    const { score, level, action } = result.data;
    
    if (score >= 90) {
      console.log('🚫 BLOCK:', phoneNumber);
      return { block: true };
    } else if (score >= 60) {
      console.log('⚠️  WARNING:', phoneNumber);
      return { warn: true };
    } else {
      console.log('✅ ALLOW:', phoneNumber);
      return { allow: true };
    }
  }
}
```

### Python

```python
import requests

def check_number(phone_number, api_key):
    response = requests.post(
        'http://localhost:3001/api/v1/check',
        headers={'X-API-Key': api_key},
        json={
            'phoneNumber': phone_number,
            'context': 'call'
        }
    )
    
    result = response.json()
    
    if result['success']:
        data = result['data']
        score = data['score']
        
        if score >= 90:
            return {'block': True, 'reason': data['recommendation']}
        elif score >= 60:
            return {'warn': True, 'reason': data['recommendation']}
        else:
            return {'allow': True}
    
    return {'error': result.get('error')}

# Usage
result = check_number('+15551234567', 'demo_key')
print(result)
```

### Node.js

```javascript
const axios = require('axios');

const spamshield = axios.create({
  baseURL: 'http://localhost:3001',
  headers: { 'X-API-Key': 'demo_key' }
});

async function checkNumber(phoneNumber) {
  try {
    const { data } = await spamshield.post('/api/v1/check', {
      phoneNumber,
      context: 'call'
    });
    
    return data.data;
  } catch (error) {
    console.error('API Error:', error.response?.data?.error);
    throw error;
  }
}
```

## Changelog

### v1.0.0 (2024-01-15)
- Initial release
- Real-time risk scoring
- Manual overrides
- Dashboard UI
- Batch checking (premium)
- Redis caching