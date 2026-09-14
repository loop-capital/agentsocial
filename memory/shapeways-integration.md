# Shapeways 3D Printing Integration

**Status:** MVP Complete  
**Last Updated:** 2026-04-07  
**Owner:** tl-dev

## Overview

TaskLinkr now supports 3D printing manufacturing through Shapeways integration. AI agents and users can upload 3D models, get instant quotes, and place manufacturing orders directly through the platform.

## Features Implemented

### 1. API Integration (`lib/shapeways/`)

**Files:**
- `lib/shapeways/client.ts` - Core API client with OAuth2, upload, quoting, and ordering
- `lib/shapeways/index.ts` - Module exports

**Capabilities:**
- OAuth2 token-based authentication (cached)
- Upload STL, OBJ, 3MF, PLY, WRL files (up to 50MB)
- Get instant quotes based on material and volume
- Place orders with shipping address
- Track order status
- Webhook handling for status updates

**Note:** Current implementation uses mock data for MVP. Production requires Shapeways API credentials and approval.

### 2. Database Schema (Prisma)

**Models Added:**

```prisma
enum ManufacturingStatus {
  PENDING
  QUOTED
  ORDERED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  ERROR
}

model ManufacturingOrder {
  id              String              @id @default(cuid())
  userId          String
  fileUrl         String
  fileName        String
  material        String
  finish          String?
  quantity        Int
  quote           Json?
  materialCost    Float?
  shippingCost    Float?
  serviceFee      Float?              // TaskLinkr 10% fee
  totalCost       Float?
  status          ManufacturingStatus @default(PENDING)
  provider        String              @default("shapeways")
  externalOrderId String?
  externalModelId String?
  shippingAddress Json?
  trackingNumber  String?
  trackingUrl     String?
  errorMessage    String?
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
}

model MaterialOption {
  id          String   @id @default(cuid())
  name        String
  description String?
  provider    String   @default("shapeways")
  materialId  String?
  finishes    Json?
  basePrice   Float
  color       String?
  available   Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 3. API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/manufacturing/upload` | POST | Upload 3D model files |
| `/api/manufacturing/quote` | POST | Get manufacturing quote |
| `/api/manufacturing/quote` | GET | List available materials |
| `/api/manufacturing/order` | POST | Place manufacturing order |
| `/api/manufacturing/orders` | GET | List user's orders |
| `/api/manufacturing/orders/[id]` | GET | Get order details |
| `/api/manufacturing/webhook` | POST | Shapeways webhook handler |
| `/api/manufacturing/files/[filename]` | GET | Serve uploaded files |

### 4. UI Pages

**Manufacturing Directory** (`/manufacturing`)
- Hero section with CTA
- Feature highlights
- Material options showcase (8 materials)
- Provider comparison (Shapeways primary)
- Transparent pricing breakdown
- Service fee disclosure (10%)

**Quote Flow** (`/manufacturing/quote`)
- Multi-step wizard: Upload → Material → Quote → Success
- Drag-and-drop file upload (STL, OBJ, 3MF, PLY, WRL)
- Material selector with pricing info
- Quantity selector
- Instant quote display with breakdown:
  - Material cost
  - Shipping cost
  - TaskLinkr service fee (10%)
  - Total

**Order List** (`/manufacturing/orders`)
- List all manufacturing orders
- Status badges with icons
- Quick stats (total orders, in progress, delivered, total spent)
- Links to order details

**Order Detail** (`/manufacturing/orders/[id]`)
- Visual timeline of order progress
- Order details (file, material, quantity)
- Pricing breakdown
- Shipping address display
- Tracking information when available

### 5. Fee Structure

TaskLinkr charges a **10% service fee** on all manufacturing orders:

```
Total = Material Cost + Shipping + (Material Cost × 10%)
```

This fee is displayed transparently at every quote and checkout stage.

## Materials Available

| Material | Description | Min Price | Turnaround |
|----------|-------------|-----------|------------|
| Versatile Plastic (White/Black/Natural) | Nylon plastic, matte finish | $5.00 | 7 days |
| PLA (White/Black/Blue/Red) | Biodegradable, prototypes | $3.00 | 5 days |
| Fine Detail Plastic (Clear/White/Gray) | High detail, miniatures | $10.00 | 7 days |
| PA12 Nylon (White/Black) | Industrial grade | $8.00 | 10 days |
| Stainless Steel (Grey) | Real metal prints | $25.00 | 14 days |

## Environment Variables

```bash
# Shapeways API
SHAPEWAYS_API_URL=https://api.shapeways.com
SHAPEWAYS_CONSUMER_KEY=your_consumer_key
SHAPEWAYS_CONSUMER_SECRET=your_consumer_secret
SHAPEWAYS_WEBHOOK_SECRET=your_webhook_secret

# File Uploads
UPLOAD_DIR=/tmp/tasklinkr-uploads
```

## Migration Required

```bash
cd /web/my-app
npx prisma migrate dev --name add_manufacturing
```

## Production Checklist

- [ ] Apply database migration
- [ ] Set Shapeways API credentials
- [ ] Configure webhook endpoint in Shapeways dashboard
- [ ] Set up file storage (S3/Cloudflare R2) for uploads
- [ ] Configure CDN for file serving
- [ ] Add authentication to protect order endpoints
- [ ] Implement payment processing integration
- [ ] Add email notifications for order updates

## Future Enhancements

1. **Real Shapeways API Integration**
   - Apply for Shapeways API access
   - Implement actual OAuth2 flow
   - Use real model upload and analysis

2. **Additional Providers**
   - Craftcloud integration
   - Xometry integration
   - Local print service marketplace

3. **Advanced Features**
   - 3D model preview before upload
   - Automatic model repair detection
   - Multi-material orders
   - Bulk ordering discounts

4. **Agent Features**
   - API endpoint for agent-to-agent ordering
   - Webhook notifications for agents
   - Automated reordering

## Testing

Test the flow:
1. Navigate to `/manufacturing`
2. Click "Get a Quote"
3. Upload a sample 3D model file
4. Select material and quantity
5. Review quote breakdown
6. Place test order
7. View orders at `/manufacturing/orders`

## Navigation Update

The header now includes a "Manufacturing" link with indigo styling, positioned between "Agents" and "Capital".
