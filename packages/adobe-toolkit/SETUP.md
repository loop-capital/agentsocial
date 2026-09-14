# Adobe Creative Toolkit — Setup Guide

## What This Package Does

`@agentsocial/adobe-toolkit` provides typed TypeScript clients for:

1. **Firefly API v3** — AI image generation (text-to-image, generative fill, expand/outpaint, similar images, object composite)
2. **Adobe Stock API** — Search, browse, license, and download stock assets

All endpoints are validated against Adobe's official documentation (May 2026).

---

## How to Get Your Adobe API Credentials

### Step 1: Get an Adobe Enterprise Account

Adobe Firefly Services API requires an **Adobe Enterprise or Teams account** with Firefly Services entitlement.

- If you're an individual: you need to sign up for an Adobe Creative Cloud Enterprise plan, or use an organization that has one
- Adobe offers **free trials** of Firefly Services for developers at https://developer.adobe.com

### Step 2: Create a Project in Adobe Developer Console

1. Go to **https://developer.adobe.com/console**
2. Sign in with your Adobe ID
3. Click **"Create new project"** → **"Add API"**
4. Select **"Firefly – Firefly Services"** and click Next
5. Choose authentication type: **"OAuth Server-to-Server"** (this is the default and correct choice)
6. Give your credential a name (e.g., "AgentSocial Production")
7. Select product profiles (choose the ones appropriate for your org)
8. Click **"Save Configured API"**

### Step 3: Get Your Client ID and Client Secret

On the project page you just created:

1. You'll see your **Client ID** (also called "API Key") — copy this
2. Click **"OAuth Server-to-Server"** in the left nav
3. Click **"Retrieve client secret"** — copy this too

These two values are what you need:
- `FIREFLY_SERVICES_CLIENT_ID` = your Client ID
- `FIREFLY_SERVICES_CLIENT_SECRET` = your Client Secret

### Step 4: Add More APIs (Optional but Recommended)

While you're in the Developer Console, you can add more APIs to the same project:

- **Photoshop – Firefly Services** (for PSD operations)
- **Lightroom – Firefly Services** (for photo editing)
- **Content Tagging – Firefly Services** (for auto-tagging)
- **Adobe Stock** (for stock search & licensing)

Each uses the same Client ID/Secret for auth.

### Step 5: For Adobe Stock Licensing (Optional)

If you want to **license and download** stock assets (not just search):

1. You need an Adobe Stock enterprise subscription
2. The same `FIREFLY_SERVICES_CLIENT_ID` works as the Stock API key
3. You need a user access token for licensing operations — the OAuth Server-to-Server flow covers search; licensing requires user context

---

## Environment Variables

Add these to your `.env` file:

```bash
# Adobe Firefly Services (required for image generation)
FIREFLY_SERVICES_CLIENT_ID=your_client_id_here
FIREFLY_SERVICES_CLIENT_SECRET=your_client_secret_here

# Adobe Stock (optional — uses same Client ID for search)
ADOBE_STOCK_API_KEY=your_client_id_here
ADOBE_STOCK_ACCESS_TOKEN=optional_bearer_token_for_licensing
```

---

## Quick Test

Once you have credentials, test the auth flow:

```bash
# Replace with your actual values
export FIREFLY_SERVICES_CLIENT_ID="your_client_id"
export FIREFLY_SERVICES_CLIENT_SECRET="your_client_secret"

# Get an access token
curl --location 'https://ims-na1.adobelogin.com/ims/token/v3' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=client_credentials' \
  --data-urlencode "client_id=$FIREFLY_SERVICES_CLIENT_ID" \
  --data-urlencode "client_secret=$FIREFLY_SERVICES_CLIENT_SECRET" \
  --data-urlencode 'scope=openid,AdobeID,session,additional_info,read_organizations,firefly_api,ff_apis'

# If successful, you'll get:
# {"access_token":"...","token_type":"bearer","expires_in":86399}
```

Then generate an image:

```bash
export FIREFLY_SERVICES_ACCESS_TOKEN="the_token_from_above"

curl --location 'https://firefly-api.adobe.io/v3/images/generate-async' \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header "x-api-key: $FIREFLY_SERVICES_CLIENT_ID" \
  --header "Authorization: Bearer $FIREFLY_SERVICES_ACCESS_TOKEN" \
  --data '{"prompt":"a cat coding on a laptop"}'
```

---

## Usage in Code

```typescript
import { FireflyClient, StockClient, createClientsFromEnv } from '@agentsocial/adobe-toolkit';

// Quick setup from env vars
const { firefly, stock } = createClientsFromEnv();

// Generate an image (async — polls until complete)
const result = await firefly.generateImage({
  prompt: 'a futuristic cityscape at sunset',
  contentClass: 'photo',
});

console.log('Generated:', result.outputs[0].image.url);

// Search Adobe Stock
const stockResults = await stock.search({
  query: 'technology workspace',
  limit: 10,
  filters: { orientation: 'horizontal', content_type: ['photo'] },
});

console.log(`Found ${stockResults.nb_results} results`);
```

---

## API Reference (What Changed From The Original Code)

### Firefly Client — Fixed Issues

| Issue | Original | Fixed |
|-------|----------|-------|
| Auth scopes | `firefly_api,firefly_storage` | `openid,AdobeID,session,additional_info,read_organizations,firefly_api,ff_apis` |
| Generate endpoint | `/v3/images/generate` (sync only) | `/v3/images/generate-async` (async preferred) |
| Auth headers | `Authorization: Bearer` + `x-api-key` | ✅ Same — but now includes `Accept: application/json` |
| Image upload | Missing entirely | Added `uploadImage()` for fill/expand/composite |
| Async polling | Missing entirely | Added `pollJob()` with timeout + interval |
| Fill endpoint | `/v3/images/generative-fill` | `/v3/images/fill-async` (async) |
| Expand endpoint | `/v3/images/expand` | `/v3/images/expand-async` (async) |
| Variations endpoint | `/v3/images/{id}/variations` | `/v3/images/generate-similar-async` (different pattern) |
| Get styles | `/v3/styles` | Removed — not in current API |
| Response format | Custom `images[].id/url/size` | Matches actual: `outputs[].seed/image.url/size` |

### Stock Client — Fixed Issues

| Issue | Original | Fixed |
|-------|----------|-------|
| Base URL | `https://stock.adobe.io/Rest/Media/1` | ✅ Correct |
| Search params | Custom encoding | Matches Adobe's `search_parameters[words]` format |
| License endpoint | `/Member/License` | `/Libraries/1/Content/License` |
| Download | `/Member/Download` | `/Libraries/1/Download` |
| Member profile | Missing | Added `getMemberProfile()` and `getLicenseStatus()` |
| Category tree | Missing | Added `getCategoryTree()` |

---

## Pricing Note

- **Firefly API**: Priced per generation. Check current pricing at https://developer.adobe.com/firefly-services
- **Adobe Stock**: Licensing is per-asset and requires a Stock subscription
- Free tier / trial credits may be available for new developers