# TaskLinkr Delivery — Build Documentation

**Date:** April 7, 2026  
**Status:** MVP Complete, Ready for Testing

## Overview

TaskLinkr Delivery is a driver marketplace that connects AI agents and users with local delivery drivers. Targeting Amazon Flex/Hub drivers and independent couriers who want more flexibility and higher earnings.

**Key Differentiator:** Drivers keep 85% of delivery fees (vs industry standard 70-75%).

---

## Features Implemented

### 1. Driver Portal (`/driver`)

#### Landing Page
- Hero section with compelling pitch to Amazon Flex drivers
- Comparison table: TaskLinkr vs Amazon Flex
- Interactive earnings calculator
- Multi-step registration form
- "How it works" section
- Vehicle type showcase
- FAQ section structure

#### Registration Flow
- Step 1: Personal info (name, email, phone)
- Step 2: Vehicle info (type, make, model, year)
- Step 3: Availability preferences
- Optional referral code support
- API endpoint: `POST /api/delivery/drivers`

#### Driver Dashboard (`/driver/dashboard`)
- Online/offline toggle
- Stats cards: total earnings, weekly earnings, trips, acceptance rate
- Available deliveries list with accept/decline
- Recent deliveries history
- Promotions/bonuses widget
- Referral code sharing

#### Driver Earnings (`/driver/earnings`)
- Total earnings summary
- Weekly/monthly breakdown
- Visual earnings chart
- Recent earnings list with tips breakdown
- Payout method management
- Tax document access
- Last payout info

### 2. Delivery Request Flow (`/delivery/request`)

#### Multi-Step Form
- Step 1: Package details (type, size, weight, fragile/signature options)
- Step 2: Pickup & dropoff addresses with contact info
- Step 3: Timing preferences (ASAP, scheduled, flexible)
- Step 4: Quote display with pricing breakdown

#### Supported Delivery Types
- PACKAGE - General parcels
- FOOD - Restaurant/food delivery
- DOCUMENT - Contracts, papers
- GROCERIES - Supermarket items
- PHARMACY - Medical supplies
- CUSTOM - Errands, special requests

#### Pricing Model
```
Base rate: $3.50
Per mile: $0.85
Per minute: $0.25
Surge: 1.5x - 3x during peak demand

Example: 5-mile, 15-minute delivery
Base: $3.50
Distance: 5 × $0.85 = $4.25
Time: 15 × $0.25 = $3.75
Subtotal: $11.50
TaskLinkr fee (15%): $1.73
Total: $13.23
Driver earns: $11.50 × 85% = $9.78
```

### 3. Matching Engine

#### Implementation
- Location-based driver pool matching
- Availability zone filtering (zip codes/cities)
- Real-time driver status checking
- Automatic quote generation with surge detection
- Driver notification on new requests

#### API Endpoints
- `GET /api/delivery/drivers/available` - Find available drivers
- `POST /api/delivery/requests` - Create request + match drivers
- `POST /api/delivery/requests/[id]/accept` - Driver accepts

### 4. Real-Time Tracking (`/delivery/track/[id]`)

#### Features
- Live driver location updates
- ETA calculation based on current position
- Progress visualization (4 steps)
- Driver info display
- Chat/call buttons
- Pickup/dropoff address display
- Auto-refresh every 10 seconds

#### API Endpoints
- `GET /api/delivery/tracking/[id]` - Get tracking data
- `POST /api/delivery/webhook/location` - Driver location updates

### 5. Database Schema (Prisma)

#### Driver Model
```prisma
model Driver {
  id                    String       @id @default(cuid())
  userId                String       @unique
  firstName             String
  lastName              String
  email                 String       @unique
  phone                 String
  vehicleType           DriverVehicleType
  vehicleMake/Model/Year/Color/License
  availabilityZones     String[]
  availabilitySchedule  Json?
  currentLocation       Json?
  status                DriverStatus @default(PENDING)
  backgroundCheckPassed Boolean      @default(false)
  rating                Float        @default(0)
  reviewCount           Int          @default(0)
  totalEarningsCents    Int          @default(0)
  lifetimeTrips         Int          @default(0)
  payoutMethod/Details
  referralCode          String?      @unique
  deliveries            Delivery[]
  earnings              DriverEarning[]
}
```

#### DeliveryRequest Model
```prisma
model DeliveryRequest {
  id                  String                @id @default(cuid())
  requesterId         String
  requesterType       String                // USER, AGENT, BUSINESS
  deliveryType        DeliveryType
  packageSize         PackageSize
  packageWeight       PackageWeight
  isFragile           Boolean
  requiresSignature   Boolean
  pickupAddress       Json                  // { street, city, state, zip, lat, lng }
  dropoffAddress      Json
  pickup/dropoff ContactName/Phone/Instructions
  requestedTime       DateTime
  timeSensitivity     String                // ASAP, SCHEDULED, FLEXIBLE
  estimatedDistance/Duration
  baseRateCents       Int
  distanceCents       Int
  timeCents           Int
  surgeMultiplier     Float                 @default(1.0)
  totalQuoteCents     Int
  tasklinkrFeeCents   Int
  finalQuoteCents     Int
  driverPayCents      Int
  status              DeliveryRequestStatus @default(PENDING)
  driverId            String?
  matchedDrivers      Json?                 // Array of offered driver IDs
  driver              Driver?               @relation(fields: [driverId], references: [id])
  delivery            Delivery?
}
```

#### Delivery Model
```prisma
model Delivery {
  id                  String   @id @default(cuid())
  requestId           String   @unique
  driverId            String
  acceptedAt/startedAt/pickedUpAt/deliveredAt
  currentLocation       Json?
  pickup/dropoff Location
  estimatedPickup/DropTime
  proofPhotoUrl       String?
  signatureUrl        String?
  notes               String?
  messages            Json?                 // Chat history
  actualDistance/Duration
  request             DeliveryRequest @relation(fields: [requestId], references: [id])
  driver              Driver          @relation(fields: [driverId], references: [id], onDelete: Cascade)
  earning             DriverEarning?
}
```

#### DriverEarning Model
```prisma
model DriverEarning {
  id              String   @id @default(cuid())
  driverId        String
  deliveryId      String   @unique
  basePayCents    Int
  tipCents        Int      @default(0)
  surgeBonusCents Int      @default(0)
  promotionCents  Int      @default(0)
  totalCents      Int
  status          String   @default("PENDING") // PENDING, PAID, FAILED
  paidAt          DateTime?
  driver          Driver   @relation(fields: [driverId], references: [id], onDelete: Cascade)
  delivery        Delivery @relation(fields: [deliveryId], references: [id], onDelete: Cascade)
}
```

### 6. API Routes Summary

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/delivery/drivers` | List drivers with filters |
| POST | `/api/delivery/drivers` | Register new driver |
| GET | `/api/delivery/drivers/[id]` | Get driver details |
| PATCH | `/api/delivery/drivers/[id]` | Update driver status/availability |
| GET | `/api/delivery/drivers/[id]/earnings` | Get driver earnings |
| GET | `/api/delivery/requests` | List delivery requests |
| POST | `/api/delivery/requests` | Create delivery request |
| GET | `/api/delivery/requests/[id]` | Get request details |
| PATCH | `/api/delivery/requests/[id]` | Update request |
| DELETE | `/api/delivery/requests/[id]` | Cancel request |
| POST | `/api/delivery/requests/[id]/accept` | Driver accepts request |
| POST | `/api/delivery/requests/[id]/start` | Driver starts delivery |
| POST | `/api/delivery/requests/[id]/complete` | Driver completes delivery |
| GET | `/api/delivery/tracking/[id]` | Get real-time tracking |
| POST | `/api/delivery/webhook/location` | Driver location update webhook |

### 7. Frontend Pages

| Route | Component | Purpose |
|-------|-----------|---------|
| `/driver` | Driver landing + registration | Recruitment |
| `/driver/dashboard` | Driver dashboard | Active driver portal |
| `/driver/earnings` | Earnings tracking | Financial management |
| `/delivery/request` | Delivery request form | Customer ordering |
| `/delivery/track/[id]` | Live tracking | Order tracking |

### 8. Components Created

- `DriverRegistrationForm` - Multi-step driver signup
- `DeliveryRequestForm` - Multi-step delivery request
- `TrackingView` - Real-time delivery tracking UI
- `EarningsCalculator` - Interactive earnings projection

---

## Pricing & Economics

### Fee Structure
| Component | Amount |
|-----------|--------|
| Base Rate | $3.50 |
| Per Mile | $0.85 |
| Per Minute | $0.25 |
| TaskLinkr Fee | 15% |
| Driver Keeps | 85% |
| Surge Multiplier | 1.5x - 3x |

### Competitive Comparison
| Platform | Driver Keep Rate | Payment Speed | Flexibility |
|----------|-----------------|---------------|-------------|
| TaskLinkr | **85%** | Instant | Per-delivery |
| Amazon Flex | ~70-75% | Weekly | Block-based |
| DoorDash | ~70% | Weekly | Per-delivery |
| Uber Eats | ~65-70% | Weekly | Per-delivery |

---

## Next Steps

### Phase 1: Driver Recruitment
- [ ] Run DB migration with new schema
- [ ] Set up email notifications for driver approval
- [ ] Create driver mobile app (or PWA)
- [ ] Implement SMS notifications for delivery requests
- [ ] Add driver onboarding videos/training

### Phase 2: Demand Aggregation
- [ ] Integrate with AI agent APIs
- [ ] Build agent-to-delivery API
- [ ] Add webhook support for order notifications
- [ ] Implement chat between requester and driver
- [ ] Add proof-of-delivery photo capture

### Phase 3: Scale & Optimize
- [ ] Implement real geocoding for addresses
- [ ] Add Google Maps/Mapbox integration
- [ ] Build route optimization
- [ ] Implement demand forecasting
- [ ] Add batch delivery support

### Phase 4: Financial Infrastructure
- [ ] Integrate Stripe Connect for instant payouts
- [ ] Implement tipping system
- [ ] Add driver cashout options
- [ ] Set up automated tax form generation
- [ ] Add insurance integration

---

## Technical Notes

### Geocoding
Currently using mock coordinates. In production:
- Use Google Places API or Mapbox Geocoding
- Cache coordinates to reduce API calls
- Validate addresses before quote

### Real-Time Tracking
Currently polling every 10 seconds. For production:
- Implement WebSockets or Server-Sent Events
- Use Firebase or Pusher for real-time updates
- Consider mobile app background location updates

### Payment Processing
Currently mocked. For production:
- Stripe Connect for marketplace payments
- Instant payouts via Stripe Instant Payouts
- Hold funds until delivery completion

### Security
- Background check integration (Checkr, Sterling)
- Driver identity verification
- Delivery insurance coverage
- Data encryption for payout details

---

## Files Created

```
prisma/schema.prisma              # Updated with delivery models
app/api/delivery/drivers/         # Driver API routes
app/api/delivery/requests/        # Request API routes
app/api/delivery/tracking/        # Tracking API routes
app/api/delivery/webhook/         # Webhook endpoints
app/driver/                       # Driver portal pages
app/driver/dashboard/             # Driver dashboard
app/driver/earnings/              # Earnings tracking
app/delivery/request/             # Customer request form
app/delivery/track/[id]/          # Tracking page
components/driver-registration-form.tsx
components/delivery-request-form.tsx
components/tracking-view.tsx
memory/tasklinkr-delivery-build.md  # This file
```

---

## Testing Checklist

### Driver Flow
- [ ] Register as new driver
- [ ] View dashboard when approved
- [ ] Toggle online/offline
- [ ] View available deliveries
- [ ] Accept a delivery
- [ ] Update location via webhook
- [ ] Complete delivery
- [ ] View earnings

### Customer Flow
- [ ] Create delivery request
- [ ] View quote
- [ ] Confirm request
- [ ] Track delivery
- [ ] View completion confirmation

### Admin Flow
- [ ] List all drivers
- [ ] Approve pending drivers
- [ ] View all deliveries
- [ ] Monitor earnings

---

**Built by:** tl-dev  
**For:** TaskLinkr Platform  
**Status:** MVP Complete ✅
