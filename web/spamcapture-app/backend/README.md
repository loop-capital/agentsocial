# SpamCapture Backend

REST API for community-powered spam reporting and blocking. Built with Node.js, Express, and Sequelize (PostgreSQL).

## Overview

The backend provides four route groups:

| Route Group | Prefix | Description |
|------------|--------|-------------|
| Reports | `/api/reports` | Submit and query spam reports |
| Block List | `/api/blocklist` | Query the community block list + export |
| Users | `/api/users` | Anonymous user registration |
| Stats | `/api/stats` | Community statistics and trending numbers |

Authentication is **anonymous** — no email or password. Users are identified by an `X-Anonymous-User-Id` header containing their device-generated `anonymousId`.

## Setup Instructions

### Prerequisites
- Node.js >= 18.0.0
- PostgreSQL >= 13

### Installation

```bash
cd backend
npm install
```

### Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```ini
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=spamcapture
DB_USER=postgres
DB_PASSWORD=your_password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000     # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGINS=http://localhost:8081,http://localhost:19006
# Note: The app.js reads ALLOWED_ORIGINS (comma-separated), not CORS_ORIGINS
```

### Set Up Database

```bash
# Create the database
createdb spamcapture

# Run migrations
npm run migrate

# (Optional) Seed data — no seeders yet in MVP
npm run seed
```

### Start the Server

```bash
# Development (with nodemon auto-reload)
npm run dev

# Production
npm start
```

The server starts at `http://localhost:3000`. On startup it:
1. Tests the database connection
2. In development mode: syncs Sequelize models (`sequelize.sync({ alter: true })`)
3. Starts listening on the configured port

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | `development` / `production` / `test` | `development` |
| `PORT` | Server port | `3000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `spamcapture` |
| `DB_USER` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `password` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window per IP | `100` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:8081,http://localhost:19006` |

## Running Migrations

```bash
# Run all pending migrations
npm run migrate

# Undo all migrations
npm run migrate:undo

# Check status
npx sequelize-cli db:migrate:status

# Create a new migration
npx sequelize-cli migration:generate --name description-of-change
```

Migration files live in `./migrations/` and are registered via `.sequelizerc`.

### Current Migrations

| # | File | Creates Table |
|---|------|---------------|
| 001 | `001-create-users.js` | `users` |
| 002 | `002-create-spam-reports.js` | `spam_reports` |
| 003 | `003-create-block-list.js` | `block_lists` |
| 004 | `004-create-subscriptions.js` | `subscriptions` |

## API Documentation

Full endpoint documentation with request/response examples: [../API_DOCUMENTATION.md](../API_DOCUMENTATION.md)

### Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/reports` | Submit a new spam report |
| `GET` | `/api/reports` | List reports (with filters) |
| `GET` | `/api/reports/:id` | Get report by ID |
| `GET` | `/api/reports/phone/:phoneNumber` | Get reports for a phone number |
| `GET` | `/api/blocklist` | Get community block list |
| `GET` | `/api/blocklist/export` | Export block list (JSON/CSV/TXT) |
| `POST` | `/api/blocklist/check` | Batch check phone numbers |
| `POST` | `/api/blocklist/subscribe` | Subscribe to blocking updates |
| `GET` | `/api/blocklist/stats` | Block list statistics |
| `POST` | `/api/users/register` | Register anonymous user |
| `GET` | `/api/users/:userId/reports` | Get user's reports |
| `POST` | `/api/users/sync` | Sync with SpamSuit |
| `GET` | `/api/stats` | Community overview stats |
| `GET` | `/api/stats/trending` | Trending spam numbers |
| `GET` | `/api/stats/categories` | Category breakdown |
| `GET` | `/api/stats/timeline` | Reports over time |

## Database Schema

Full documentation: [../DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md)

### Core Tables

| Table | Purpose |
|-------|---------|
| `users` | Anonymous user accounts (id, anonymousId, deviceToken, spamsuitId) |
| `spam_reports` | Spam submissions (phoneNumber, type, category, content, screenshotUrl) |
| `block_lists` | Aggregated block list (phoneNumber, reportCount, threatLevel) |
| `subscriptions` | Push notification subscriptions for blocking updates |

## Error Handling

The centralized error handler (`src/utils/errorHandler.js`) handles:

| Error Type | HTTP Status | Response |
|-----------|-------------|----------|
| `SequelizeValidationError` | 400 | Field-level validation errors |
| `SequelizeUniqueConstraintError` | 409 | Duplicate resource |
| `SequelizeForeignKeyConstraintError` | 400 | Invalid reference |
| `SequelizeDatabaseError` | 500 | Database error |
| `JsonWebTokenError` | 401 | Invalid token |
| `TokenExpiredError` | 401 | Token expired |
| Custom `statusCode` | varies | Custom API error |
| Unhandled | 500 | Internal server error (stack trace in dev) |

### Standard Error Response

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    { "field": "phoneNumber", "message": "Invalid phone number format" }
  ]
}
```

## Rate Limiting

Three rate limiters defined in `src/middleware/rateLimiter.js`:

| Limiter | Window | Max | Applied To |
|---------|--------|-----|-----------|
| General API | 15 min | 100 req/IP | All `/api/*` routes |
| Auth | 15 min | 5 req/IP | Auth endpoints |
| Reports | 1 hour | 20 req/IP | Report submission |

Rate limit headers are included in responses (`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`).

## Security

- **Helmet** — Sets CSP, X-Frame-Options, X-Content-Type-Options, etc.
- **CORS** — Configurable origin whitelist
- **Rate Limiting** — IP-based, with stricter limits on report submission
- **Input Validation** — express-validator on all POST endpoints
- **XSS Sanitization** — `sanitizeContent()` utility escapes HTML in text fields

## Development

```bash
# Run in dev mode (nodemon auto-reload)
npm run dev

# Lint
npm run lint
npm run lint:fix

# Reset database (undo + migrate + seed)
npm run db:reset
```

## License

MIT