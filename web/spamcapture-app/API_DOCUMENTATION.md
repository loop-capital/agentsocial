# SpamCapture API Documentation

Complete reference for the SpamCapture REST API.

## Base URL

```
http://localhost:3000/api
```

> No version prefix in the current deployment. All endpoints are under `/api/`.

## Authentication

The API uses **anonymous device-based authentication**. There is no JWT or email/password flow in the current MVP.

Users are identified by the `X-Anonymous-User-Id` header, which contains their `anonymousId` (e.g., `anon_a1b2c3d4e5f6...`).

Some endpoints (like report submission) read this header to associate the report with a user. If the header is absent, `userId` is set to `null` and the report is anonymous.

---

## Reports

### Submit a New Report

```http
POST /api/reports
```

Submit a spam call or text report.

**Headers:**
```
Content-Type: application/json
X-Anonymous-User-Id: anon_a1b2c3d4e5f6...
```

**Request Body:**
```json
{
  "phoneNumber": "+18005551234",
  "type": "sms",
  "content": "Your account has been compromised. Click here to verify...",
  "category": "phishing",
  "callerId": "Unknown Caller",
  "screenshotUrl": "https://storage.example.com/screenshots/abc123.png",
  "timestamp": "2024-04-15T14:30:00Z",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.006,
    "accuracy": 100
  }
}
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `phoneNumber` | string | **Yes** | Phone number (validated with regex) |
| `type` | enum | **Yes** | `"sms"` or `"call"` |
| `content` | string | No | Spam message content or call transcript (max 5000 chars) |
| `category` | enum | No | `"spam"`, `"scam"`, `"phishing"`, `"robocall"`, `"telemarketing"`, `"other"` |
| `callerId` | string | No | Caller ID name if available |
| `screenshotUrl` | string (URL) | No | URL to screenshot evidence |
| `timestamp` | ISO 8601 | No | Time of the spam incident (defaults to now) |
| `location` | object | No | `{ latitude, longitude, accuracy }` |

**Phone number validation regex:**
```
^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Report submitted successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "phoneNumber": "+18005551234",
    "callerId": "Unknown Caller",
    "type": "sms",
    "content": "Your account has been compromised. Click here to verify...",
    "screenshotUrl": "https://storage.example.com/screenshots/abc123.png",
    "category": "phishing",
    "timestamp": "2024-04-15T14:30:00.000Z",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.006,
      "accuracy": 100
    },
    "createdAt": "2024-04-15T15:00:00.000Z",
    "updatedAt": "2024-04-15T15:00:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "phoneNumber",
      "message": "Invalid phone number format"
    }
  ]
}
```

**Rate Limit:** 50 reports per hour per IP (separate from general API limit).

**Side Effect:** After a report is created, the `afterCreate` hook triggers `BlockListService.aggregateReport(phoneNumber)` to update the community block list entry for that number.

---

### List Reports

```http
GET /api/reports
```

Retrieve paginated list of spam reports with optional filters.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `type` | enum | Filter by type: `"sms"` or `"call"` |
| `phoneNumber` | string | Filter by phone number (normalized) |
| `category` | enum | Filter by category |
| `page` | integer | Page number (default: 1, min: 1) |
| `limit` | integer | Items per page (default: 20, max: 100) |

**Example Request:**
```
GET /api/reports?type=sms&category=phishing&page=1&limit=20
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "phoneNumber": "+18005551234",
      "callerId": "Unknown Caller",
      "type": "sms",
      "content": "Your account has been compromised...",
      "screenshotUrl": "https://storage.example.com/screenshots/abc123.png",
      "category": "phishing",
      "timestamp": "2024-04-15T14:30:00.000Z",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "location": null,
      "createdAt": "2024-04-15T15:00:00.000Z",
      "updatedAt": "2024-04-15T15:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1523,
    "pages": 77
  }
}
```

---

### Get Report by ID

```http
GET /api/reports/:id
```

Retrieve a single report by its UUID.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "phoneNumber": "+18005551234",
    "callerId": "Unknown Caller",
    "type": "sms",
    "content": "...",
    "screenshotUrl": null,
    "category": "phishing",
    "timestamp": "2024-04-15T14:30:00.000Z",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "location": null,
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "anonymousId": "anon_a1b2c3d4e5f6..."
    },
    "createdAt": "2024-04-15T15:00:00.000Z",
    "updatedAt": "2024-04-15T15:00:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Report not found"
}
```

---

### Get Reports by Phone Number

```http
GET /api/reports/phone/:phoneNumber
```

Retrieve all reports for a specific phone number.

**Example:**
```
GET /api/reports/phone/+18005551234
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-...",
      "phoneNumber": "+18005551234",
      "type": "sms",
      "category": "phishing",
      "timestamp": "2024-04-15T14:30:00.000Z",
      ...
    },
    {
      "id": "660f9511-...",
      "phoneNumber": "+18005551234",
      "type": "call",
      "category": "robocall",
      "timestamp": "2024-04-14T10:00:00.000Z",
      ...
    }
  ]
}
```

---

## Block List

### Get Community Block List

```http
GET /api/blocklist
```

Retrieve the top reported numbers from the community block list, sorted by report count descending.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `limit` | integer | Max entries (default: 100, max: 1000) |
| `minReports` | integer | Minimum report count filter (default: 1) |
| `threatLevel` | enum | Filter by threat level: `"low"`, `"medium"`, `"high"`, `"critical"` |

**Example:**
```
GET /api/blocklist?limit=50&threatLevel=high
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 50,
  "data": [
    {
      "id": "770e8400-...",
      "phoneNumber": "+18005551234",
      "reportCount": 87,
      "lastReported": "2024-04-15T14:30:00.000Z",
      "threatLevel": "high",
      "categories": ["phishing", "scam"],
      "firstReported": "2024-01-10T09:00:00.000Z",
      "createdAt": "2024-01-10T09:00:00.000Z",
      "updatedAt": "2024-04-15T14:30:00.000Z"
    }
  ]
}
```

---

### Export Block List

```http
GET /api/blocklist/export
```

Export the block list in various formats for import into phone blocking apps.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `format` | enum | `"json"` (default), `"csv"`, or `"txt"` |
| `limit` | integer | Max entries (default: 1000, max: 10000) |

**Example:**
```
GET /api/blocklist/export?format=csv&limit=500
```

**JSON Response (200):**
```json
{
  "success": true,
  "exportedAt": "2024-04-15T15:30:00.000Z",
  "count": 500,
  "data": [...]
}
```

**CSV Response (200):**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="spamcapture-blocklist-1713195000000.csv"

phoneNumber,reportCount,lastReported,threatLevel
+18005551234,87,"2024-04-15T14:30:00.000Z",high
+18005559876,45,"2024-04-15T12:00:00.000Z",medium
```

**TXT Response (200):**
```
Content-Type: text/plain
Content-Disposition: attachment; filename="spamcapture-blocklist-1713195000000.txt"

+18005551234
+18005559876
...
```
(Plain list of phone numbers, one per line)

---

### Batch Check Phone Numbers

```http
POST /api/blocklist/check
```

Check whether a batch of phone numbers appear in the block list.

**Request Body:**
```json
{
  "phoneNumbers": [
    "+18005551234",
    "+18005559876",
    "+18005550000"
  ]
}
```

**Constraints:** 1–100 phone numbers per request.

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "phoneNumber": "+18005551234",
      "blocked": true,
      "entry": {
        "reportCount": 87,
        "threatLevel": "high",
        "lastReported": "2024-04-15T14:30:00.000Z"
      }
    },
    {
      "phoneNumber": "+18005559876",
      "blocked": true,
      "entry": {
        "reportCount": 45,
        "threatLevel": "medium",
        "lastReported": "2024-04-15T12:00:00.000Z"
      }
    },
    {
      "phoneNumber": "+18005550000",
      "blocked": false,
      "entry": null
    }
  ]
}
```

> A number is considered **blocked** if `reportCount >= 3`.

---

### Subscribe to Block List Updates

```http
POST /api/blocklist/subscribe
```

Register a device for push notifications when new numbers are added to the block list.

**Headers:**
```
X-Anonymous-User-Id: anon_a1b2c3d4e5f6...
```

**Request Body:**
```json
{
  "deviceToken": "ExponentPushToken[xxxxxxxxxx]",
  "threshold": 5
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `deviceToken` | string | **Yes** | Expo push notification token |
| `threshold` | integer | No | Minimum report count to trigger notification (default: 5, range: 1–100) |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Successfully subscribed to block list updates",
  "data": {
    "id": "880e8400-...",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "deviceToken": "ExponentPushToken[xxxxxxxxxx]",
    "threshold": 5,
    "isActive": true,
    "lastSync": null,
    "createdAt": "2024-04-15T15:30:00.000Z",
    "updatedAt": "2024-04-15T15:30:00.000Z"
  }
}
```

---

### Block List Statistics

```http
GET /api/blocklist/stats
```

Get aggregate statistics about the block list.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalEntries": 1245,
    "totalReports": 15234,
    "byThreatLevel": {
      "low": {
        "count": 800,
        "totalReports": 1200
      },
      "medium": {
        "count": 300,
        "totalReports": 5400
      },
      "high": {
        "count": 120,
        "totalReports": 6000
      },
      "critical": {
        "count": 25,
        "totalReports": 2634
      }
    }
  }
}
```

---

## Users

### Register Anonymous User

```http
POST /api/users/register
```

Create a new anonymous user account. Returns the `anonymousId` for use in subsequent requests.

**Request Body:**
```json
{
  "deviceToken": "ExponentPushToken[xxxxxxxxxx]"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `deviceToken` | string | No | Expo push notification token |

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "anon_a1b2c3d4e5f67890abcdef1234567890",
    "createdAt": "2024-04-15T15:30:00.000Z"
  }
}
```

---

### Get User's Reports

```http
GET /api/users/:userId/reports
```

Retrieve all reports submitted by a specific user. The `:userId` parameter is the `anonymousId` (not the database UUID).

**Example:**
```
GET /api/users/anon_a1b2c3d4e5f6.../reports
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-...",
      "phoneNumber": "+18005551234",
      "type": "sms",
      "category": "phishing",
      "timestamp": "2024-04-15T14:30:00.000Z",
      ...
    }
  ]
}
```

---

### Sync with SpamSuit

```http
POST /api/users/sync
```

Link a SpamCapture user account with a SpamSuit legal platform account.

**Request Body:**
```json
{
  "userId": "anon_a1b2c3d4e5f6...",
  "spamsuitId": "spamsuit_user_xyz"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | **Yes** | SpamCapture anonymous ID |
| `spamsuitId` | string | No | SpamSuit platform user ID |

**Success Response (200):**
```json
{
  "success": true,
  "message": "User data synced successfully",
  "data": {
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "anonymousId": "anon_a1b2c3d4e5f6...",
    "spamsuitId": "spamsuit_user_xyz"
  }
}
```

---

## Stats

### Community Overview

```http
GET /api/stats
```

Comprehensive community statistics including reports, block list, user activity, and protection metrics.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "reports": {
      "totalReports": 15234,
      "reportsLast24h": 67,
      "reportsLast7d": 412,
      "reportsLast30d": 1890,
      "byType": {
        "sms": 8234,
        "call": 7000
      },
      "byCategory": {
        "phishing": 4500,
        "scam": 3800,
        "robocall": 2900,
        "telemarketing": 2200,
        "spam": 1200,
        "other": 634
      }
    },
    "blockList": {
      "totalEntries": 1245,
      "totalBlockedNumbers": 890,
      "highThreatNumbers": 145,
      "byThreatLevel": {
        "low": { "count": 800, "totalReports": 1200 },
        "medium": { "count": 300, "totalReports": 5400 },
        "high": { "count": 120, "totalReports": 6000 },
        "critical": { "count": 25, "totalReports": 2634 }
      }
    },
    "users": {
      "totalUsers": 5420,
      "activeUsers": 3210,
      "inactiveUsers": 2210
    },
    "activity": {
      "daily": [
        { "date": "2024-04-15", "count": 67 },
        { "date": "2024-04-14", "count": 58 }
      ],
      "hourly": [
        { "hour": 0, "count": 2 },
        { "hour": 9, "count": 15 }
      ]
    },
    "protection": {
      "estimatedBlockedCalls": 89000,
      "totalCommunityReports": 15234
    }
  }
}
```

---

### Trending Spam Numbers

```http
GET /api/stats/trending
```

Get phone numbers with the most reports in the last 7 days.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `limit` | integer | Number of results (default: 10) |

**Example:**
```
GET /api/stats/trending?limit=5
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "phoneNumber": "+18005551234",
      "recentReports": 23,
      "lastReported": "2024-04-15T14:30:00.000Z"
    },
    {
      "phoneNumber": "+18005559876",
      "recentReports": 18,
      "lastReported": "2024-04-15T12:00:00.000Z"
    }
  ]
}
```

---

### Category Breakdown

```http
GET /api/stats/categories
```

Get report counts broken down by spam category.

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    { "category": "phishing", "count": 4500 },
    { "category": "scam", "count": 3800 },
    { "category": "robocall", "count": 2900 },
    { "category": "telemarketing", "count": 2200 },
    { "category": "spam", "count": 1200 },
    { "category": "other", "count": 634 }
  ]
}
```

---

### Reports Timeline

```http
GET /api/stats/timeline
```

Get daily report counts over time.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `days` | integer | Number of days to look back (default: 30) |

**Example:**
```
GET /api/stats/timeline?days=7
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    { "date": "2024-04-09", "count": 52 },
    { "date": "2024-04-10", "count": 61 },
    { "date": "2024-04-11", "count": 58 },
    { "date": "2024-04-12", "count": 70 },
    { "date": "2024-04-13", "count": 45 },
    { "date": "2024-04-14", "count": 48 },
    { "date": "2024-04-15", "count": 67 }
  ]
}
```

---

## Health Check

```http
GET /health
```

Server health and uptime check. Not under `/api/`.

**Success Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-04-15T15:30:00.000Z",
  "version": "1.0.0",
  "uptime": 86400
}
```

---

## Root Endpoint

```http
GET /
```

API metadata and endpoint listing.

**Success Response (200):**
```json
{
  "name": "SpamCapture API",
  "version": "1.0.0",
  "description": "Community-powered spam reporting and blocking API",
  "documentation": "/api/docs",
  "endpoints": {
    "reports": "/api/reports",
    "blocklist": "/api/blocklist",
    "users": "/api/users",
    "stats": "/api/stats"
  }
}
```

---

## Error Codes

### Validation Errors (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "phoneNumber", "message": "Phone number is required" },
    { "field": "type", "message": "Type must be either \"sms\" or \"call\"" }
  ]
}
```

### Unique Constraint (409)
```json
{
  "success": false,
  "message": "Resource already exists",
  "errors": [
    { "field": "phoneNumber", "message": "phoneNumber must be unique" }
  ]
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Report not found"
}
```

### Rate Limited (429)
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```

### Internal Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error"
}
```
(In development mode, `stack` is included for debugging.)

---

## Rate Limiting

| Endpoint Group | Window | Max Requests | Key |
|---------------|--------|--------------|-----|
| General API (`/api/*`) | 15 min | 100 | IP address |
| Report submission (`POST /api/reports`) | 1 hour | 50 | IP address |
| Auth endpoints | 15 min | 5 | IP address |

Rate limit response headers:
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1713195000
```

---

## Phone Number Normalization

All phone numbers are normalized server-side before storage and querying:

1. Remove all non-numeric characters
2. If 10 digits (no country code) → prepend `1` (assume US)
3. Prepend `+` if missing

Examples:
- `8005551234` → `+18005551234`
- `(800) 555-1234` → `+18005551234`
- `+1 800 555 1234` → `+18005551234`
- `+44 20 7946 0958` → `+442079460958`

---

## Threat Level Calculation

Block list entries are assigned a threat level based on report count:

| Report Count | Threat Level |
|-------------|-------------|
| 1–4 | `low` |
| 5–19 | `medium` |
| 20–49 | `high` |
| 50+ | `critical` |

A number is considered **blocked** (in the `/blocklist/check` endpoint) when `reportCount >= 3`.