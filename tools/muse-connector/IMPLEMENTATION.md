# Meta Muse Integration for AgentSocial Salons

## Overview
This integration connects Meta Muse AI agent to AgentSocial salon systems, enabling Muse to:
- Browse salon services and pricing
- Check appointment availability
- Book appointments for customers
- Answer common questions

## How It Works

### Method 1: WhatsApp Business API (Recommended)
Meta Muse can interact with businesses via WhatsApp Business API:
1. Customer asks Muse to book a salon appointment
2. Muse sends WhatsApp message to salon's business number
3. AgentSocial webhook processes the message
4. Booking is confirmed via API

### Method 2: Facebook Messenger
Similar flow via Facebook Messenger platform.

### Method 3: Browser Automation (Fallback)
Muse visits salon website directly and fills out booking forms.

## Implementation

### Step 1: Configure WhatsApp Business API

```bash
# Set environment variables
export WHATSAPP_BUSINESS_ACCOUNT_ID="your-account-id"
export WHATSAPP_PHONE_NUMBER_ID="your-phone-number-id"
export WHATSAPP_ACCESS_TOKEN="your-access-token"
export WHATSAPP_WEBHOOK_SECRET="your-webhook-secret"
```

### Step 2: Webhook Handler

```typescript
// packages/api/src/routes/whatsapp-webhook.ts
import { FastifyInstance } from "fastify";

export async function whatsappWebhookRoutes(server: FastifyInstance) {
  // Handle incoming messages from Meta Muse via WhatsApp
  server.post("/webhook/whatsapp", async (request, reply) => {
    const { entry } = request.body as any;
    
    for (const message of entry?.[0]?.changes?.[0]?.value?.messages || []) {
      const from = message.from; // Customer phone
      const text = message.text?.body;
      
      // Process Muse booking request
      if (text.includes("book") || text.includes("appointment")) {
        // Handle booking logic
        await handleMuseBookingRequest(from, text);
      }
    }
    
    return { status: "received" };
  });
}
```

### Step 3: Muse Connector Registration

```typescript
import { registerMuseConnector } from "../connectors/muse";

await registerMuseConnector({
  businessName: "PLEIJ Salon",
  website: "https://pleijsalon.com",
  industry: "hair salon",
  connectorType: "messaging",
  capabilities: ["booking", "inquiries"],
  messagingChannels: ["whatsapp", "messenger"],
});
```

## Configuration for Each Salon

### PLEIJ Salon
- WhatsApp: +1-614-665-1751
- Facebook: @pleijsalon
- Website: https://pleijsalon.com/booking

### Che Lace
- WhatsApp: TBD
- Facebook: TBD
- Website: TBD

### WigViz
- WhatsApp: TBD
- Facebook: TBD
- Website: TBD

## API Endpoints

### GET /muse/salon/:id/services
Returns available services for Muse to browse.

### POST /muse/salon/:id/booking
Creates a booking from Muse request.

### GET /muse/salon/:id/availability
Returns available time slots.

## Environment Variables

```bash
# Meta Muse Integration
META_MUSE_ENABLED=true
META_MUSE_CONNECTOR_TYPE=messaging
META_MUSE_WEBHOOK_URL=https://api.agentsocial.com/webhook/muse
META_MUSE_VERIFY_TOKEN=your-verify-token

# WhatsApp Business API
WHATSAPP_API_VERSION=v18.0
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_WEBHOOK_SECRET=

# Facebook Messenger
FACEBOOK_PAGE_ACCESS_TOKEN=
FACEBOOK_PAGE_ID=
FACEBOOK_APP_SECRET=
```

## Setup Checklist

- [ ] Create Meta Business account for each salon
- [ ] Enable WhatsApp Business API
- [ ] Configure webhook endpoints
- [ ] Register Muse connectors
- [ ] Test booking flow end-to-end
- [ ] Monitor and optimize

## Next Steps

1. Get WhatsApp Business API credentials from Meta
2. Deploy webhook handlers
3. Register connectors with Muse platform
4. Test with actual Muse interactions
