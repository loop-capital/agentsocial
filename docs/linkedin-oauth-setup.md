# LinkedIn OAuth 2.0 Setup Guide

Last updated: 2026-05-09

## 1. Creating a LinkedIn Developer App (Step-by-Step)

1. Go to https://www.linkedin.com/developers/ and sign in with your LinkedIn account.
2. Click **Create app** or go directly to https://www.linkedin.com/developer/apps/new.
3. Fill out the app creation form:
   - **App name**: Your application name (shown to users during consent).
   - **LinkedIn Page**: Link your app to a LinkedIn Company Page (required for some products).
   - **Privacy policy URL**: A publicly accessible URL to your privacy policy.
   - **App logo**: Upload a logo (displayed on the OAuth consent screen).
4. Accept the API Terms of Use and click **Create app**.
5. Once created, navigate to the **Auth** tab to view:
   - **Client ID** (API Key)
   - **Client Secret**
   - **OAuth 2.0 settings**
6. Add at least one **Redirect URL** under the Auth tab. Use absolute HTTPS URLs:
   - Valid: `https://dev.example.com/auth/linkedin/callback`
   - Invalid: `/auth/linkedin/callback` (relative paths are not allowed)
   - Invalid: `https://dev.example.com/auth/linkedin/callback#linkedin` (fragments `#` are not allowed)
   - Parameters are ignored: `https://dev.example.com/auth/linkedin/callback?id=1` is treated as `https://dev.example.com/auth/linkedin/callback`

## 2. OAuth 2.0 Flow to Use

LinkedIn uses the **standard Authorization Code Flow** (3-legged OAuth). As of the latest docs (2025-11-10):

- PKCE is **not explicitly required** by LinkedIn for web server apps, but **it is supported** and recommended for public clients (SPAs, mobile apps).
- The current codebase already supports PKCE optionally (`code_challenge` / `code_verifier` parameters are passed if provided).
- For a backend server app, the standard Authorization Code Flow with `client_secret` is sufficient. For SPAs or mobile apps, use PKCE.

### Flow Steps
1. Redirect user to `https://www.linkedin.com/oauth/v2/authorization` with `response_type=code`.
2. User authenticates and consents on LinkedIn.
3. LinkedIn redirects back to your `redirect_uri` with an authorization `code` (expires in **30 minutes**).
4. Exchange the code for tokens by POSTing to `https://www.linkedin.com/oauth/v2/accessToken`.
5. Use the returned `access_token` to call LinkedIn APIs.

## 3. Required Scopes

LinkedIn scopes are **product-gated**: your app must be approved for a product in the Developer Portal before the scopes become available.

### Profile Read
- `r_liteprofile` — Basic profile info (id, first name, last name, profile picture).
- `r_basicprofile` — Extended profile info (headline, positions, etc.). Requires product approval.

### Posting Content
- `w_member_social` — Post, comment, and share as the authenticated member.
- `w_organization_social` — Post as an organization (company page). Requires product approval.

### Reading Engagement Metrics
- `r_organization_social` — Read organization posts and engagement metrics. Requires product approval.
- **Note**: There is no standard `r_member_social` read scope for personal post analytics via 3-legged OAuth. Engagement data is typically accessed via the Organization API or specialized partner products.

### Other Common Scopes
- `emailaddress` — Access to the member’s primary email address.
- `openid` — OpenID Connect support (id_token).
- `profile` — OpenID Connect profile claims.

### Important
- Request the **minimum** scopes needed. Users cannot pick individual scopes; they must accept or deny all.
- If you change scopes after users have already consented, they must re-authenticate.

## 4. Token Format

### Access Token
- Returned as `access_token` (string) from the token endpoint.
- **Expiry**: `expires_in` is returned in seconds (typically **60 days** for member access tokens).
- **Format**: Bearer token (opaque string).

### Refresh Token
- Returned as `refresh_token` (string) if the scope supports it.
- **Expiry**: Refresh tokens are typically **long-lived** (e.g., 1 year), but this can vary by product.
- Use `grant_type=refresh_token` to obtain a new access token without user re-authentication.

### Token Refresh Request
```bash
curl --location --request POST 'https://www.linkedin.com/oauth/v2/accessToken' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'grant_type=refresh_token' \
--data-urlencode 'refresh_token={refresh_token}' \
--data-urlencode 'client_id={client_id}' \
--data-urlencode 'client_secret={client_secret}'
```

## 5. Key Differences from Twitter/X and TikTok OAuth

| Feature | LinkedIn | Twitter/X | TikTok |
|---------|----------|-----------|--------|
| **Flow** | Authorization Code (PKCE optional) | Authorization Code with PKCE (required) | Authorization Code with PKCE (required) |
| **Token Expiry** | ~60 days (access), long-lived refresh | ~2 hours (access), refresh available | ~24 hours (access), refresh available |
| **Scopes** | Product-gated; must apply for products | Granular, product-level | Granular, approved per app |
| **API Version** | `v2` (RESTli protocol headers often required) | `v2` | `v2` |
| **Rate Limits** | Product-specific | Product-specific (Basic, Elevated, etc.) | Product-specific |
| **Redirect URI** | HTTPS only, absolute, no fragments | HTTPS only, exact match | HTTPS only, exact match |
| **Approval Process** | Required for most non-basic products | Elevated access requires application | Requires app review for publishing |
| **Member vs Org** | Separate scopes for member (`w_member_social`) and org (`w_organization_social`) posting | Supports user and app context | Supports user and business posting |
| **Login Options** | Supports Google, Apple, passkey login via `enable_extended_login=true` | Standard login only | Standard login only |

## 6. Redirect URI Format

- **Protocol**: Must be `https://` in production.
- **Absolute URL**: Required. Relative paths are rejected.
- **No Fragment**: URLs with `#` are invalid.
- **Query Parameters**: Allowed but ignored by LinkedIn during matching.
- **Examples**:
  - Valid: `https://app.agentsocial.io/api/v1/channels/callback/linkedin`
  - Valid (Postman): `https://oauth.pstmn.io/v1/callback`
  - Invalid: `http://localhost:3001/callback` (unless in development whitelist)
  - Invalid: `https://app.agentsocial.io/callback#step=linkedin`

## 7. Approval / Review Process

### Basic Products (usually auto-approved)
- **Sign In with LinkedIn using OpenID Connect**
- **Share on LinkedIn** (basic member sharing)

### Products Requiring Manual Review
- **Marketing Developer Platform** — required for `w_organization_social`, `r_organization_social`, analytics, advertising APIs.
- **Recruiting System Connect**
- **Talent Solutions**
- **Learning**

### Application Steps
1. In the Developer Portal, go to the **Products** tab of your app.
2. Select the product you want (e.g., "Marketing Developer Platform").
3. Fill out the use-case questionnaire.
4. Submit for review.
5. LinkedIn typically responds within **5–10 business days**.
6. Once approved, the associated scopes become available in the Auth tab.

### Best Practices for Approval
- Provide a detailed, legitimate use case.
- Ensure your privacy policy is publicly accessible and mentions LinkedIn data usage.
- Link your app to an active LinkedIn Company Page.
- Do not request scopes you do not actually need.

---

## Code Review: `packages/api/src/connectors/linkedin.ts`

### What Looks Correct
1. **OAuth endpoints** match the documented URLs (`/oauth/v2/authorization`, `/oauth/v2/accessToken`).
2. **Optional PKCE support** is implemented (`codeChallenge` / `codeVerifier`).
3. **Token refresh** is implemented with `grant_type=refresh_token`.
4. **RESTli protocol version header** (`X-Restli-Protocol-Version: 2.0.0`) is included on API calls.

### Bugs / Issues Found

#### 1. Outdated / Deprecated Scopes in Default Scope List
```typescript
scope: "r_basicprofile r_organization_social w_organization_social r_liteprofile w_member_social"
```
- `r_basicprofile` is deprecated and being replaced by `r_liteprofile` for basic apps. For extended profile data, use OpenID Connect (`openid`, `profile`) or apply for specific products.
- `r_organization_social` and `w_organization_social` require the **Marketing Developer Platform** product approval. If the app doesn’t have this product, the OAuth consent will fail.
- **Recommendation**: Default to the minimum scopes (`r_liteprofile emailaddress` or `openid profile email`) and allow configuration per-deployment. Only include `w_member_social` if the app is approved for it.

#### 2. `publishToLinkedIn` Uses Invalid `author` URN
```typescript
author: `urn:li:person:${accessToken.slice(0, 8)}`,
```
- **Critical bug**: The `author` field is being set to the first 8 characters of the access token. This is completely wrong. It should be the LinkedIn person URN (e.g., `urn:li:person:abc123def`) returned from the `/v2/me` endpoint.
- **Fix**: Call `fetchLinkedInProfile` to get the actual `id` and use `urn:li:person:${profile.id}`.

#### 3. `getLinkedInMetrics` Uses Incorrect Endpoint
```typescript
const response = await fetch(
  `https://api.linkedin.com/v2/networkUpdates/${postId}?count=1`,
  ...
);
```
- The `/v2/networkUpdates` endpoint is deprecated/legacy. For modern analytics, use the **Organization Share Statistics** or **Posts API** (requires Marketing Developer Platform approval).
- The function also returns all zeros even on success, making it a stub.
- **Recommendation**: Implement proper analytics via `https://api.linkedin.com/rest/posts/{postId}` or organization-level insights APIs, gated by product availability.

#### 4. Hardcoded `follower_count` in Profile
```typescript
follower_count: 0, // LinkedIn /v2/me does not return follower count
```
- While the comment is accurate, follower count requires a separate call to the **Network Sizes API** (`/v2/networkSizes/urn:li:person:{id}`) which is not available to all apps.
- **Recommendation**: Leave as-is with a TODO or implement the network sizes call if the app has access.

#### 5. Missing `openid` / OIDC Support
- LinkedIn now recommends OpenID Connect for authentication. The connector does not support requesting `openid` scope or parsing `id_token`.
- **Recommendation**: Add optional OIDC support for modern integrations.

#### 6. Missing `enable_extended_login` Query Parameter
- For apps that want to support Google/Apple/passkey login on mobile/desktop web, the `enable_extended_login=true` parameter should be added to the authorization URL.
- **Recommendation**: Add this as an optional configuration.

### Summary of Required Fixes
| Priority | Issue | Fix |
|----------|-------|-----|
| **Critical** | `author` URN uses access token substring | Use actual profile ID from `/v2/me` |
| **High** | Default scopes may fail for unapproved apps | Make scopes configurable; default to minimum |
| **Medium** | Metrics endpoint is deprecated | Migrate to modern Posts API or remove stub |
| **Low** | Missing OIDC support | Add `openid` scope and `id_token` parsing |
| **Low** | Missing extended login param | Add `enable_extended_login` option |

---

## Quick Reference

### Authorization URL
```
https://www.linkedin.com/oauth/v2/authorization
  ?response_type=code
  &client_id={CLIENT_ID}
  &redirect_uri={REDIRECT_URI}
  &state={STATE}
  &scope=r_liteprofile%20emailaddress%20w_member_social
```

### Token Exchange URL
```
POST https://www.linkedin.com/oauth/v2/accessToken
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code={CODE}
&client_id={CLIENT_ID}
&client_secret={CLIENT_SECRET}
&redirect_uri={REDIRECT_URI}
```

### Token Refresh URL
```
POST https://www.linkedin.com/oauth/v2/accessToken
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token={REFRESH_TOKEN}
&client_id={CLIENT_ID}
&client_secret={CLIENT_SECRET}
```

### Useful Links
- [LinkedIn OAuth Docs](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
- [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
- [LinkedIn Token Generator](https://www.linkedin.com/developers/tools/oauth/token-generator)
