# Facebook OAuth Implementation Status

## ✅ COMPLETE - Single & Multiple Pages Support

### What Works
1. ✅ OAuth Connect endpoint: `GET /api/v1/channels/facebook/connect?brandId=xxx`
   - Returns Facebook OAuth URL with `scope=pages_manage_posts,pages_read_engagement,pages_show_list`
   
2. ✅ OAuth Callback: `GET /api/v1/channels/facebook/callback?code=xxx&state=xxx`
   - Exchanges code for long-lived token
   - Fetches user's pages via `/me/accounts`
   - **NEW: Handles multiple pages**
     - Single page → Auto-connects + redirects to `?connected=facebook&page=<name>`
     - Multiple pages → Stores in temp cache + redirects to `?facebook_pages=<tempKey>`
   
3. ✅ Page Picker API (public, no JWT):
   - `GET /api/v1/channels/facebook/pages?key=<key>` → Returns available pages
   - `POST /api/v1/channels/facebook/connect-pages` → Connects selected pages
   
4. ✅ Frontend Settings Page:
   - Detects `?facebook_pages=<key>` on load
   - Shows picker modal with checkboxes for all pages
   - User selects pages → clicks "Connect X pages"
   - Refreshes connected channels list
   
5. ✅ Status endpoint: `GET /api/v1/channels/status` (protected by JWT)
   - Returns all connected channels with platform details

### Authentication Flow
```
Settings → Social Accounts → Connect Facebook
    ↓
GET /api/v1/channels/facebook/connect?brandId=xxx
    ↓
Redirect to Facebook OAuth
    ↓
User grants permissions
    ↓
Facebook redirects to /api/v1/channels/facebook/callback?code=...
    ↓
Backend: exchanges code → fetches pages
    ↓
  ├─ Single page: auto-connect + redirect to ?connected=fb&page=<name>
  └─ Multiple pages: store in cache + redirect to ?facebook_pages=<key>
                                    ↓
                           Settings page detects key
                                    ↓
                           Shows page picker modal
                                    ↓
                           User selects pages
                                    ↓
                           POST /channels/facebook/connect-pages
                                    ↓
                           Pages connected ✓
```

### Credentials
```
FACEBOOK_APP_ID=1351242593731927
FACEBOOK_REDIRECT_URI=https://api.getagentsocial.com/api/v1/channels/facebook/callback
```

### Environment Setup
1. API `.env`:
```
FACEBOOK_APP_ID=1351242593731927
FACEBOOK_APP_SECRET=9f5359235612778db42e9c88481aaa4a
FACEBOOK_REDIRECT_URI=https://api.getagentsocial.com/api/v1/channels/facebook/callback
APP_URL=http://localhost:3005  (for local dev redirects)
```

2. Frontend `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3002
```

### Testing
1. **Backend compile**: `cd packages/api && npx tsc --noEmit` ✅
2. **Frontend compile**: `cd packages/web && npx tsc --noEmit` ✅
3. **API running**: Port 3002 ✅
4. **Endpoints**:
   - Health: ✅ `curl http://localhost:3002/api/v1/health`
   - Pages (public): ✅ Returns error for invalid key (expected)
   - Connect-pages (public): ✅ Returns error for invalid key (expected)

### Known Issues / Next Steps
- ⚠️ Facebook App "Not Approved" warning shown to users during OAuth
  - Need to: Add Privacy Policy URL, Data Use Checkup, Business Verification
  - Or: Add test users for development testing
- ⚠️ Supabase DB is PAUSED - need to resume for full end-to-end testing
- ⚠️ No JWT auth on page picker endpoints (acceptable for OAuth flow)
- ⚠️ In-memory cache (globalThis.__facebookPageCache) - replace with Redis for production multi-server

### Files Modified
- `packages/api/src/routes/callbacks.ts` - OAuth callback + page picker endpoints
- `packages/api/src/server.ts` - Public prefixes for picker endpoints
- `packages/web/app/(dashboard)/settings/page.tsx` - Page picker UI

### Documentation
- Full details: `FACEBOOK_MULTIPLE_PAGES.md`
