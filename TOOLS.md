# TOOLS

## Composio (Facebook/Instagram/social integrations)
- API key is in the OpenClaw secret store as `COMPOSIO_API_KEY` (write-only, team scope).
- Allowed host: `backend.composio.dev` only.
- Reference it as `${COMPOSIO_API_KEY}` / SecretRef in requests; never ask for the raw key in chat/Telegram, never write it to files.
- Check with: `openclaw secrets store list`

## Composio status (2026-09-20) — DONE, do not redo
- Migrated to `@composio/core` (v3 API). The deprecated `composio-core` package was removed. Do NOT reinstall, update, or "fix" it, and do not use raw HTTP as a workaround.
- Code: `packages/api/src/services/composio.ts`. Key is in `.env` as COMPOSIO_API_KEY. Service `agentsocial-backend` (systemctl --user) is running the new build.
- Verified live: Facebook, Instagram, YouTube accounts for user `pleij-salon` are ACTIVE; Instagram profile fetch works.
- Next work is posting/scheduling features, not SDK repair.

## Publishing architecture (2026-09-20) — read before touching posting code
- Scheduled posts: DB is the source of truth; BullMQ/Redis is only the timer. `queues/requeue.ts` rebuilds jobs on start + every 5 min. Worker guards skip cancelled/rescheduled/already-published posts.
- Router: `services/publishing/index.ts`. Composio = instagram, facebook, linkedin, twitter, tiktok (photo only). Zernio = gbp only (Zernio bills per account past the free 2; PLEIJ's GBP + TikTok use the 2 free slots, TikTok overridden with `settings.provider = "zernio"`). Override per channel via `channels.settings.provider`, or env `PUBLISH_PROVIDER_<PLATFORM>`.
- Channel settings hold provider ids: `composio_account_id`, `composio_user_id`, `zernio_account_id`. PLEIJ Composio connections live under user `pleij-salon`.
- Not built yet: video posting (TikTok/FB/YouTube), LinkedIn/X media, Pinterest, YouTube. They fail with a clear non-retried error, never silently.
- AI planner: `services/ai/*`, routes `/api/v1/ai/*`, UI `/ai-planner`. Needs ANTHROPIC_API_KEY or GEMINI_API_KEY in packages/api/.env (not set yet). Posting times are generic defaults, not analytics-based.
- Never run live publish tests against PLEIJ without Jason's OK.
