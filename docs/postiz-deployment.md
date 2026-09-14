# Postiz Self-Hosted Deployment for AgentSocial

This document describes how to deploy Postiz alongside the AgentSocial stack to provide social media scheduling for 32+ platforms.

## Overview

Postiz is a self-hosted social media scheduling platform that AgentSocial will proxy to. This setup includes:
- Postiz app container
- PostgreSQL database (dedicated for Postiz)
- Redis (linked to existing host Redis on port 6379)
- Proper networking so AgentSocial backend can reach Postiz API

## Prerequisites

- Docker and Docker Compose (or Podman with compose support)
- ~2GB RAM, 1 CPU core
- Existing Redis instance running on port 6379 (already available in this host)

## Deployment

### 1. Copy Configuration Files

Place these files in the AgentSocial root directory:
- `docker-compose.postiz.yml`
- `.env.postiz`

### 2. Environment Configuration

The `.env.postiz` file contains all required environment variables. Key settings:

| Variable | Description | Value in this setup |
|----------|-------------|---------------------|
| `MAIN_URL` | Base URL for Postiz | `http://localhost:4007` |
| `FRONTEND_URL` | Frontend URL | `http://localhost:4007` |
| `NEXT_PUBLIC_BACKEND_URL` | Backend API URL | `http://localhost:4007/api` |
| `JWT_SECRET` | Secret for JWT tokens | Random string (change in production) |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postiz-user:postiz-password@postiz-postgres:5432/postiz-db-local` |
| `REDIS_URL` | Redis connection string | `redis://postiz-redis:6379` |
| `BACKEND_INTERNAL_URL` | AgentSocial backend URL (for internal calls) | `http://host.docker.internal:3002` |
| `TEMPORAL_ADDRESS` | Temporal service address | `temporal:7233` |
| `IS_GENERAL` | Enable general mode | `true` |
| `DISABLE_REGISTRATION` | Disable user registration | `false` |
| `RUN_CRON` | Enable background jobs | `true` |

### 3. Start the Stack

```bash
docker compose -f docker-compose.postiz.yml up -d
```

### 4. Verify Deployment

- Postiz Web UI: http://localhost:4007
- Health Check: http://localhost:4007/api/health (should return 200)
- Temporal Dashboard: http://localhost:8080

### 5. Stop the Stack

```bash
docker compose -f docker-compose.postiz.yml down
```

## Integration with AgentSocial

### API Base URL
AgentSocial backend should call Postiz API at: `http://postiz:4007/api` (internal Docker network) or `http://localhost:4007/api` (from host).

### Authentication
Postiz uses JWT tokens in the Authorization header. For service-to-service communication, AgentSocial should:
1. Obtain a JWT token by authenticating with Postiz credentials (if needed)
2. Include the token in requests: `Authorization: Bearer <token>`

However, for internal service communication, Postiz can be configured to allow internal calls without authentication by setting appropriate firewall rules or using a shared secret.

### Key Endpoints

#### Schedule a Post
```http
POST /posts
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "content": "Hello world!",
  "platforms": [
    {
      "platform": "linkedin",
      "accountId": "12345"
    }
  ],
  "scheduleAt": "2026-04-26T10:00:00Z"
}
```

#### Get Scheduled Posts
```http
GET /posts
Authorization: Bearer <jwt_token>
```

#### Delete a Post
```http
DELETE /posts/{id}
Authorization: Bearer <jwt_token>
```

### Notes for agentsocial-dev
1. The Postiz API is RESTful and returns JSON responses.
2. All endpoints require authentication except the health check.
3. For OAuth integrations (Facebook, Instagram, etc.), Postiz handles the OAuth flow internally. AgentSocial only needs to call the scheduling endpoints.
4. Consider creating a wrapper service in AgentSocial that:
   - Manages Postiz authentication tokens
   - Maps AgentSocial's brand/social account concepts to Postiz's platform/account model
   - Handles scheduling, rescheduling, and cancellation
   - Provides webhook endpoints for Postiz to report post status

## Troubleshooting

### Common Issues
- **Container fails to start**: Check logs with `docker compose -f docker-compose.postiz.yml logs postiz`
- **Database connection failed**: Verify PostgreSQL container is healthy and credentials match
- **Redis connection failed**: Ensure Redis is accessible on port 6379 from within Docker network
- **Port conflicts**: Change the port mapping in docker-compose.postiz.yml if 4007 is already in use

### In This Specific Environment
During deployment attempt, we encountered issues with Podman rootless mode requiring `newuidmap` and `slirp4netns` executables. In a standard Docker installation or with properly configured rootless Podman, this setup should work without issues.

## Backup and Maintenance

### Backing Up Data
- PostgreSQL data: `/var/lib/postgresql/data` (mapped to `postgres-volume`)
- Uploads: `/uploads` (mapped to `postiz-uploads`)
- Config: `/config/` (mapped to `postiz-config`)

### Updating Postiz
```bash
docker compose -f docker-compose.postiz.yml pull
docker compose -f docker-compose.postiz.yml up -d
```