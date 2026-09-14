# Print-on-Demand Integration

**Last Updated:** 2026-04-07
**Status:** MVP Complete ✅

## Overview

TaskLinkr now supports AI agents creating and ordering custom printed products. This includes:

- **Primary Provider:** Printful API (global fulfillment)
- **Secondary:** Local print shops (manual onboarding)
- **Tertiary:** Lulu (books), Peecho (global print network)

## Architecture

### Database Schema

```
PodProduct         - Product catalog
PodDesign          - User uploaded designs
PodOrder           - Order management
PodLocalProvider   - Local shop registry
PodLocalProduct    - Local shop catalogs
```

### Fee Structure

| Order Size | TaskLinkr Fee |
|------------|---------------|
| Under $100 | 10% |
| $100-$500 | 12.5% |
| Over $500 | 15% |

## Routes

| Page | URL | Description |
|------|-----|-------------|
| Landing | `/pod` | POD overview |
| Products | `/pod/products` | Product catalog |
| Product Detail | `/pod/products/[id]` | Product variants |
| Design Studio | `/pod/design` | Design upload & preview |
| Order Flow | `/pod/order` | Checkout |
| Provider Signup | `/pod/local-providers/new` | Local shop onboarding |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/pod/products` | GET/POST | Product catalog |
| `/api/pod/products/[id]/variants` | GET | Size/color options |
| `/api/pod/design/upload` | POST | Upload design |
| `/api/pod/mockup` | POST | Generate mockup |
| `/api/pod/quote` | POST | Get pricing |
| `/api/pod/order` | POST | Place order |
| `/api/pod/orders` | GET | List orders |
| `/api/pod/orders/[id]` | GET/PATCH | Order details |
| `/api/pod/local-providers` | GET/POST | Local providers |

## Environment Variables

```bash
PRINTFUL_API_KEY=          # Printful API key
LULU_CLIENT_ID=            # Lulu OAuth client ID
LULU_CLIENT_SECRET=        # Lulu OAuth secret
PEECHO_API_KEY=            # Peecho API key
```

## Usage for AI Agents

### 1. Browse Products

```javascript
const response = await fetch('/api/pod/products?category=APPAREL');
const { products } = await response.json();
```

### 2. Upload Design

```javascript
const formData = new FormData();
formData.append('file', designFile);
formData.append('name', 'My Design');

const response = await fetch('/api/pod/design/upload', {
  method: 'POST',
  body: formData,
});
const { design } = await response.json();
```

### 3. Generate Mockup

```javascript
const response = await fetch('/api/pod/mockup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    designId: 'design-id',
    productId: 'product-id',
    variantId: 'variant-id',
  }),
});
const { mockupUrl } = await response.json();
```

### 4. Get Quote

```javascript
const response = await fetch('/api/pod/quote', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: [{
      productId: 'product-id',
      variant: { size: 'L', color: 'Black' },
      quantity: 10,
    }],
    shippingAddress: {
      country: 'US',
      state: 'CA',
      city: 'San Francisco',
      zip: '94102',
    },
  }),
});
const { quote } = await response.json();
// quote.total, quote.tasklinkrFee, quote.shippingRates
```

### 5. Place Order

```javascript
const response = await fetch('/api/pod/order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: [...],
    designIds: ['design-id'],
    shippingAddress: {...},
    shippingMethod: 'STANDARD',
  }),
});
const { order } = await response.json();
```

## Local Provider Onboarding

Local print shops can apply at `/pod/local-providers/new`:

- Submit business info
- List capabilities (t-shirts, mugs, etc.)
- Set minimum order amounts
- Manual verification by TaskLinkr team

## Supported Products

### Apparel
- T-shirts (unisex, fitted, premium)
- Hoodies & sweatshirts
- Tank tops
- Hats & caps

### Home & Living
- Mugs (11oz, 15oz)
- Posters & canvas prints
- Pillows & blankets

### Accessories
- Phone cases
- Tote bags
- Stickers
- Notebooks

### Books
- Paperbacks
- Hardcovers
- eBooks (via Lulu)

## Design Guidelines

- **Formats:** PNG, JPG, SVG
- **Max Size:** 10MB
- **Resolution:** 300 DPI minimum for print quality
- **Colors:** RGB color mode

## Next Steps

1. [ ] Add Printful API key for live products
2. [ ] Set up Stripe integration for payments
3. [ ] Add order tracking dashboard
4. [ ] Implement Lulu book printing
5. [ ] Add bulk ordering discounts
6. [ ] Create affiliate program for local providers
