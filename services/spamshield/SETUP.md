# SpamShield Setup Guide

Complete setup instructions for the SpamShield Blocking Service.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ (can use existing SpamCapture database)
- Redis 6+ (optional but recommended)
- Git

## Step-by-Step Setup

### 1. Clone/Navigate to Service

```bash
cd /home/jason/.openclaw/workspaces/tasklinkr/services/spamshield
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Required: Database connection
# Option A: Use connection string
DATABASE_URL=postgresql://user:password@localhost:5432/spamcapture

# Option B: Individual components
DB_HOST=localhost
DB_PORT=5432
DB_NAME=spamcapture
DB_USER=spamshield
DB_PASSWORD=your_secure_password

# Required: Security
ADMIN_API_KEY=generate_a_strong_random_key_here
JWT_SECRET=another_random_secret_min_32_chars

# Optional: Redis (for caching)
REDIS_URL=redis://localhost:6379

# Optional: Server settings
PORT=3001
NODE_ENV=production
```

### 4. Database Setup

#### If using existing SpamCapture database:

The service will use existing tables. Just add SpamShield-specific tables:

```bash
npm run db:migrate
```

#### If setting up fresh:

1. Create database:
```bash
createdb spamcapture
```

2. Run SpamCapture schema first (if available), then:
```bash
npm run db:migrate
```

### 5. Seed Test Data (Optional)

```bash
npm run db:seed
```

This creates:
- Sample spam reports for testing
- Manual override examples

### 6. Start the Service

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

The service will start on port 3001 (or your configured PORT).

### 7. Verify Installation

```bash
# Health check
curl http://localhost:3001/health

# API test
curl -X POST http://localhost:3001/api/v1/check \
  -H "Content-Type: application/json" \
  -H "X-API-Key: demo_key" \
  -d '{"phoneNumber": "+1234567890", "context": "call"}'
```

Open browser to `http://localhost:3001/` for the dashboard.

## Docker Deployment

### Using Docker

```bash
# Build
docker build -t spamshield .

# Run
docker run -d \
  -p 3001:3001 \
  --env-file .env \
  --name spamshield \
  spamshield
```

### Using Docker Compose

```bash
docker-compose up -d
```

This starts:
- SpamShield service
- PostgreSQL (if not using external)
- Redis (if not using external)

## Configuration Options

### Rate Limiting

```env
RATE_LIMIT_WINDOW_MS=60000      # 1 minute window
RATE_LIMIT_MAX_REQUESTS=100     # 100 requests per window
```

### Risk Thresholds

```env
RISK_THRESHOLD_LOW=30           # Safe threshold
RISK_THRESHOLD_MEDIUM=60        # Caution threshold
RISK_THRESHOLD_HIGH=85          # High risk threshold
RISK_THRESHOLD_BLOCK=90         # Auto-block threshold
```

### Cache Settings

```env
CACHE_TTL_SECONDS=300           # 5 minute default cache
INTELLIGENCE_REFRESH_INTERVAL=*/5 * * * *  # Every 5 minutes
```

## Troubleshooting

### Database Connection Failed

**Problem:** `ECONNREFUSED` error

**Solution:**
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Verify connection
psql -h localhost -U spamshield -d spamcapture

# Check pg_hba.conf allows connections
sudo nano /etc/postgresql/14/main/pg_hba.conf
# Add: host spamcapture spamshield 127.0.0.1/32 md5
```

### Redis Connection Failed

**Problem:** Cache unavailable

**Solution:**
- Service will work without Redis (graceful degradation)
- To enable caching:
```bash
# Install Redis
sudo apt-get install redis-server

# Start Redis
sudo service redis-server start

# Verify
redis-cli ping  # Should return PONG
```

### API Key Invalid

**Problem:** 401 Unauthorized errors

**Solution:**
```bash
# Check your API key is set
grep ADMIN_API_KEY .env

# Use demo_key for testing:
# X-API-Key: demo_key
```

### Port Already in Use

**Problem:** `EADDRINUSE` error

**Solution:**
```bash
# Find process using port 3001
lsof -i :3001

# Kill process or change PORT in .env
PORT=3002
```

## Production Deployment

### Systemd Service

Create `/etc/systemd/system/spamshield.service`:

```ini
[Unit]
Description=SpamShield Blocking Service
After=network.target

[Service]
Type=simple
User=spamshield
WorkingDirectory=/path/to/spamshield
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable spamshield
sudo systemctl start spamshield
sudo systemctl status spamshield
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.spamshield.io;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL/HTTPS

```bash
# Using Certbot
sudo certbot --nginx -d api.spamshield.io
```

## Monitoring

### Health Check Endpoint

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "checks": {
    "database": { "status": "healthy" },
    "cache": { "status": "healthy" }
  }
}
```

### Log Location

```bash
# If using systemd
sudo journalctl -u spamshield -f

# If using pm2
pm2 logs spamshield
```

## Next Steps

1. **Generate API Keys** for your clients
2. **Configure Monitoring** (Prometheus, Grafana)
3. **Set Up Alerting** for errors and downtime
4. **Review Rate Limits** based on usage patterns
5. **Enable Premium Features** for paying customers

## Support

For issues or questions:
- Check logs: `npm start 2>&1 | tee spamshield.log`
- Review API docs: `http://localhost:3001/api/docs`
- Health check: `http://localhost:3001/health`