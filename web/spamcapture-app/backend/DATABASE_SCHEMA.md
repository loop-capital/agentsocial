# Database Schema

## Overview

This document describes the database schema for the SpamCapture application. The schema is designed to efficiently store spam reports, aggregate community intelligence, and support fast retrieval of block lists.

## Entity Relationship Diagram (Text Representation)

```
users 1───∞ spam_reports
spam_reports ∞──1 block_lists (via aggregation)
users 1───∞ subscriptions
```

## Tables

### 1. users

Stores anonymous user information for tracking contributions and enabling premium features.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| anonymous_id | VARCHAR(36) | NOT NULL, UNIQUE | Anonymous user ID for reporting |
| device_token | VARCHAR(255) | NULL | Push notification token (Expo) |
| spamsuit_id | VARCHAR(255) | NULL | Reference ID for SpamSuit integration |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- `idx_users_anonymous_id` (anonymous_id) - For fast lookups by user ID
- `idx_users_spamsuit_id` (spamsuit_id) WHERE spamsuit_id IS NULL - For SpamSuit sync

### 2. spam_reports

Stores individual spam reports submitted by users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique report identifier |
| phone_number | VARCHAR(20) | NOT NULL | Caller/sender phone number |
| caller_id | VARCHAR(100) | NULL | Name displayed on caller ID |
| type | VARCHAR(10) | NOT NULL, CHECK(type IN ('sms', 'call')) | Report type |
| content | TEXT | NULL | Message content or call description |
| screenshot_url | VARCHAR(500) | NULL | URL to uploaded screenshot |
| category | VARCHAR(20) | NULL, CHECK(category IN ('spam', 'scam', 'phishing', 'robocall', 'telemarketing', 'other')) | Spam category |
| timestamp | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | When the spam occurred |
| user_id | UUID | NULL, REFERENCES users(id) ON DELETE SET NULL | Reporting user (anonymous) |
| location | JSONB | NULL | GPS coordinates {lat, lng} |
| device_info | JSONB | NULL | Device metadata (model, OS, etc.) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Last update time |

**Indexes:**
- `idx_spamreports_phone_number` (phone_number) - For lookup by number
- `idx_spamreports_type` (type) - For filtering by type
- `idx_spamreports_category` (category) - For category filtering
- `idx_spamreports_timestamp` (timestamp) - For time-based queries
- `idx_spamreports_user_id` (user_id) - For user-specific queries
- `idx_spamreports_created_at` (created_at) - For recent reports
- `idx_spamreports_phone_type` (phone_number, type) - Common combo
- `idx_spamreports_phone_type_category` (phone_number, type, category) - Detailed filtering

### 3. block_lists

Pre-aggregated list of numbers to block, updated periodically from spam_reports.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique entry identifier |
| phone_number | VARCHAR(20) | NOT NULL, UNIQUE | Phone number to block |
| report_count | INTEGER | NOT NULL, DEFAULT 1 | Number of reports received |
| last_reported | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Most recent report |
| first_reported | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | First report received |
| threat_level | VARCHAR(10) | NOT NULL, DEFAULT 'low', CHECK(threat_level IN ('low', 'medium', 'high', 'critical')) | Calculated threat level |
| categories | JSONB | DEFAULT '[]' | Array of observed categories |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Last update |

**Indexes:**
- `idx_blocklists_phone_number` (phone_number) - For fast lookups
- `idx_blocklists_report_count` (report_count) - For sorting by popularity
- `idx_blocklists_threat_level` (threat_level) - For threat-based filtering
- `idx_blocklists_last_reported` (last_reported) - For recency sorting
- `idx_blocklists_threat_count` (threat_level, report_count) - Combined sorting

### 4. subscriptions

Tracks user preferences for automatic block list updates.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique subscription ID |
| user_id | UUID | NULL, REFERENCES users(id) ON DELETE SET NULL | Associated user |
| device_token | VARCHAR(255) | NOT NULL | Push notification token |
| threshold | INTEGER | NOT NULL, DEFAULT 5 | Minimum reports to trigger block |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Subscription status |
| last_sync | TIMESTAMP | NULL | Last block list sync time |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Last update |

**Indexes:**
- `idx_subscriptions_user_id` (user_id) - For user lookups
- `idx_subscriptions_device_token` (device_token) - For push notifications
- `idx_subscriptions_is_active` (is_active) - For active subscriptions

## Triggers and Automated Processes

### Block List Updates

The block_lists table is updated periodically by a background process that:

1. Aggregates spam_reports by phone_number
2. Calculates report counts and first/last seen timestamps
3. Determines threat level based on:
   - Report velocity (reports per hour/day)
   - Category patterns (certain categories weighted higher)
   - Geographic distribution (if location data available)
   - Temporal patterns (burst vs steady reporting)
4. Updates or inserts records in block_lists

**Threat Level Algorithm:**
- **Low**: 1-4 reports
- **Medium**: 5-19 reports OR recent burst (3+ reports in 1 hour)
- **High**: 20-99 reports OR sustained reporting (5+/day for 3+ days)
- **Critical**: 100+ reports OR very high velocity (10+/hour)

### Data Retention

- **spam_reports**: Retained indefinitely for historical analysis
- **block_lists**: Updated continuously, old entries naturally fade
- **users**: Retained until explicit deletion request
- **subscriptions**: Removed when user becomes inactive for 6+ months

## Performance Considerations

### Query Optimization

Common queries are optimized through:

1. **Covering Indexes**: Indexes include all columns needed for frequent queries
2. **Partitioning**: Consider time-based partitioning on spam_reports for very large datasets
3. **Materialized Views**: block_lists serves as a materialized view of spam_reports aggregation
4. **Connection Pooling**: Sequelize configured with appropriate pool sizes

### Storage Efficiency

- **JSONB**: Used for flexible schema fields (location, device_info, categories)
- **UUIDv4**: Standard for distributed generation, slightly larger but universally unique
- **Integer Counters**: report_count uses efficient INTEGER type
- **Timestamp Precision**: Second-level precision sufficient for use case

## Migration Scripts

See the `migrations/` directory for Sequelize migration files:
- `001-create-users.js`: Creates users table
- `002-create-spam-reports.js`: Creates spam_reports table
- `003-create-block-list.js`: Creates block_lists table
- `004-create-subscriptions.js`: Creates subscriptions table

## Sample Data

### users
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "anonymous_id": "550e8400-e29b-41d4-a716-446655440000",
  "device_token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "spamsuit_id": null,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### spam_reports
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "phone_number": "+15551234567",
  "caller_id": "Scam Likely",
  "type": "call",
  "content": "Extended warranty scam",
  "category": "scam",
  "timestamp": "2024-01-15T10:30:00Z",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "location": {"lat": 40.7128, "lng": -74.0060},
  "device_info": {"model": "iPhone14,2", "os": "iOS 17.2"},
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### block_lists
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "phone_number": "+15551234567",
  "report_count": 156,
  "last_reported": "2024-01-15T10:30:00Z",
  "first_reported": "2024-01-10T14:22:00Z",
  "threat_level": "critical",
  "categories": ["robocall", "scam"],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### subscriptions
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "device_token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "threshold": 5,
  "is_active": true,
  "last_sync": "2024-01-15T10:30:00Z",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

## Extensibility

### Adding New Fields

1. **To spam_reports**: Add column migration, update model, validate in API
2. **To block_lists**: Add column, update aggregation logic, modify API responses
3. **To users/subscriptions**: Similar process with attention to privacy implications

### Future Enhancements

- **Geospatial Indexes**: For location-based spam detection
- **Full-Text Search**: On content field for pattern detection
- **TimeSeries Tables**: For high-volume reporting scenarios
- **Read Replicas**: For scaling read-heavy block list queries
- **Caching Layer**: Redis for hot block list data