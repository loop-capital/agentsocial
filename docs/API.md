# AgentSocial API Documentation

## Base URL

All API routes are prefixed with `/v1`.

Example: `http://localhost:3001/v1/websites`

---

## SiteFlow (Websites)

### List Templates

**GET** `/v1/templates`

Returns all active templates.

**Query Parameters:**
- `category` (optional): Filter by category (`landing`, `linkinbio`, `campaign`, `portfolio`)

**Response:**
```json
{
  "templates": [
    {
      "id": "uuid",
      "name": "Landing Page",
      "slug": "landing-page",
      "description": "A high-converting landing page...",
      "category": "landing",
      "preview_image": "/templates/landing-preview.jpg",
      "component_path": "templates/landing/LandingPageTemplate",
      "default_config": { ... },
      "tags": ["saas", "product", "conversion"],
      "is_active": true,
      "sort_order": 1
    }
  ]
}
```

---

### List Websites

**GET** `/v1/websites?brandId={brandId}`

Returns all websites scoped to a brand.

**Query Parameters:**
- `brandId` (required): Brand UUID

**Response:**
```json
{
  "websites": [
    {
      "id": "uuid",
      "brand_id": "uuid",
      "template_id": "uuid",
      "name": "My Site",
      "config": { ... },
      "status": "draft",
      "url": null,
      "custom_domain": null,
      "template_name": "Landing Page",
      "template_slug": "landing-page",
      "template_category": "landing"
    }
  ]
}
```

---

### Get Website

**GET** `/v1/websites/:id?brandId={brandId}`

Returns a single website with template details.

**Response:**
```json
{
  "website": {
    "id": "uuid",
    "brand_id": "uuid",
    "template_id": "uuid",
    "name": "My Site",
    "config": { ... },
    "status": "published",
    "url": "https://my-site-abc123.vercel.app",
    "component_path": "templates/landing/LandingPageTemplate",
    "template_name": "Landing Page",
    "template_default_config": { ... }
  }
}
```

---

### Create Website

**POST** `/v1/websites`

Creates a new website from a template.

**Request Body:**
```json
{
  "brandId": "uuid",
  "templateId": "uuid",
  "name": "My Awesome Site",
  "config": {}
}
```

**Response:** `201 Created`
```json
{
  "website": { ... }
}
```

---

### Update Website

**PUT** `/v1/websites/:id?brandId={brandId}`

Updates website config, status, name, or custom domain.

**Request Body:**
```json
{
  "brandId": "uuid",
  "config": { "brandName": "Updated Name", "colors": { "primary": "#FF0000" } },
  "status": "draft",
  "customDomain": "example.com",
  "name": "Updated Site Name"
}
```

**Response:**
```json
{
  "website": { ... }
}
```

---

### Delete Website

**DELETE** `/v1/websites/:id?brandId={brandId}`

Deletes a website. Returns `204 No Content` on success.

---

### Deploy Website

**POST** `/v1/websites/:id/deploy?brandId={brandId}`

Triggers a Vercel deployment. Returns deployment details.

**Response:**
```json
{
  "deploymentId": "dep_1234567890",
  "status": "published",
  "url": "https://my-site-abc123.vercel.app",
  "message": "Website deployed successfully"
}
```

---

### Export Website

**POST** `/v1/websites/:id/export?brandId={brandId}`

Initiates a static ZIP export. Returns a download URL.

**Response:**
```json
{
  "message": "Export initiated...",
  "downloadUrl": "/api/v1/websites/:id/export/download",
  "websiteId": "uuid"
}
```

---

## Templates

| Slug | Category | Description |
|---|---|---|
| `landing-page` | landing | Hero + features + CTA + footer |
| `link-in-bio` | linkinbio | Social links + bio + content grid |
| `campaign-microsite` | campaign | Countdown + signup + social proof |
| `portfolio-showcase` | portfolio | Gallery + about + contact |

---

## Environment Variables

Add to `.env`:

```bash
# Backend
VERCEL_TOKEN=your_vercel_token
VERCEL_TEAM_ID=your_vercel_team_id

# Postiz Self-Hosted
POSTIZ_BASE_URL=http://localhost:4007/api
POSTIZ_API_KEY=your_postiz_api_key_here

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001/v1
```

---

## Postiz Social Media Integration

All social endpoints are prefixed with `/v1/social` and proxy to the self-hosted Postiz instance at `POSTIZ_BASE_URL`.

**Authentication:** Postiz API key via `Authorization` header (set in `POSTIZ_API_KEY`). Obtain one from Postiz UI: **Settings > Developers > Public API**.

**Error Handling:** If Postiz is unreachable, endpoints return `502 Bad Gateway` with the Postiz error message. AgentSocial never crashes when Postiz is down.

**Brand Scoping:** All queries are scoped to `brand_id` to prevent cross-brand data leakage.

---

### List Available Platforms

**GET** `/v1/social/platforms`

Returns all integrations available in Postiz (connected social accounts).

**Response:**
```json
{
  "platforms": [
    {
      "id": "cm4ean69r0003w8w1cdomox9n",
      "name": "Nevo David",
      "identifier": "x",
      "picture": "https://uploads.postiz.com/avatar.jpg",
      "disabled": false,
      "profile": "nevodavid"
    }
  ]
}
```

---

### List Connected Accounts

**GET** `/v1/social/accounts?brandId={brandId}`

Returns AgentSocial-managed social accounts scoped to a brand.

**Query Parameters:**
- `brandId` (required): Brand UUID

**Response:**
```json
{
  "accounts": [
    {
      "id": "uuid",
      "brand_id": "uuid",
      "platform": "facebook",
      "postiz_account_id": "cm4ean69r0003w8w1cdomox9n",
      "name": "My Page",
      "picture": "https://...",
      "profile": "mypage",
      "status": "active",
      "connected_at": "2026-04-25T10:00:00Z"
    }
  ]
}
```

---

### Connect Account

**POST** `/v1/social/accounts?brandId={brandId}`

Links a Postiz integration into AgentSocial for a brand.

**Request Body:**
```json
{
  "brandId": "uuid",
  "platform": "facebook",
  "postizAccountId": "cm4ean69r0003w8w1cdomox9n",
  "name": "My Page",
  "picture": "https://...",
  "profile": "mypage"
}
```

**Response:** `201 Created`
```json
{
  "account": { ... }
}
```

---

### Disconnect Account

**DELETE** `/v1/social/accounts/:id?brandId={brandId}`

Removes a linked account from AgentSocial (does NOT delete the Postiz integration).

**Response:** `204 No Content`

---

### List Posts

**GET** `/v1/social/posts?brandId={brandId}&status={status}&startDate={iso}&endDate={iso}&limit={n}`

Returns scheduled/published posts scoped to a brand.

**Query Parameters:**
- `brandId` (required)
- `status` (optional): `pending`, `scheduled`, `published`, `draft`, `error`
- `startDate`, `endDate` (optional): ISO 8601 UTC
- `limit` (optional): default `50`

**Response:**
```json
{
  "posts": [
    {
      "id": "uuid",
      "brand_id": "uuid",
      "postiz_post_id": "postiz-id",
      "content": "Hello world!",
      "platforms": [{ "platform": "facebook" }],
      "scheduled_at": "2026-04-26T10:00:00Z",
      "status": "scheduled",
      "created_at": "2026-04-25T10:00:00Z"
    }
  ]
}
```

---

### Get Post

**GET** `/v1/social/posts/:id?brandId={brandId}`

Returns a single post.

**Response:**
```json
{
  "post": { ... }
}
```

---

### Schedule Post

**POST** `/v1/social/posts?brandId={brandId}`

Creates a post in Postiz and stores a reference in AgentSocial.

**Request Body:**
```json
{
  "brandId": "uuid",
  "content": "Hello world!",
  "platforms": [
    {
      "integrationId": "cm4ean69r0003w8w1cdomox9n",
      "settings": {
        "__type": "facebook"
      }
    }
  ],
  "scheduledAt": "2026-04-26T10:00:00Z",
  "mediaUrls": ["https://example.com/image.jpg"]
}
```

**Response:** `201 Created`
```json
{
  "post": { ... }
}
```

---

### Update Post

**PUT** `/v1/social/posts/:id?brandId={brandId}`

Updates local post record (content, schedule, status).

**Request Body:**
```json
{
  "brandId": "uuid",
  "content": "Updated text",
  "scheduledAt": "2026-04-27T10:00:00Z",
  "status": "scheduled"
}
```

**Response:**
```json
{
  "post": { ... }
}
```

---

### Delete Post

**DELETE** `/v1/social/posts/:id?brandId={brandId}`

Deletes the post in Postiz (and removes the local reference).

**Response:** `204 No Content`

---

### Analytics Summary

**GET** `/v1/social/analytics?brandId={brandId}&integrationId={id}`

Returns analytics for all active accounts (or a specific integration).

**Response:**
```json
{
  "analytics": [
    {
      "integrationId": "cm4ean...",
      "platform": "facebook",
      "data": { ... },
      "error": null
    }
  ]
}
```

---

## Authentication & Scoping

Every endpoint requires `brandId` as a query parameter. All database queries are scoped to `brand_id` to prevent cross-brand data leakage.
