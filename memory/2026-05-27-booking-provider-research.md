# 2026-05-27 Booking Provider API Research

## Phorest — 🟢 GREEN (Best Next Target)

### API Overview
- **URL**: `https://api.phorest.com/v3/` (EU) or US server
- **Auth**: Basic Auth (`global/username`, password from support)
- **Access**: Contact Phorest support to get credentials — include account number
- **Docs**: https://developer.phorest.com/
- **LLM-friendly docs**: https://developer.phorest.com/llms.txt

### Key Endpoints We Need (ALL AVAILABLE)
| Need | Endpoint | Status |
|------|----------|--------|
| Check availability | `GET /api/v3/business/{businessId}/branch/{branchId}/appointment-availabilities` | ✅ |
| Create booking | `POST /api/v3/business/{businessId}/branch/{branchId}/booking` | ✅ |
| Cancel booking | `POST /api/v3/business/{businessId}/branch/{branchId}/booking/{id}/cancel` | ✅ |
| Retrieve booking | `GET /api/v3/business/{businessId}/branch/{branchId}/appointment/{id}` | ✅ |
| List services | `GET /api/v3/business/{businessId}/branch/{branchId}/services` | ✅ |
| List staff | `GET /api/v3/business/{businessId}/branch/{branchId}/staffs` | ✅ |
| Staff timetables | `GET /api/v3/business/{businessId}/branch/{branchId}/staff-timetables` | ✅ |
| Create/update client | `POST/PUT /api/v3/business/{businessId}/client` | ✅ |
| Search clients | `GET /api/v3/business/{businessId}/clients` | ✅ |
| Branch timetables | `GET /api/v3/business/{businessId}/branch/{branchId}/timetable` | ✅ |
| Deposit payment links | `POST /api/v3/business/{businessId}/branch/{branchId}/deposit-payment-link` | ✅ |

### Architecture Notes
- **Multi-branch**: Uses `businessId` + `branchId` in every URL (like Square's Location)
- **US vs EU**: Must choose correct server — US resources need US server
- **No webhooks**: Must poll using `updated_at` field for changes
- **Live API**: Actions are real-time (no sandbox, changes happen instantly)
- **Pagination**: Standard `page` + `size` params (0-indexed)
- **Booking flow**: Create booking → Activate booking (separate step, like Square's ACCEPTED → CONFIRMED)
- **Deposit support**: Can create deposit payment links with auto-expiry and SMS/email notification

### Authentication
1. Contact https://support.phorest.com/hc/en-us/requests/new?ticket_form_id=360000928660
2. Must include Phorest Account Number
3. Email must be from address associated with the business in Phorest
4. Username format: `global/email@domain.com`
5. Basic Auth (username:password in header)

### What We Need to Build
1. **PhorestAuthProvider** — Basic Auth wrapper, stores credentials per client
2. **PhorestBookingService** — Availability search, booking create/cancel, client lookup
3. **PhorestSyncService** — Pull services, staff, timetables into our format
4. Add Phorest as option in Voice AI onboarding (coming soon)

### Integration Complexity: **MEDIUM**
- Full API with all endpoints we need
- Standard REST, well-documented
- Main complexity: multi-branch architecture, booking activation flow
- No webhooks (need polling strategy)

---

## Booker (Mindbody) — 🟡 YELLOW

### API Overview
- **Auth**: OAuth 2.0 + API Key
- **Access**: Requires partner application approval (1-2 weeks)
- **Docs**: https://developers.booker.com/

### Key Endpoints
| Need | Available? | Notes |
|------|-----------|-------|
| Availability | ✅ | `GET /bookings/availability` |
| Create booking | ✅ | `POST /bookings` |
| Cancel booking | ✅ | `DELETE /bookings/{id}` |
| List services | ✅ | `GET /services` |
| List staff | ✅ | `GET /employees` |
| Search clients | ✅ | `GET /customers` |

### Blocker
- Must apply for partner access
- Approval process takes 1-2 weeks
- Need to demonstrate use case

---

## Boulevard — 🟡 YELLOW

### API Overview
- **Auth**: OAuth 2.0
- **Access**: Developer portal requires auth to access docs
- **Docs**: https://developers.boulevard.io/

### Status
- Has API with booking, availability, client endpoints
- Need partnership/BD outreach to get access
- Modern platform, likely well-documented once you're in

---

## Vagaro — 🔴 RED

### API Overview
- **No public API documentation**
- **Access**: Contact partnership@vagaro.com for potential access
- **Market share**: 50K-100K salons (significant)

### Status
- No way to integrate without BD partnership
- Highest-ROI target if we unlock via partnership
- Currently: lead capture mode only

---

## Meevo (Millennium) — 🔴 RED

### API Overview
- **API link on website returns 404**
- **Access**: Direct partnership with Millennium required
- **Market**: Enterprise salons, large chains

### Status
- API may exist for enterprise partners but not publicly documented
- Need to contact Millennium directly
- Currently: lead capture mode only

---

## Fresha — 🔴 RED

### API Overview
- **No API at all**
- **Business model**: Marketplace — they want users on their platform
- **Market share**: 100K+ businesses worldwide

### Status
- No incentive to open their API — they benefit from lock-in
- Marketplace model means they capture clients, not share them
- Currently: lead capture mode only

---

## Schedulicity — 🔴 RED

### API Overview
- **No public API**
- **Small market share**, not salon-specific
- **Low priority**

---

## Integration Priority

1. **Square** ✅ — Already integrated (voice API port 3015)
2. **Phorest** 🟢 — Self-serve API, full booking support, easy win. Apply for credentials NOW.
3. **Booker** 🟡 — Apply for partner access (1-2 week lead time)
4. **Boulevard** 🟡 — BD outreach needed
5. **Vagaro** 🔴 — BD partnership required, high ROI if unlocked
6. **Meevo/Fresha/Schedulicity** 🔴 — Lead capture for now

## Lead Capture Mode (For All Red Providers)

For salons using providers without API access (or no software at all):
1. AI receptionist answers the call
2. Collects: name, phone, preferred service, preferred stylist, preferred date/time
3. Routes lead to salon staff via SMS and/or email
4. Staff calls back to confirm and manually books
5. No booking software integration needed