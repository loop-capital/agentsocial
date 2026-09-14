# Facebook OAuth - Status for Claude

## Problem
Facebook OAuth flow fails at the callback stage. User clicks "+ Connect", gets redirected to Facebook, approves permissions, then redirect back fails with `?error=facebook_failed`.

## Root Cause
`exchangeFacebookCode()` throws `TypeError [ERR_INVALID_ARG_TYPE]: The "data" argument must be of type string or an instance of Buffer, TypedArray, or DataView. Received undefined`

This means `data.access_token` from Facebook API response is `undefined`.

## What's Been Done
1. ✅ Fixed callback route path from `/channels/callback/facebook` to `/channels/facebook/callback`
2. ✅ Made callback public via `PUBLIC_PREFIXES`
3. ✅ Fixed CORS to allow localhost:3005
4. ✅ Added console.log to see Facebook API response (in facebook.ts line ~88)
5. ✅ Facebook `comingSoon: false` in settings page
6. ✅ Cloudflare tunnel running for `api.getagentsocial.com`

## Files That Matter
- `/packages/api/src/connectors/facebook.ts` - Token exchange functions
- `/packages/api/src/routes/callbacks.ts` - Facebook callback handler
- `/packages/api/src/server.ts` - PUBLIC_PREFIXES includes `/channels/facebook/callback`
- `/packages/web/app/(dashboard)/settings/page.tsx` - Frontend connect button

## Current Error (from logs)
```
[oauth/facebook] Callback error: TypeError [ERR_INVALID_ARG_TYPE]: The "data" argument must be of type string or an instance of Buffer, TypedArray, or DataView. Received undefined
```

## Suspected Issue
The `exchangeFacebookCode()` function may be:
1. Not receiving the `code` parameter correctly
2. Facebook returning an error response that's not being caught
3. The response format being different than expected

## Environment
- API: localhost:3002
- Web: localhost:3005
- Tunnel: https://api.getagentsocial.com
- Facebook App ID: 1351242593731927
- Scopes: `pages_show_list,pages_read_engagement`

## Next Steps for Claude
1. Check actual Facebook API response by looking at console.log output in `/tmp/api-server.log`
2. Add proper error handling to show what Facebook returns
3. Fix token exchange to handle edge cases
4. Test end-to-end

## Server Commands
```bash
# Start API
cd /home/jason/.openclaw/workspaces/agentsocial/packages/api && nohup node dist/server.js > /tmp/api-server.log 2>&1 &

# Start Web
cd /home/jason/.openclaw/workspaces/agentsocial/packages/web && nohup npx next dev -p 3005 > /tmp/web-server.log 2>&1 &

# Start Tunnel
cloudflared tunnel --config /home/jason/.cloudflared/agentsocial-api.yml run agentsocial-api
```

## Login Credentials
- Email: jason@agentsocial.com
- Password: password123

## Brand ID for Testing
303d0af8-9b2e-491e-9cf9-72ad318e23e4

## API Key for Testing (if needed)
as_dev_c_kz897lTf1W17pKJenLYUY-
