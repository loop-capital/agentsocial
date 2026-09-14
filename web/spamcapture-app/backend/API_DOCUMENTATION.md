# Backend API Documentation

## Overview

The SpamCapture backend provides a RESTful API for submitting spam reports, retrieving community block lists, and managing user preferences. Built with Node.js, Express, and PostgreSQL.

## Base URL

```
http://localhost:3000/api
```

## Authentication

The API supports anonymous reporting via the `X-Anonymous-User-Id` header. For registered users, this header should contain the user's anonymous ID.

```
X-Anonymous-User-Id: 550e8400-e29b-41d4-a716-446655440000
```

## Rate Limiting

- General API: 100 requests per 15 minutes per IP
- Report Submission: 50 reports per hour per IP
- Exceeding limits returns HTTP 429 (Too Many Requests)

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "timestamp": "2024-01-15T10:30:00Z"
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Endpoints

### Reports

#### Submit a Spam Report
```
POST /reports
```

**Request Body:**
```json
{
  "phoneNumber": "+15551234567",
  "callerId": "Scam Likely",
  "type": "call",
  "content": "Extended warranty scam offering",
  "category": "scam",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Report submitted successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "phoneNumber": "+15551234567",
    "callerId": "Scam Likely",
    "type": "call",
    "content": "Extended warranty scam offering",
    "category": "scam",
    "timestamp": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Get Reports (with filtering)
```
GET /reports
```

**Query Parameters:**
- `type`: `sms` | `call` (optional)
- `phoneNumber`: string (optional)
- `category`: spam | scam | phishing | robocall | telemarketing | other (optional)
- `page`: integer (default: 1)
- `limit`: integer (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "message": "Reports retrieved successfully",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "phoneNumber": "+15551234567",
      "type": "call",
      "category": "scam",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Get Report by ID
```
GET /reports/:id
```

**Response:** Same as single item in data array above

### Block List

#### Get Community Block List
```
GET /blocklist
```

**Query Parameters:**
- `limit`: integer (default: 100, max: 1000)
- `minReports`: integer (default: 1)
- `threatLevel`: low | medium | high | critical (optional)

**Response:**
```json
{
  "success": true,
  "message": "Block list retrieved successfully",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "phoneNumber": "+15551234567",
      "reportCount": 156,
      "lastReported": "2024-01-15T10:30:00Z",
      "firstReported": "2024-01-10T14:22:00Z",
      "threatLevel": "critical",
      "categories": ["robocall", "scam"]
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Export Block List
```
GET /blocklist/export
```

**Query Parameters:**
- `format`: json | csv | txt (default: json)
- `limit`: integer (default: 1000)

**Response:**
- `json`: Same as GET /blocklist
- `csv`: CSV formatted data with headers
- `txt`: Plain text, one number per line

#### Check Numbers Against Block List
```
POST /blocklist/check
```

**Request Body:**
```json
{
  "phoneNumbers": ["+15551234567", "+15559876543"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Check completed",
  "data": {
    "+15551234567": true,
    "+15559876543": false
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Subscribe to Block List Updates
```
POST /blocklist/subscribe
```

**Request Body:**
```json
{
  "deviceToken": "Expo push token string",
  "threshold": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully subscribed to block list updates",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "deviceToken": "Expo push token string",
    "threshold": 5,
    "isActive": true
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Get Block List Statistics
```
GET /blocklist/stats
```

**Response:**
```json
{
  "success": true,
  "message": "Block list statistics retrieved",
  "data": {
    "totalNumbers": 1247,
    "totalReports": 8934,
    "threatDistribution": {
      "low": 456,
      "medium": 532,
      "high": 215,
      "critical": 44
    },
    "avgReportsPerNumber": 7.16
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Users

#### Register Anonymous User
```
POST /users/register
```

**Request Body:**
```json
{
  "deviceToken": "Expo push token string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Get User Reports
```
GET /users/:userId/reports
```

**Response:** Same format as GET /reports

#### Sync with SpamSuit
```
POST /users/sync
```

**Request Body:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "spamsuitId": "spamsuit_abc123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User data synced successfully",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "spamsuitId": "spamsuit_abc123",
    "syncedAt": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Statistics

#### Get Overall Statistics
```
GET /stats
```

**Response:**
```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "totalReports": 15420,
    "todayReports": 124,
    "activeBlocks": 1247,
    "protectedUsers": 8934,
    "growthRate": {
      "daily": 12.4,
      "weekly": 87.3,
      "monthly": 342.1
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Get Trending Numbers
```
GET /stats/trending
```

**Query Parameters:**
- `limit`: integer (default: 10)

**Response:**
```json
{
  "success": true,
  "message": "Trending numbers retrieved",
  "data": [
    {
      "phoneNumber": "+15551234567",
      "reportCount": 156,
      "category": "robocall"
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Get Category Statistics
```
GET /stats/categories
```

**Response:**
```json
{
  "success": true,
  "message": "Category statistics retrieved",
  "data": [
    {
      "category": "robocall",
      "count": 4520,
      "percentage": 29.3
    },
    {
      "category": "scam",
      "count": 3891,
      "percentage": 25.2
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Get Timeline Data
```
GET /stats/timeline
```

**Query Parameters:**
- `days`: integer (default: 30)

**Response:**
```json
{
  "success": true,
  "message": "Timeline data retrieved",
  "data": [
    {
      "date": "2024-01-15",
      "reports": 124,
      "newNumbers": 45
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Error Codes

- `400`: Bad Request - Invalid input or validation failed
- `401`: Unauthorized - Missing or invalid authentication
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource doesn't exist
- `409`: Conflict - Resource already exists (e.g., duplicate user)
- `422`: Unprocessable Entity - Semantic errors
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Unexpected server error
- `503`: Service Unavailable - Database or service downtime

## Health Check

```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "uptime": 3600
}
```

## Database Schema

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for detailed table structures.

## Environment Variables

See `.env.example` for required configuration:

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: development | production | test
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for token signing
- `RATE_LIMIT_WINDOW_MS`: Rate limit window in milliseconds
- `RATE_LIMIT_MAX`: Max requests per window
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins

## Implementation Notes

### Input Validation
All endpoints validate input using express-validator:
- Phone numbers: Regex validation for international formats
- Strings: Length limits and sanitization
- Enums: Strict validation against allowed values
- Timestamps: ISO 8601 format validation

### Security Measures
- Helmet.js for HTTP header security
- CORS configuration with configurable origins
- Rate limiting to prevent abuse
- Input sanitization to prevent injection attacks
- Parameterized queries to prevent SQL injection

### Database Optimization
- Indexes on frequently queried columns
- Composite indexes for common query patterns
- Soft deletes where appropriate
- Connection pooling via Sequelize

### Extensibility
- Modular service layer for business logic
- Easy addition of new endpoints
- Plugin architecture for external integrations
- Webhook support for real-time notifications