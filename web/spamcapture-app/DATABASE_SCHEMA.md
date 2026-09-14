# SpamCapture Database Schema

Complete reference for the SpamCapture PostgreSQL database, managed via Sequelize ORM and CLI migrations.

## Overview

The database has four tables managed by Sequelize migrations:

| Table | Purpose |
|-------|---------|
| `users` | Anonymous user accounts |
| `spam_reports` | Spam call/text submissions |
| `block_lists` | Aggregated community block list |
| `subscriptions` | Push notification subscriptions |

## Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│    users     │       │   spam_reports   │       │  block_lists  │
│──────────────│       │──────────────────│       │──────────────│
│ id (PK)      │───┐   │ id (PK)          │       │ id (PK)      │
│ anonymousId  │   │   │ phoneNumber       │──────▶│ phoneNumber  │
│ deviceToken  │   │   │ callerId          │       │ reportCount  │
│ spamsuitId   │   │   │ type (sms/call)  │       │ lastReported │
│ createdAt    │   └──▶│ userId (FK)       │       │ threatLevel  │
│ updatedAt    │       │ content           │       │ categories   │
└──────────────┘       │ screenshotUrl     │       │ firstReported│
                        │ category          │       │ createdAt    │
┌──────────────┐       │ timestamp         │       │ updatedAt    │
│subscriptions│       │ location (JSONB)  │       └──────────────┘
│──────────────│       │ deviceInfo (JSONB)│
│ id (PK)      │       │ createdAt         │       (Loose relationship:
│ userId (FK)  │       │ updatedAt         │        linked by phoneNumber,
│ deviceToken  │       └──────────────────┘        not FK constraint)
│ threshold    │
│ isActive     │
│ lastSync     │
│ createdAt    │
│ updatedAt    │
└──────────────┘
```

**Key design note**: `spam_reports` and `block_lists` are linked by `phoneNumber` (a loose relationship), not by a foreign key constraint. When a new report is created, an `afterCreate` hook triggers `BlockListService.aggregateReport()` to upsert the corresponding `block_lists` entry.

---

## Tables

### users

Anonymous user accounts. No email, no password — identified by `anonymousId`.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Internal database ID |
| `anonymous_id` | VARCHAR(36) | NOT NULL, UNIQUE | Device-generated anonymous identifier (e.g., `anon_a1b2c3d4e5f6...`) |
| `device_token` | VARCHAR(255) | NULLABLE | Expo push notification token |
| `spamsuit_id` | VARCHAR(255) | NULLABLE, UNIQUE (where not null) | SpamSuit platform user ID (for cross-app linking) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record last update time |

**Indexes:**
- `idx_users_anonymous_id` — UNIQUE on `anonymous_id`
- `idx_users_spamsuit_id` — UNIQUE partial index on `spamsuit_id` WHERE `spamsuit_id IS NOT NULL`

**Sequelize Model** (`src/models/user.js`):
```javascript
User = sequelize.define('User', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  anonymousId:   { type: DataTypes.STRING(64), allowNull: false, unique: true },
  deviceToken:   { type: DataTypes.STRING(255), allowNull: true },
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [{ fields: ['anonymousId'], unique: true }]
});
```

**Migration**: `001-create-users.js`

---

### spam_reports

Individual spam call/text submissions from users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Unique report ID |
| `phone_number` | VARCHAR(20) | NOT NULL | Reported phone number (normalized to E.164) |
| `caller_id` | VARCHAR(100) | NULLABLE | Caller ID name if available |
| `type` | ENUM('sms','call') | NOT NULL | Type of spam communication |
| `content` | TEXT | NULLABLE | Message content or call transcript (max 5000 chars) |
| `screenshot_url` | VARCHAR(500) | NULLABLE | URL to screenshot evidence |
| `category` | ENUM('spam','scam','phishing','robocall','telemarketing','other') | NULLABLE | Spam category classification |
| `timestamp` | TIMESTAMP | NOT NULL, DEFAULT NOW() | When the spam incident occurred |
| `user_id` | UUID | FK → users.id, NULLABLE, ON DELETE SET NULL | Submitting user (null if anonymous) |
| `location` | JSONB | NULLABLE | Location data: `{ latitude, longitude, accuracy }` |
| `device_info` | JSONB | NULLABLE | Device metadata at time of report |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record last update time |

**Indexes:**
- `idx_spam_reports_phone_number` — on `phone_number`
- `idx_spam_reports_type` — on `type`
- `idx_spam_reports_category` — on `category`
- `idx_spam_reports_timestamp` — on `timestamp`
- `idx_spam_reports_user_id` — on `user_id`
- `idx_spam_reports_created_at` — on `created_at`
- `idx_spam_reports_phone_number_type` — composite on (`phone_number`, `type`)
- `idx_spam_reports_phone_number_type_category` — composite on (`phone_number`, `type`, `category`)

**Sequelize Model** (`src/models/spamreport.js`):
```javascript
SpamReport = sequelize.define('SpamReport', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  phoneNumber:   { type: DataTypes.STRING(20), allowNull: false, validate: { notEmpty: true, len: [7,20] } },
  callerId:      { type: DataTypes.STRING(100), allowNull: true },
  type:          { type: DataTypes.ENUM('sms', 'call'), allowNull: false, validate: { isIn: [['sms','call']] } },
  content:       { type: DataTypes.TEXT, allowNull: true },
  screenshotUrl: { type: DataTypes.STRING(500), allowNull: true, validate: { isUrl: true } },
  category:      { type: DataTypes.STRING(50), allowNull: true },
  timestamp:     { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  userId:        { type: DataTypes.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
  location:      { type: DataTypes.JSONB, allowNull: true },
}, {
  tableName: 'spam_reports',
  timestamps: true,
  indexes: [
    { fields: ['phoneNumber'] }, { fields: ['type'] }, { fields: ['category'] },
    { fields: ['timestamp'] }, { fields: ['userId'] },
    { fields: ['phoneNumber', 'timestamp'] }
  ]
});
```

**Associations:**
- `SpamReport.belongsTo(User, { foreignKey: 'userId', as: 'user' })` — ON DELETE SET NULL
- `User.hasMany(SpamReport, { foreignKey: 'userId', as: 'reports' })` — ON DELETE SET NULL

**Hooks:**
- `afterCreate` → triggers `BlockListService.aggregateReport(report.phoneNumber)` to update the block list

**Migration**: `002-create-spam-reports.js`

---

### block_lists

Aggregated community block list. One row per phone number. Updated whenever a new report is submitted for that number.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Unique entry ID |
| `phone_number` | VARCHAR(20) | NOT NULL, UNIQUE | Phone number (E.164) |
| `report_count` | INTEGER | NOT NULL, DEFAULT 1 | Total number of reports for this number |
| `last_reported` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Timestamp of most recent report |
| `threat_level` | ENUM('low','medium','high','critical') | NOT NULL, DEFAULT 'low' | Calculated threat level |
| `categories` | JSONB | NULLABLE, DEFAULT [] | Array of category strings |
| `first_reported` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Timestamp of first report |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record last update time |

**Threat Level Calculation:**

| Report Count | Threat Level |
|-------------|-------------|
| 1–4 | `low` |
| 5–19 | `medium` |
| 20–49 | `high` |
| 50+ | `critical` |

**Blocked Threshold**: A number is considered "blocked" when `report_count >= 3` (used by `BlockListService.isBlocked()`).

**Indexes:**
- `idx_block_lists_phone_number` — UNIQUE on `phone_number`
- `idx_block_lists_report_count` — on `report_count`
- `idx_block_lists_threat_level` — on `threat_level`
- `idx_block_lists_last_reported` — on `last_reported`
- `idx_block_lists_threat_level_report_count` — composite on (`threat_level`, `report_count`)

**Sequelize Model** (`src/models/blocklist.js`):
```javascript
BlockList = sequelize.define('BlockList', {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  phoneNumber:  { type: DataTypes.STRING(20), allowNull: false, unique: true, validate: { notEmpty: true, len: [7,20] } },
  reportCount:  { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, validate: { min: 1 } },
  lastReported: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  threatLevel:  { type: DataTypes.ENUM('low','medium','high','critical'), allowNull: false, defaultValue: 'low' },
}, {
  tableName: 'block_lists',
  timestamps: true,
  indexes: [
    { fields: ['phoneNumber'], unique: true },
    { fields: ['reportCount'] }, { fields: ['threatLevel'] },
    { fields: ['lastReported'] }, { fields: ['reportCount', 'threatLevel'] }
  ]
});
```

**Migration**: `003-create-block-list.js`

---

### subscriptions

Push notification subscriptions for automatic block list updates.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Unique subscription ID |
| `user_id` | UUID | FK → users.id, NULLABLE, ON DELETE SET NULL | Subscribing user |
| `device_token` | VARCHAR(255) | NOT NULL | Expo push notification token |
| `threshold` | INTEGER | NOT NULL, DEFAULT 5 | Min report count to trigger notification |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Whether subscription is active |
| `last_sync` | TIMESTAMP | NULLABLE | Last time block list was synced to device |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record last update time |

**Indexes:**
- `idx_subscriptions_user_id` — on `user_id`
- `idx_subscriptions_device_token` — on `device_token`
- `idx_subscriptions_is_active` — on `is_active`

**Associations:**
- `subscription.belongsTo(User, { foreignKey: 'user_id' })` — ON DELETE SET NULL

**Migration**: `004-create-subscriptions.js`

---

## Sequelize Configuration

### Connection Settings (`config/database.js`)

| Environment | Pool Max | Pool Min | Acquire Timeout | Idle Timeout | Logging |
|-------------|----------|----------|-----------------|--------------|---------|
| development | 5 | 0 | 30s | 10s | `console.log` |
| test | 5 | 0 | 30s | 10s | `false` |
| production | 10 | 2 | 30s | 10s | `false` |

### Model Index (`src/models/index.js`)

Initializes Sequelize with environment-specific config, imports all three models, and defines associations:

```javascript
// Associations
User.hasMany(SpamReport, { foreignKey: 'userId', as: 'reports', onDelete: 'SET NULL' });
SpamReport.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Hook: auto-aggregate block list on new report
SpamReport.addHook('afterCreate', async (report) => {
  await BlockListService.aggregateReport(report.phoneNumber);
});
```

### Migration Configuration (`.sequelizerc`)

```javascript
module.exports = {
  config:          path.resolve('config', 'database.js'),
  'models-path':   path.resolve('src', 'models'),
  'seeders-path':  path.resolve('seeders'),
  'migrations-path': path.resolve('migrations')
};
```

---

## Phone Number Normalization

The `ReportService.normalizePhoneNumber()` method standardizes all phone numbers before storage:

```javascript
static normalizePhoneNumber(phoneNumber) {
  if (!phoneNumber) return '';
  let normalized = phoneNumber.replace(/\D/g, '');    // Strip non-digits
  if (!normalized.startsWith('1') && normalized.length === 10) {
    normalized = '1' + normalized;                     // Add US country code
  }
  if (!normalized.startsWith('+')) {
    normalized = '+' + normalized;                     // Add + prefix
  }
  return normalized;
}
```

This ensures consistent lookups across `spam_reports` and `block_lists`.

---

## Block List Aggregation Flow

When a new `SpamReport` is created:

1. Sequelize `afterCreate` hook fires
2. `BlockListService.aggregateReport(phoneNumber)` is called
3. Inside a transaction:
   - Count total reports for the phone number
   - Find the most recent report timestamp
   - Calculate threat level from report count
   - Upsert the `block_lists` entry (create if new, update if existing)
4. If the entry is new, `reportCount` starts at 1
5. If existing, `reportCount` and `threatLevel` are recalculated

```javascript
static calculateThreatLevel(reportCount) {
  if (reportCount >= 50) return 'critical';
  if (reportCount >= 20) return 'high';
  if (reportCount >= 5) return 'medium';
  return 'low';
}
```

---

## Data Flow Summary

```
User submits report
        │
        ▼
POST /api/reports
        │
        ▼
ReportService.createReport()
  ├── normalizePhoneNumber()
  └── SpamReport.create()
          │
          ▼ (afterCreate hook)
BlockListService.aggregateReport()
  ├── Count reports for phoneNumber
  ├── Calculate threat level
  └── Upsert block_lists entry
          │
          ▼
block_lists table updated
          │
          ▼
GET /api/blocklist returns updated list
POST /api/blocklist/check returns blocked status
```

---

## Query Patterns

### Most Common Queries

**1. Get reports for a phone number** (used by `GET /api/reports/phone/:phoneNumber`):
```sql
SELECT * FROM spam_reports
WHERE phone_number = $1
ORDER BY timestamp DESC
LIMIT $2 OFFSET $3;
```
Uses: `idx_spam_reports_phone_number`

**2. Get community block list** (used by `GET /api/blocklist`):
```sql
SELECT * FROM block_lists
WHERE report_count >= $1  -- minReports filter
ORDER BY report_count DESC, last_reported DESC
LIMIT $2 OFFSET $3;
```
Uses: `idx_block_lists_report_count`, `idx_block_lists_threat_level_report_count`

**3. Check if number is blocked** (used by `POST /api/blocklist/check`):
```sql
SELECT * FROM block_lists
WHERE phone_number = $1;
-- Application logic: blocked = (report_count >= 3)
```
Uses: `idx_block_lists_phone_number` (unique)

**4. Trending numbers** (used by `GET /api/stats/trending`):
```sql
SELECT phone_number,
       COUNT(*) AS recent_reports,
       MAX(timestamp) AS last_reported
FROM spam_reports
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY phone_number
ORDER BY recent_reports DESC
LIMIT $1;
```
Uses: `idx_spam_reports_timestamp`

**5. Daily activity timeline** (used by `GET /api/stats/timeline`):
```sql
SELECT DATE(timestamp) AS date,
       COUNT(*) AS count
FROM spam_reports
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY date ASC;
```
Uses: `idx_spam_reports_timestamp`

---

## Backup & Maintenance

### Manual Backup
```bash
pg_dump -U postgres -Fc spamcapture > backup_$(date +%Y%m%d).dump
```

### Restore
```bash
pg_restore -U postgres -d spamcapture -c backup_20240415.dump
```

### Development Sync
In development mode, `app.js` runs `sequelize.sync({ alter: true })` on startup, which automatically alters tables to match model definitions. **Do not rely on this in production** — use migrations.

### Database Reset
```bash
npm run db:reset
# Equivalent to: migrate:undo → migrate → seed
```