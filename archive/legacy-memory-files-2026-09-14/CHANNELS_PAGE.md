# Channels Page - Multi-Account Management

## Features Added

### 1. Connect All via Meta
- **Button**: "Connect All via Meta" (blue Facebook + Instagram icons)
- **Function**: When clicked, initiates Facebook OAuth with extended scopes:
  - `pages_manage_posts`
  - `pages_read_engagement`
  - `pages_show_list`
  - `instagram_basic`
  - `instagram_content_publish`
- **Result**: User authenticates once, gets both Facebook pages AND Instagram business accounts linked to those pages

### 2. Active Account Selection
- Each connected account has a "Set Active" / "Active" toggle button
- Only one account can be active at a time per platform
- Active state stored in `localStorage` for persistence across sessions
- Active account highlighted with green badge

### 3. Brand Display
- Each account shows which brand it belongs to (e.g., "Improvio", "OttoCase")
- Brand selector at top: "All Brands" or specific brand
- Filtering shows only accounts for selected brand

### 4. Account Management
- **Connect**: Per-platform "Add Account" button
- **Disconnect**: Trash icon removes account
- **Status**: Shows Active/Inactive with follower count

## UI Layout

```
┌─────────────────────────────────────────┐
│ Connected Accounts                      │
│ Manage all your social media accounts   │
├─────────────────────────────────────────┤
│ Brand: [All Brands] [Improvio] [Otto] │
│                    [Connect All via Meta]│
├─────────────────────────────────────────┤
│ Facebook                              + │
│   2 accounts connected                  │
│   ┌─────────────────────────────────┐   │
│   │ [FB] Improvio Page      [Active] │
│   │      Active · 1,234 followers     │
│   │      Brand: Improvio     [Trash]   │
│   ├─────────────────────────────────┤   │
│   │ [FB] OttoCase Page   [Set Active] │
│   │      Active · 567 followers       │
│   │      Brand: OttoCase   [Trash]   │
│   └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│ Instagram                             + │
│   1 account connected                   │
│   ┌─────────────────────────────────┐   │
│   │ [IG] @improvio          [Active] │
│   │      Active · 890 followers       │
│   │      Brand: Improvio     [Trash]   │
│   └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## Meta OAuth Flow

When "Connect All via Meta" is clicked:

1. Initiates Facebook OAuth with extended Instagram scopes
2. User authenticates with Facebook
3. Backend fetches:
   - Facebook pages via `/me/accounts`
   - Instagram business accounts linked to each page
4. If picker enabled (multiple pages):
   - Shows page picker for Facebook
   - Also shows linked Instagram accounts
5. User selects which Facebook pages + Instagram accounts to connect
6. Backend creates channels for both platforms

## Files Modified
- `packages/web/app/(dashboard)/channels/page.tsx` - New channels management page
- `packages/web/app/(dashboard)/layout.tsx` - Added Channels to sidebar
- `packages/api/src/routes/callbacks.ts` - Extended scopes for Meta

## API Endpoints Used
- `GET /api/v1/brands` - List brands with channels
- `GET /api/v1/channels/:platform/auth?brand_id=xxx` - OAuth URL
- `DELETE /api/v1/channels/:id/disconnect` - Disconnect account

## Data Storage
- Active channel ID stored in `localStorage` as `active_channel_id`
- Channels table links accounts to brands
