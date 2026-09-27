# Facebook OAuth - Multi-Page Business Account Support

## Problem
When a Facebook user has multiple business pages (e.g., "Improvio", "OttoCase", etc.), the OAuth callback was auto-connecting ALL pages without letting the user choose.

## Solution
Added a page picker flow:
1. **Single page** → Auto-connects + redirects with `?connected=facebook&page=<name>`
2. **Multiple pages** → Stores in temp cache + redirects with `?facebook_pages=<key>` → User picks which pages to connect

## Backend Changes

### `/packages/api/src/routes/callbacks.ts`
- Added `globalThis.__facebookPageCache` Map for temp storage (10min TTL)
- Modified Facebook callback to:
  - If 1 page: auto-connect, redirect to `?connected=facebook&page=<name>`
  - If 0 pages: redirect to `?error=facebook_no_pages`
  - If 2+ pages: store in cache, redirect to `?facebook_pages=<tempKey>`

### New Endpoints (public, no JWT required)
- `GET /api/v1/channels/facebook/pages?key=<key>` — Returns `{ pages: [{id, name}] }` from cache
- `POST /api/v1/channels/facebook/connect-pages` — Body `{ key, page_ids: ["id1", "id2"] }`
  - Persists selected pages to DB as channels
  - Clears cache entry
  - Returns `{ count, pages: [{id, name}] }`

### `/packages/api/src/server.ts`
- Added `/channels/facebook/pages` and `/channels/facebook/connect-pages` to `PUBLIC_PREFIXES`

## Frontend Changes

### `/packages/web/app/(dashboard)/settings/page.tsx`
- Added state for Facebook page picker: `fbPages`, `fbPageKey`, `showFbPicker`, `selectedFbPages`
- Added URL detection for `?facebook_pages=<key>` → fetches pages → shows picker modal
- Added `handleConnectFbPages()` → POST to `/channels/facebook/connect-pages`
- Added `toggleFbPage()` for checkbox selection
- Added Facebook page picker modal UI with checkboxes
- Uses inline Facebook SVG icon (not in lucide-react)

## Flow Diagram

```
User clicks "Connect Facebook" in Settings
        ↓
Frontend: api.channels.oauthConnect('facebook') → /api/v1/channels/facebook/connect?brandId=xxx
        ↓
Backend: Returns Facebook OAuth URL
        ↓
User authenticates with Facebook
        ↓
Facebook redirects to /api/v1/channels/facebook/callback?code=...
        ↓
Backend exchanges code for token
        ↓
Backend fetches user's pages via /me/accounts
        ↓
    ┌──────────┴──────────┐
   1 page              2+ pages
    ↓                    ↓
Auto-connect       Store in cache
Redirect:          Redirect:
?connected=fb      ?facebook_pages=<key>
&page=<name>       
    ↓                    ↓
Settings page    Settings page
Success msg      Detects facebook_pages param
                    ↓
              GET /channels/facebook/pages?key=xxx
                    ↓
              Shows picker modal
                    ↓
              User selects pages
                    ↓
              POST /channels/facebook/connect-pages
                    ↓
              Pages connected, modal closes
```

## Testing

### Backend (verified)
```bash
# Health check
curl http://localhost:3002/api/v1/health
# → {"status":"ok"}

# Pages endpoint (no auth required)
curl "http://localhost:3002/api/v1/channels/facebook/pages?key=test"
# → {"error":"Page selection expired or invalid"}

# Connect pages endpoint (no auth required)
curl -X POST "http://localhost:3002/api/v1/channels/facebook/connect-pages" \
  -H "Content-Type: application/json" \
  -d '{"key":"test","page_ids":["123"]}'
# → {"error":"Page selection expired or invalid"}
```

### Frontend Test
1. Go to Settings → Social Accounts
2. Click "Connect" for Facebook (must have 2+ pages on your FB account)
3. Complete Facebook OAuth
4. Should redirect back with `?facebook_pages=<key>`
5. Picker modal should appear with all your pages
6. Select which pages to connect → click "Connect X pages"
7. Success message appears, channels list refreshes

## Production Notes
- Temp cache uses `globalThis.__facebookPageCache` Map (per-process memory)
- Cache entries auto-expire after 10 minutes
- For production with multiple API servers → Replace with Redis
- No JWT required for picker endpoints (user just finished OAuth)

## Files Modified
- `packages/api/src/routes/callbacks.ts`
- `packages/api/src/server.ts`
- `packages/web/app/(dashboard)/settings/page.tsx`

## Build Status
- ✅ API compiles (npx tsc --noEmit)
- ✅ Web compiles (npx tsc --noEmit)
- ✅ API server running on port 3002
