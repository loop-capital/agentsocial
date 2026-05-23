# AgentSocial Infrastructure

> Deployment, environment, and operational details.

## Environments

### Production

- **Platform**: Vercel
- **Repo**: `loop-capital/agentsocial`
- **Monorepo**: pnpm workspaces

### Local Development

```bash
pnpm install
pnpm --filter @agentsocial/web dev
```

## Environment Variables

Key vars (check packages/web/.env.local for current values):

- `AUTH_SECRET` — Auth session secret
- `DATABASE_URL` — Database connection
- `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` — Facebook integration
- `NEXT_PUBLIC_*` — Client-side vars

## Deployment

```bash
vercel deploy --prod
```

## Operational Runbook

### Redeploy

```bash
git pull origin main
pnpm install
vercel deploy --prod
```
