# AgentSocial

Agent-first social media management platform. Buffer-style scheduling with first-class APIs for autonomous agents.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL + Redis)
docker compose up -d

# Generate database migrations
pnpm db:generate

# Run migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

## Project Structure

```
agentsocial/
├── packages/
│   ├── api/          # Fastify REST API
│   ├── web/          # Next.js 14 dashboard
│   └── shared/       # Shared types and schemas
├── docker-compose.yml
├── turbo.json
└── package.json
```

## Tech Stack

| Package | Technology |
|---------|------------|
| API | Fastify + TypeScript + Drizzle ORM |
| Web | Next.js 14 + Tailwind CSS |
| Database | PostgreSQL |
| Cache/Queue | Redis + BullMQ |
| Auth | JWT + API Keys |
| Storage | Cloudflare R2 / S3 |

## Development

### API (port 3001)
```bash
pnpm dev:api
```

### Web Dashboard (port 3000)
```bash
pnpm dev:web
```

### Database Migrations
```bash
pnpm db:generate   # Generate migrations from schema changes
pnpm db:migrate    # Apply migrations
pnpm db:studio     # Open Drizzle Studio
```

## MVP Target: July 7, 2025

See [build-roadmap.md](../../memory/agentsocial/build-roadmap.md) for full timeline.