# AgentSocial Architecture

> System overview, service responsibilities, and data flow.

## System Overview

AgentSocial is a social media management platform. It's a pnpm monorepo with Next.js web apps, API services, and specialized connectors.

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                         │
│  Next.js 14 App • React 18 • Tailwind CSS                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                    ┌───────▼───────┐
                    │   API Layer    │
                    │   (packages/api)│
                    └───────┬───────┘
                            │
      ┌─────────────┬───────┼───────┬─────────────┐
      │             │       │       │             │
┌─────▼─────┐ ┌───▼───┐ ┌▼──┐ ┌──▼───┐ ┌──────▼──────┐
│ Facebook   │ │Voice  │ │DB │ │Auth  │ │Adobe Toolkit│
│ Connector  │ │Agent  │ │   │ │      │ │             │
└────────────┘ └───────┘ └───┘ └──────┘ └─────────────┘
```

## Monorepo Structure

```
agentsocial/
├── packages/
│   ├── web/              ← Main Next.js app (v14)
│   ├── frontend/         ← Frontend app (v14)
│   ├── api/              ← API service
│   ├── shared/           ← Shared utilities
│   ├── facebook-connector/ ← Facebook integration
│   ├── adobe-toolkit/    ← Adobe creative tools
│   └── voice-agent/      ← Voice/agent processing
├── project-docs/         ← Architecture, infrastructure, decisions
├── scripts/              ← Git hooks, utility scripts
└── src/                  ← Root-level source
```

## Key Design Decisions

| Decision   | Choice                | Why                          |
| ---------- | --------------------- | ---------------------------- |
| Framework  | Next.js 14 + React 18 | App Router, SSR, API routes  |
| Monorepo   | pnpm workspaces       | Shared packages, single repo |
| Social API | Facebook Graph API    | Primary platform integration |
| Auth       | Better Auth           | Multi-tenant, OAuth support  |
