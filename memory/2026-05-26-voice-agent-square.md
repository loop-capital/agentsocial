# 2026-05-26: Voice Agent Square Production Integration

## What Happened
Connected PLEIJ Salon's AI receptionist (Gisele) to their real Square production account.

## Square API Integration
- **Environment**: Production (real PLEIJ account)
- **Location**: `0Q59TWNM39JRJ` (PLEIJ Salon, Columbus OH)
- **App ID**: `sq0idp-jeT1B7MiHjqOcWxbRlbJaA`
- **Scopes granted**: Team management, Customer management, Bookings

### Critical Finding: Square Node SDK Bug
The Square Node SDK (`square` npm package) has a field name bug in `searchAvailability` — it sends camelCase (`serviceVariationId`) when the API requires snake_case (`service_variation_id`). This causes all availability searches to return 0 results.

**Solution**: Bypassed the SDK entirely. Used raw HTTPS calls to `connect.squareup.com` with correct snake_case field names. Everything works perfectly with raw API.

## Real PLEIJ Data Discovered

### Team Members (5 active + 45 inactive)
- **Tiché** (0Q59TWNM39JRJ) — Owner, Artistic Director, bookable
- **Jenna Moreland** (TMWe05HC6vPwzHsC) — Stylist/Director/Master, bookable
- **Deniece Pittman** (TMe1NDlOWDxGEsuG) — Stylist/Director/Master, bookable
- **Linda Bruning** (RDgL6Hq2lz-0CQlYxo3x) — Esthetician, bookable
- **Chantel Marie** (TM8Sgt45NRSv0VaK) — Nail Tech, bookable

### Service Catalog (334 items, 15 main services)
- 4-tier pricing: Stylist < Director < Master Stylist < Artistic Director
- Haircut & Style: $67/$74/$80/$84 (60 min)
- Men's Haircut: $40/$45/$50/$55 (30 min)
- Balayage & Haircut: $300/$325/$355/$400 (3 hr)
- Full Highlights & Haircut: $190/$195/$200/$205 (3 hr)
- + 11 more main service categories

### Availability (real Square data)
- Friday May 29: 8 slots (6 Deniece, 1 Jenna, 1 open)
- Saturday May 30: 3 slots (1 Deniece, 2 Jenna)
- Wednesday June 3: 11 slots (Deniece + Jenna mix)

### Booking Flow (verified end-to-end)
1. Search availability → ✅ real slots from Square
2. Find/create customer → ✅ customer lookup by phone
3. Create booking → ✅ status: ACCEPTED
4. Cancel booking → ✅ status: CANCELLED_BY_SELLER
5. SMS confirmation → ✅ via Twilio

## Voice API Server (port 3015)
- **Framework**: Express.js (CommonJS)
- **Square integration**: Raw HTTPS (no SDK)
- **Endpoints**:
  - GET `/health` — status check
  - GET `/api/v1/voice/services` — service catalog
  - GET `/api/v1/voice/stylists` — stylist list
  - POST `/api/v1/voice/availability` — search slots
  - POST `/api/v1/voice/book` — create booking
  - POST `/api/v1/voice/cancel` — cancel booking (NEW)
  - GET `/api/v1/voice/booking/:id` — booking details (NEW)
  - POST `/api/v1/voice/sync` — refresh stylist profiles

## Gisele Workflow Updated (Dograh v6)
- Updated prompts with real PLEIJ data
- Real 4-tier pricing, real stylist names, real address
- Published definition_id: 8

## dotenvx Issue
The `dotenvx` wrapper injects banner text into `stdout`, which corrupts token values when using `node -e` scripts to read env vars. The Express server reads `process.env` at startup and is unaffected. For ad-hoc scripts, read `.env` file directly with `grep`.

## Files
- `packages/voice-agent/src/server.cjs` — API server (raw Square API)
- `packages/voice-agent/.env` — credentials