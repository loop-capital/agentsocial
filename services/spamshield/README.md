# SpamShield Blocking Service

Real-time spam/fraud call and text blocking API powered by pooled intelligence from SpamCapture reports.

## Overview

SpamShield provides a RESTful API for real-time spam detection and blocking decisions. It aggregates data from SpamCapture reports to calculate risk scores and provide actionable blocking recommendations.

## Features

- ✅ **Real-time Risk Scoring** - Check phone numbers against spam database in milliseconds
- ✅ **Smart Blocking Decisions** - Risk-based recommendations with configurable sensitivity
- ✅ **Pooled Intelligence** - Leverages SpamCapture's collective report data
- ✅ **Caching Layer** - Redis caching for low-latency responses
- ✅ **Manual Overrides** - Admin controls for edge cases and false positives
- ✅ **Monitoring Dashboard** - Web UI for statistics and administration
- ✅ **Freemium Structure** - Basic/Premium tier support built-in
- ✅ **Batch Checking** - Check multiple numbers at once (premium)

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (shared with SpamCapture)
- Redis 6+ (optional but recommended for caching)

### Installation

```bash
# Clone/navigate to the service
cd /path/to/spamshield

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
# Edit .env with your database and Redis settings

# Run database migrations
npm run db:migrate

# Seed test data (optional)
npm run db:seed

# Start the service
npm start
```

### Using the API

```bash
# Check a phone number
curl -X POST http://localhost:3001/api/v1/check \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo_key" \
  -d '{"phoneNumber": "+1234567890", "context": "call"}'

# Response:
# {
#   "success": true,
#   "data": {
#     "phoneNumber": "+1234567890",
#     "score": 85,
#     "level": "high",
#     "recommendation": "LIKELY_BLOCK",
#     "action": "screen_call",
#     "factors": [...],
#     "metadata": {...}
#   }
# }
```

## API Endpoints

### Blocking

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/check` | Check a phone number |
| GET | `/api/v1/check/:number` | Check via URL |
| POST | `/api/v1/check/batch` | Batch check (premium) |

### Statistics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/stats` | Overall statistics |
| GET | `/api/v1/stats/top-offenders` | Top spam numbers |
| GET | `/api/v1/stats/system` | System status (auth) |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/admin/override` | Manual override |
| DELETE | `/api/v1/admin/override/:number` | Remove override |
| GET | `/api/v1/admin/overrides` | List overrides |
| GET | `/api/v1/admin/check-stats` | API usage stats |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Web dashboard |
| GET | `/api/docs` | API documentation |
| GET | `/health` | Health check |

## Risk Scoring

### Score Calculation

The risk score (0-100) is calculated based on:

- **Report Frequency** (0-40 pts) - Total number of reports
- **Recency** (0-25 pts) - How recently reports were made
- **Velocity** (0-20 pts) - Reports in last 30 days
- **Pattern Diversity** (0-10 pts) - Part of multiple spam campaigns
- **Victim Spread** (0-10 pts) - Unique victims affected
- **Attorney Validation** (0-5 pts) - Matched to legal cases
- **Violation Severity** (0-10 pts) - Type of violations
- **False Positive Penalty** (-15 to 0 pts) - Dismissed reports

### Sensitivity Levels

| Level | Low Threshold | Medium | High | Block |
|-------|---------------|--------|------|-------|
| Low | 40 | 60 | 80 | 95 |
| Medium | 30 | 60 | 85 | 90 |
| High | 25 | 50 | 75 | 85 |

### Risk Levels & Actions

| Score | Level | Recommendation | Action |
|-------|-------|----------------|--------|
| 90-100 | Critical | BLOCK | block_all |
| 85-89 | High | LIKELY_BLOCK | screen_call / filter_text |
| 60-84 | Medium | CAUTION | warn_user |
| 30-59 | Low | LIKELY_SAFE | allow |
| 0-29 | Safe | SAFE | allow |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client                               │
│         (App, Phone, Carrier, Security Tool)                │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  SpamShield API (Express)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  /check      │  │   /stats     │  │   /admin     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────────┐
    │  Redis   │   │PostgreSQL│   │  Dashboard   │
    │  Cache   │   │SpamCapture│  │    UI        │
    └──────────┘   └──────────┘   └──────────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │   SpamCapture Data   │
              │ (spam_reports, etc.) │
              └──────────────────────┘
```

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/spamcapture
DB_HOST=localhost
DB_PORT=5432
DB_NAME=spamcapture
DB_USER=spamshield
DB_PASSWORD=your_password

# Redis
REDIS_URL=redis://localhost:6379

# Security
ADMIN_API_KEY=your_admin_key
JWT_SECRET=your_jwt_secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Risk Scoring
RISK_THRESHOLD_LOW=30
RISK_THRESHOLD_MEDIUM=60
RISK_THRESHOLD_HIGH=85
RISK_THRESHOLD_BLOCK=90

# Intelligence Refresh
INTELLIGENCE_REFRESH_INTERVAL=*/5 * * * *
CACHE_TTL_SECONDS=300
```

## Deployment

### Docker

```bash
# Build image
docker build -t spamshield .

# Run container
docker run -p 3001:3001 --env-file .env spamshield
```

### Docker Compose

```bash
docker-compose up -d
```

### Production Checklist

- [ ] Change default API keys
- [ ] Enable HTTPS
- [ ] Configure rate limiting
- [ ] Set up log aggregation
- [ ] Enable database connection pooling
- [ ] Configure Redis persistence
- [ ] Set up monitoring/alerting

## Development

```bash
# Run with auto-reload
npm run dev

# Run tests
npm test

# Run linter
npm run lint

# Refresh intelligence manually
npm run refresh:intelligence
```

## Integration Examples

### JavaScript/TypeScript

```javascript
const response = await fetch('https://api.spamshield.io/v1/check', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your_api_key',
  },
  body: JSON.stringify({
    phoneNumber: '+1234567890',
    context: 'call',
  }),
});

const result = await response.json();
if (result.data.score >= 90) {
  // Block the call
}
```

### Python

```python
import requests

response = requests.post(
    'https://api.spamshield.io/v1/check',
    headers={'X-API-Key': 'your_api_key'},
    json={
        'phoneNumber': '+1234567890',
        'context': 'call'
    }
)

result = response.json()
if result['data']['score'] >= 90:
    # Block the call
    pass
```

## License

MIT License - TaskLinkr Platform