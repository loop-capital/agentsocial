# Adobe Developer Account Setup Guide

## Step 1: Create Adobe Account
1. Go to https://developer.adobe.com/console/home
2. Sign in with your Adobe ID (or create one)
3. Accept developer terms of service

## Step 2: Create New Project
1. Click **"Create new project"** (Quick start section)
2. Select **"Add API"**
3. Choose **Firefly** from the list
4. Select **"Server-to-Server"** authentication
5. Name your project: `AgentSocial-Firefly`

## Step 3: Get Credentials
After creating the project, you'll get:
- **Client ID** (like: `a1b2c3d4e5f678901234`)
- **Client Secret** (keep this secret!)

Save these in your `.env` file:
```
ADOBE_CLIENT_ID=your_client_id
ADOBE_CLIENT_SECRET=your_client_secret
```

## Step 4: Add Stock API
1. In the same project, click **"Add API"** again
2. Select **Adobe Stock** from the list
3. Use the same Server-to-Server auth

## Step 5: Test the Connection
Run this curl command to verify:
```bash
curl -X POST 'https://ims-na1.adobelogin.com/ims/token/v3' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=client_credentials' \
  --data-urlencode "client_id=$ADOBE_CLIENT_ID" \
  --data-urlencode "client_secret=$ADOBE_CLIENT_SECRET" \
  --data-urlencode 'scope=openid,AdobeID,firefly_api,ff_apis'
```

You should get a JSON response with an `access_token`.

## Step 6: Enter Credentials in AgentSocial
1. Go to `/dashboard/creative-studio`
2. Click **"Configure Adobe"**
3. Enter your Client ID and Client Secret
4. Click **"Save & Connect"**

## Pricing
- **Firefly**: Free tier = 25 generations/month
- **Stock Search**: Free (unlimited)
- **Stock Licenses**: $9.99-$79.99 per asset
- **API Calls**: $0.05-$0.20 per generation

## Next Steps
Once you have credentials:
1. Add them to the backend `.env`
2. Test image generation
3. Test stock search
4. Start generating revenue!

## Support
- Adobe Developer Support: https://developer.adobe.com/support
- Firefly API Docs: https://developer.adobe.com/firefly-services/docs/
