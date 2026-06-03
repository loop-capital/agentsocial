# Zernio API Reference

Base URL: `https://zernio.com/api/v1`
Auth: `Authorization: Bearer sk_...`

## Platforms
Instagram, TikTok, X (Twitter), LinkedIn, Facebook, Threads, YouTube, Bluesky, Pinterest, Reddit, Snapchat, Telegram, WhatsApp, Discord, Google Business Profile

Plus ad platforms: Meta Ads, Google Ads, LinkedIn Ads, TikTok Ads, Pinterest Ads, X Ads

## Key Endpoints

### Profiles
- `GET /profiles` — List profiles
- `POST /profiles` — Create profile `{name, description, color}`
- `GET /profiles/:id` — Get profile
- `PUT /profiles/:id` — Update profile
- `DELETE /profiles/:id` — Delete profile

### Accounts
- `GET /accounts?profileId=` — List accounts
- `GET /accounts/:id` — Get account details
- `GET /accounts/health` — Check account health

### Connect (OAuth)
- `GET /connect/:platform?profileId=` — Get OAuth URL
- `POST /connect/:platform` — Complete OAuth flow
- `DELETE /accounts/:id` — Disconnect account

### Posts
- `POST /posts` — Create/schedule post `{content, scheduledFor?, publishNow?, timezone, platforms: [{platform, accountId}]}`
- `GET /posts` — List posts
- `GET /posts/:id` — Get post
- `PUT /posts/:id` — Update post
- `DELETE /posts/:id` — Delete post
- `POST /posts/:id/retry` — Retry failed post

### Media
- `POST /media/presign` — Get presigned upload URL

### Queue
- `GET /queue-slots` — List queue slots
- `POST /queue-slots` — Create slot
- `PUT /queue-slots/:id` — Update slot
- `DELETE /queue-slots/:id` — Delete slot

### Inbox
- `GET /messages/conversations` — List DM conversations
- `GET /messages/conversations/:id` — Get conversation
- `GET /messages/:conversationId/messages` — Get messages
- `POST /messages/:conversationId/send` — Send DM `{accountId, message}`
- `GET /comments` — List comments across accounts
- `GET /comments/:postId` — Get post comments
- `POST /comments/:postId/reply` — Reply to comment `{accountId, message, commentId}`
- `GET /reviews` — List reviews (FB, GBP)
- `POST /reviews/:reviewId/reply` — Reply to review `{accountId, message}`

### Contacts
- `GET /contacts` — List contacts (search, tag filters)
- `POST /contacts` — Create contact `{profileId, name, channels: [{accountId, platform, platformIdentifier}]}`
- `GET /contacts/:id` — Get contact
- `PUT /contacts/:id` — Update contact
- `DELETE /contacts/:id` — Delete contact
- `GET /contacts/:id/channels` — List contact channels
- `POST /contacts/:id/fields/:slug` — Set custom field
- `DELETE /contacts/:id/fields/:slug` — Clear custom field
- `POST /contacts/bulk` — Bulk create (up to 1000)

### Broadcasts
- `GET /broadcasts` — List broadcasts
- `POST /broadcasts` — Create draft `{profileId, accountId, platform, name, message, templateName?}`
- `GET /broadcasts/:id` — Get broadcast + stats
- `PUT /broadcasts/:id` — Update (draft only)
- `DELETE /broadcasts/:id` — Delete (draft only)
- `POST /broadcasts/:id/send` — Send immediately
- `POST /broadcasts/:id/schedule` — Schedule `{scheduledAt}`
- `POST /broadcasts/:id/cancel` — Cancel
- `GET /broadcasts/:id/recipients` — List recipients
- `POST /broadcasts/:id/recipients` — Add recipients `{contactIds, useSegment?}`

### Sequences
- `GET /sequences` — List sequences
- `POST /sequences` — Create `{profileId, accountId, platform, name, steps: [{order, delayMinutes, message: {text}}]}`
- `GET /sequences/:id` — Get sequence + steps
- `PUT /sequences/:id` — Update
- `DELETE /sequences/:id` — Delete
- `POST /sequences/:id/activate` — Activate
- `POST /sequences/:id/pause` — Pause
- `POST /sequences/:id/enroll` — Enroll contacts `{contactIds}`
- `DELETE /sequences/:id/enroll/:contactId` — Unenroll
- `GET /sequences/:id/enrollments` — List enrollments

### Automations (Comment-to-DM)
- `GET /automations` — List automations
- `POST /automations` — Create `{profileId, accountId, platformPostId, name, keywords?, dmMessage, commentReply?}`
- `GET /automations/:id` — Get + recent logs
- `PUT /automations/:id` — Update `{isActive, keywords, dmMessage, commentReply}`
- `DELETE /automations/:id` — Delete + logs
- `GET /automations/:id/logs` — List trigger logs

### Analytics
- `GET /analytics/posts` — Post performance metrics
- `GET /analytics/daily` — Daily engagement stats
- `GET /analytics/best-time` — Best times to post
- `GET /analytics/google-business/performance` — GBP performance
- `GET /analytics/youtube/demographics` — YouTube demographics
- `GET /analytics/google-business/search-keywords` — GBP search keywords

### Webhooks
- `GET /webhooks/settings` — Get webhook config
- `POST /webhooks/settings` — Update `{url, events[], secret}`
- `POST /webhooks/test` — Test webhook

### API Keys
- `GET /api-keys` — List API keys
- `POST /api-keys` — Create key `{name}`
- `DELETE /api-keys/:id` — Delete key

## CLI
`npm install -g @zernio/cli`
`zernio auth:login` or `zernio auth:set --key sk_...`

## PLEIJ Account IDs
- **Profile**: `6a1f80e465c0aeaa43b9f1dc`
- **TikTok Account**: `6a1f95212b2567671aa807d1` (@pleijsalon.com)
- **GBP Account**: TBD (pending connection)