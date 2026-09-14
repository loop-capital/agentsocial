# Zernio Integration — GBP + Social Publishing Bridge (ADR-013)

**Date:** 2026-06-02
**Status:** 🟢 API key stored, service + routes built, TS errors zero
**Why:** Google rejected GBP API access (60-day age requirement). Zernio provides immediate access to GBP + 14 other social platforms, no Google approval needed.

### Decision (ADR-013)
- **GBP bridge only**: Use Zernio ONLY for Google Business Profile + inbox/reviews/broadcasts/sequences/automations/analytics
- **Composio stays**: Publishing to Instagram, Facebook, TikTok, Twitter, LinkedIn stays on Composio (already built, free tier)
- **No overlap**: Don't connect IG/FB/TikTok to Zernio — those go through Composio
- **Free tier**: PLEIJ = 1 GBP account = $0/mo. Future clients = $6/account/mo until we get direct GBP API access
- **Long-term plan**: When Google approves our GBP API (July 22 reapply), we swap Zernio's GBP for direct API, but keep Zernio for inbox/broadcasts/sequences/automations/analytics
- **Google reapply date**: July 22, 2026 (cron reminder set)

### Architecture: Composio vs Zernio

| Capability | Composio | Zernio |
|-----------|----------|--------|
| OAuth connections | ✅ Free tier (20K calls/mo) | ✅ Included |
| Publish to IG/FB/YouTube | ✅ Use Composio | ⬜ Don't duplicate |
| Publish to TikTok | ❌ No managed auth | ✅ Use Zernio |
| Inbox (DMs, comments) | ⚠️ Individual actions only | ✅ Unified inbox |
| Review management | ❌ No GBP reviews | ✅ GBP + FB reviews |
| Broadcasts (bulk DM) | ❌ | ✅ |
| Sequences (drip campaigns) | ❌ | ✅ |
| Automations (comment→DM) | ❌ | ✅ |
| Cross-platform analytics | ❌ | ✅ |
| Contacts CRM | ❌ | ✅ |

| Publish to GBP | ❌ No toolkit | ✅ Use Zernio |
IG, FB, TikTok, Twitter, LinkedIn stay on **Composio** (already built, free)

### Implementation Status
- ✅ API key stored in `packages/api/.env` (`ZERNIO_API_KEY`)
- ✅ Service adapter: `packages/api/src/services/zernio.ts` (290 lines)
- ✅ Routes: `packages/api/src/routes/social.ts` (14 endpoints, `/api/v1/social/*`)
- ✅ Registered in `server.ts`
- ✅ Zero TypeScript errors
- ✅ PLEIJ Salon profile created (ID: `6a1f80e465c0aeaa43b9f1dc`)
- ✅ OAuth links verified for GBP, Instagram, Facebook
- ✅ Platform identifier: `googlebusiness` (not `google_business`)
- 🟡 MCP server configured — needs testing with Maven
- ✅ PLEIJ TikTok connected via Zernio — @pleijsalon.com, 14 followers, ACTIVE
- ✅ PLEIJ Instagram connected via Composio — `ca_U1uiawQzobgm`, ACTIVE
- ✅ PLEIJ Facebook connected via Composio — `ca_ecKLBAp34S0R`, ACTIVE
- ✅ PLEIJ YouTube connected via Composio — `ca_kOivMNjyNx9f`, ACTIVE
- ✅ PLEIJ GBP connected via Zernio — `6a1f83c42b2567671aa784ef`, Pleij Salon, ACTIVE (on Default profile `6a1f7fa1f7636104467d4a07`)
- ⬜ Move GBP account from Default profile to PLEIJ profile (or keep profile-agnostic)
- ⬜ Frontend: social accounts page uses Composio for IG/FB/YouTube, Zernio for GBP+TikTok
- ✅ Inbox/broadcast/sequence/automation routes — ALL BUILT (50+ endpoints)
- ✅ Contacts CRM routes — BUILT
- ✅ Analytics integration — BUILT

### Key API Endpoints (Built)
- `GET /social/profiles` — List profiles
- `POST /social/profiles` — Create profile
- `DELETE /social/profiles/:id` — Delete profile
- `GET /social/accounts` — List connected accounts
- `DELETE /social/accounts/:id` — Disconnect account
- `GET /social/connect/:platform` — Get OAuth link
- `POST /social/connect/:platform` — Complete OAuth
- `POST /social/posts` — Create/schedule post
- `GET /social/posts` — List posts
- `GET /social/posts/:id` — Get single post
- `PUT /social/posts/:id` — Update post
- `DELETE /social/posts/:id` — Delete post
- `POST /social/posts/:id/retry` — Retry failed post
- `POST /social/media/presign` — Upload media
- `GET /social/usage` — Usage stats

### Endpoints to Build (Next Phase)
- `GET /social/inbox/conversations` — List DMs
- `GET /social/inbox/conversations/:id` — Conversation detail
- `GET /social/inbox/messages/:id` — Messages in conversation
- `POST /social/inbox/send/:id` — Send DM
- `GET /social/inbox/comments` — List comments
- `POST /social/inbox/reply/:postId` — Reply to comment
- `GET /social/inbox/reviews` — List reviews (GBP + FB)
- `POST /social/inbox/review-reply/:id` — Reply to review
- `GET /social/contacts` — List contacts
- `POST /social/contacts` — Create contact
- `POST /social/broadcasts` — Create broadcast
- `POST /social/broadcasts/:id/send` — Send broadcast
- `POST /social/sequences` — Create drip sequence
- `POST /social/automations` — Create comment-to-DM automation
- `GET /social/analytics/posts` — Post metrics
- `GET /social/analytics/daily` — Daily engagement
- `GET /social/analytics/best-time` — Best posting times

### Cost Analysis (PLEIJ)
| Accounts | Monthly Cost |
|----------|-------------|
| TikTok (connected) | **$0** (free tier, 1st account) |
| GBP (pending) | **$0** (free tier, 2nd account) |
| 3-10 accounts | $6/account/mo |
| 11-100 | $3/account/mo |
| 101-2000 | $1/account/mo |

Note: IG/FB/YouTube go through **Composio** (free tier, 20K calls/mo), not Zernio. TikTok goes through **Zernio** (Composio doesn't offer managed TikTok auth).

### Credentials
- ✅ Zernio API key: stored in `packages/api/.env`
- ✅ PLEIJ profile ID: `6a1f80e465c0aeaa43b9f1dc`
- ✅ Connected social accounts:
  - Composio: Instagram (ca_U1uiawQzobgm), Facebook (ca_ecKLBAp34S0R), YouTube (ca_kOivMNjyNx9f)
  - Zernio: TikTok (6a1f95212b2567671aa807d1)