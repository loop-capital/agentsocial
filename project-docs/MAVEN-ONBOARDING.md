# Maven Team Onboarding — AgentSocial Publishing

**Last Updated:** 2026-06-03
**For:** Maven 🎯 and team (Penn, Pixel, Pulse, Scout, Metric, Bridge)

---

## 🖥️ System Access

| Service | URL | Notes |
|---------|-----|-------|
| **Dashboard** | `http://localhost:3000` | Web UI (browser on PC3) |
| **API** | `http://localhost:3001/api/v1` | REST API for agents |
| **API Key** | `X-API-Key: as_dev_GvRoZQfNEa9d_9s0n5pPkuUm` | Use in every request header |
| **Health Check** | `GET http://localhost:3001/api/v1/health` | Should return `{"status":"ok"}` |

**Authentication:** All `/api/v1/*` endpoints require either:
- `X-API-Key: as_dev_GvRoZQfNEa9d_9s0n5pPkuUm` header, OR
- `Authorization: Bearer <JWT>` header (from `/auth/login`)

---

## 🔑 PLEIJ Salon — Connected Accounts

| Platform | Account ID | Via | Profile | Status |
|----------|------------|-----|---------|--------|
| **Google Business Profile** | `6a1f83c42b2567671aa784ef` | Zernio | Default | ✅ Active |
| **TikTok** | `6a1f95212b2567671aa807d1` | Zernio | PLEIJ | ✅ Active |
| **Instagram** | `ca_U1uiawQzobgm` | Composio | — | ✅ Active |
| **Facebook** | `ca_ecKLBAp34S0R` | Composio | — | ✅ Active |
| **YouTube** | `ca_kOivMNjyNx9f` | Composio | — | ✅ Active |

### Zernio Profiles
| Profile | ID | Purpose |
|---------|-----|---------|
| Default | `6a1f7fa1f7636104467d4a07` | GBP account lives here |
| PLEIJ Salon | `6a1f80e465c0aeaa43b9f1dc` | TikTok account lives here |

---

## 📋 How to Publish

### Step 1: Create Content (Penn ✍️ + Pixel 🎨)
Penn writes copy, Pixel creates visuals. Content goes to `social-media/queue/approved/`.

### Step 2: Approve (Maven 🎯)
Maven reviews and approves. Only approved content gets published.

### Step 3: Publish (Bridge 🚀)
Bridge calls the AgentSocial API to publish.

---

## 🔌 API Endpoints — Publishing Workflow

### List Connected Accounts
```bash
curl -s http://localhost:3001/api/v1/social/accounts?profileId=6a1f80e465c0aeaa43b9f1dc \
  -H 'X-API-Key: as_dev_GvRoZQfNEa9d_9s0n5pPkuUm'
```

### Connect a New Account
```bash
# Get OAuth connect link for a platform
curl -s http://localhost:3001/api/v1/social/connect/tiktok \
  -H 'X-API-Key: as_dev_GvRoZQfNEa9d_9s0n5pPkuUm'

# Supported platforms: googlebusiness, tiktok, instagram, facebook, youtube
```

### Create a Post (GBP — Text Only)
```bash
curl -X POST http://localhost:3001/api/v1/social/posts \
  -H 'X-API-Key: as_dev_GvRoZQfNEa9d_9s0n5pPkuUm' \
  -H 'Content-Type: application/json' \
  -d '{
    "profileId": "6a1f7fa1f7636104467d4a07",
    "accountId": "6a1f83c42b2567671aa784ef",
    "content": "Summer is here! ☀️ Book your appointment at PLEIJ Salon — link in bio.",
    "platforms": ["googlebusiness"]
  }'
```

### Create a Post (TikTok — Requires Media)
```bash
# Step 1: Get presigned upload URL
curl -X POST http://localhost:3001/api/v1/social/media/presign \
  -H 'X-API-Key: as_dev_GvRoZQfNEa9d_9s0n5pPkuUm' \
  -H 'Content-Type: application/json' \
  -d '{"filename": "pleij-summer-reel.mp4", "contentType": "video/mp4"}'

# Step 2: Upload media to the presigned URL

# Step 3: Create post with media reference
curl -X POST http://localhost:3001/api/v1/social/posts \
  -H 'X-API-Key: as_dev_GvRoZQfNEa9d_9s0n5pPkuUm' \
  -H 'Content-Type: application/json' \
  -d '{
    "profileId": "6a1f80e465c0aeaa43b9f1dc",
    "accountId": "6a1f95212b2567671aa807d1",
    "content": "Summer vibes at PLEIJ ☀️ #pleij #salon #hairstylist",
    "platforms": ["tiktok"],
    "mediaUrls": ["<uploaded-media-url>"]
  }'
```

### Get Post Status
```bash
curl -s http://localhost:3001/api/v1/social/posts/<postId> \
  -H 'X-API-Key: as_dev_GvRoZQfNEa9d_9s0n5pPkuUm'
```

### Retry a Failed Post
```bash
curl -X POST http://localhost:3001/api/v1/social/posts/<postId>/retry \
  -H 'X-API-Key: as_dev_GvRoZQfNEa9d_9s0n5pPkuUm'
```

---

## 📥 Inbox & Engagement

### Get Inbox Conversations
```bash
curl -s http://localhost:3001/api/v1/social/inbox/conversations?accountId=6a1f83c42b2567671aa784ef \
  -H 'X-API-Key: as_dev_GvRoZQfNEa9d_9s0n5pPkuUm'
```

### Reply to a Conversation
```bash
curl -X POST http://localhost:3001/api/v1/social/inbox/conversations/<conversationId>/send \
  -H 'X-API-Key: as_dev_GvRoZQfNEa9d_9s0n5pPkuUm' \
  -H 'Content-Type: application/json' \
  -d '{"message": "Thanks for reaching out! We have availability this week."}'
```

### Get Reviews
```bash
curl -s http://localhost:3001/api/v1/social/inbox/reviews?accountId=6a1f83c42b2567671aa784ef \
  -H 'X-API-Key: as_dev_GvRoZQfNEa9d_9s0n5pPkuUm'
```

---

## 📊 Analytics

### Post Analytics
```bash
curl -s "http://localhost:3001/api/v1/social/analytics/posts?accountId=6a1f83c42b2567671aa784ef" \
  -H 'X-API-Key: as_dev_GvRoZQfNEa9d_9s0n5pPkuUm'
```

### Daily Summary
```bash
curl -s "http://localhost:3001/api/v1/social/analytics/daily?accountId=6a1f83c42b2567671aa784ef&days=7" \
  -H 'X-API-Key: as_dev_GvRoZQfNEa9d_9s0n5pPkuUm'
```

### Best Time to Post
```bash
curl -s "http://localhost:3001/api/v1/social/analytics/best-time?accountId=6a1f83c42b2567671aa784ef" \
  -H 'X-API-Key: as_dev_GvRoZQfNEa9d_9s0n5pPkuUm'
```

---

## 📡 Broadcasts & Sequences

### Send a Broadcast
```bash
# Create broadcast
curl -X POST http://localhost:3001/api/v1/social/broadcasts \
  -H 'X-API-Key: as_dev_GvRoZQfNEa9d_9s0n5pPkuUm' \
  -H 'Content-Type: application/json' \
  -d '{"profileId": "6a1f80e465c0aeaa43b9f1dc", "message": "Summer sale! 20% off all color services this week 🎨"}'

# Send it
curl -X POST http://localhost:3001/api/v1/social/broadcasts/<broadcastId>/send \
  -H 'X-API-Key: as_dev_GvRoZQfNEa9d_9s0n5pPkuUm'
```

### Create an Automation Sequence
```bash
# Create sequence
curl -X POST http://localhost:3001/api/v1/social/sequences \
  -H 'X-API-Key: as_dev_GvRoZQfNEa9d_9s0n5pPkuUm' \
  -H 'Content-Type: application/json' \
  -d '{"name": "New Client Welcome", "steps": [...]}'

# Activate it
curl -X POST http://localhost:3001/api/v1/social/sequences/<sequenceId>/activate \
  -H 'X-API-Key: as_dev_GvRoZQfNEa9d_9s0n5pPkuUm'
```

---

## 📱 Platform-Specific Rules

| Platform | Text-Only | Images | Video | Notes |
|----------|-----------|--------|-------|-------|
| **Google Business Profile** | ✅ | ✅ | ✅ | Posts appear on Maps & Search |
| **TikTok** | ❌ | ✅ | ✅ | **Media required** — no text-only posts |
| **Instagram** | 🟡 | ✅ | ✅ | Stories/Reels need Composio flow |
| **Facebook** | ✅ | ✅ | ✅ | Through Composio |
| **YouTube** | ❌ | — | ✅ | Video only, through Composio |

---

## ⚠️ Important Notes

1. **TikTok requires media** — every TikTok post MUST include images or video
2. **GBP is on Default profile** — use profileId `6a1f7fa1f7636104467d4a07` for GBP posts
3. **TikTok is on PLEIJ profile** — use profileId `6a1f80e465c0aeaa43b9f1dc` for TikTok posts
4. **Zernio = GBP + TikTok** — these go through our Zernio bridge
5. **Composio = IG + FB + YouTube** — these use the existing Composio connectors
6. **Zernio free tier** — first 2 accounts free, then $6/acct/mo (currently 2 accounts)
7. **GBP API access** — rejected June 2, reapply July 22. Using Zernio bridge until then.

---

## 🚀 Quick Start for Bridge

1. **Check accounts:** `GET /social/accounts`
2. **Create post:** `POST /social/posts` with profileId, accountId, content, platforms
3. **Check status:** `GET /social/posts/:id`
4. **On failure:** `POST /social/posts/:id/retry`
5. **Update queue:** Write result to `social-media/queue/status.md`

---

## 🔧 Troubleshooting

| Issue | Fix |
|-------|-----|
| API returns 401 | Check X-API-Key header, key is `as_dev_GvRoZQfNEa9d_9s0n5pPkuUm` |
| API returns 404 | Route uses `/social/` not `/social/zernio/` |
| TikTok post fails | Make sure mediaUrls is included — TikTok doesn't allow text-only |
| GBP post goes to wrong profile | Use Default profile (`6a1f7fa1f7636104467d4a07`) not PLEIJ |
| Services down on PC3 | Run `pm2 restart all` (PATH may need `export PATH=$PATH:/home/loopcapital/.npm-global/bin`) |

---

*This guide is maintained by the CEO agent. Maven and team should reference it for all publishing operations.*