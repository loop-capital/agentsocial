# CRM Integration Spec — AgentSocial

## Status: DRAFT — Pending Review

## Overview

AgentSocial integrates with multiple CRM/booking platforms to provide bidirectional lead sync. This document defines Phase 1 (GHL + Square) integration architecture.

## Philosophy

- **Standalone first:** AgentSocial works independently
- **Sync is value-add:** Not core dependency
- **Bidirectional:** Leads flow both ways
- **Source of truth:** AgentSocial = social engagement data, CRM = contact/CRM data

## Phase 1 Integrations

### 1. GoHighLevel (GHL)
**Type:** CRM + Marketing Automation
**Priority:** Primary
**API:** REST API (OAuth 2.0)
**Endpoints:**
- Contacts: `/contacts/` (CRUD, tags, custom fields)
- Opportunities: `/opportunities/` (pipelines, deals)
- Calendars: `/calendars/` (appointments, booking)
- Conversations: `/conversations/` (SMS, email)
- Webhooks: 50+ real-time events

### 2. Square
**Type:** Payments + Booking
**Priority:** Secondary
**API:** REST API (OAuth 2.0)
**Endpoints:**
- Customers: `/v2/customers` (CRUD)
- Bookings: `/v2/bookings` (appointments)
- Payments: `/v2/payments` (transactions)
- Team: `/v2/team-members` (staff)

## Sync Architecture

```
AgentSocial ←→ Integration Hub ←→ GHL/Square

AgentSocial → GHL/Square:
- Social engagement (likes, comments, DMs) → Contact record
- Form submissions → New lead
- AI chat qualification → Lead score
- Booking requests → Appointment

GHL/Square → AgentSocial:
- New contact → Create social profile tracking
- Appointment booked → Content calendar event
- Lead status change → Adjust social targeting
- Review received → Social proof content
```

## Field Mapping

### Core Fields (Phase 1)
| AgentSocial Field | GHL Field | Square Field |
|-------------------|-----------|--------------|
| name | name | given_name + family_name |
| email | email | email_address |
| phone | phone | phone_number |
| tags | tags | custom attributes |
| status | pipeline_stage | status |
| source | source | source (custom) |
| created_at | created_at | created_at |
| updated_at | updated_at | updated_at |

### Extended Fields (Phase 2)
| AgentSocial Field | GHL Field | Square Field |
|-------------------|-----------|--------------|
| address | address | address |
| marketing_opt_in | custom_field | email_unsubscribed |
| appointment_pref | custom_field | booking_preferences |
| last_engagement | last_activity | last_visited |
| social_profiles | custom_field | custom attributes |

## Sync Frequency

### Real-Time (Webhook-based)
- New lead created
- Appointment booked/cancelled
- Critical status changes

### Hourly (Batch)
- Contact updates
- Tag changes
- Engagement metrics
- Social profile updates

### Daily (Batch)
- Full sync verification
- Duplicate detection
- Data reconciliation

## De-duplication Strategy

1. **Matching:** Email + Phone (primary), Name + Address (secondary)
2. **Merge Logic:** 
   - AgentSocial wins for social engagement data
   - CRM wins for contact/CRM data
   - Manual review for conflicts
3. **Square Integration:** Leverage Square's built-in duplicate detection

## Authentication

### GHL
- OAuth 2.0 flow
- Scopes: contacts.read, contacts.write, calendars.read, calendars.write
- Refresh token rotation

### Square
- OAuth 2.0 flow
- Scopes: CUSTOMERS_READ, CUSTOMERS_WRITE, BOOKINGS_READ, BOOKINGS_WRITE
- Sandbox environment for testing

## Error Handling

1. **API Failures:** Retry with exponential backoff (max 3 attempts)
2. **Rate Limiting:** Queue requests, notify admin
3. **Data Conflicts:** Log to conflicts table, manual resolution
4. **Webhook Failures:** Retry with exponential backoff, escalate after 5 failures

## Security

1. **Encryption:** API keys encrypted at rest (AES-256)
2. **Transmission:** HTTPS only
3. **Webhook Verification:** Signature validation
4. **Data Retention:** 90 days for sync logs

## Monitoring

1. **Sync Status Dashboard:** Last sync time, success rate, errors
2. **Alerts:** Failed syncs, rate limit warnings, duplicate counts
3. **Logs:** Structured logging with correlation IDs

## Future Integrations (Phase 2+)

1. **MindBody** — Fitness/wellness
2. **Phorest** — Salon-specific
3. **Fresha** — Beauty booking
4. **Vagaro** — Salon software
5. **Zoho CRM** — Alternative CRM
6. **HubSpot** — Enterprise CRM

## Implementation Plan

### Week 1: Foundation
- [ ] Create integration hub architecture
- [ ] Set up OAuth flows (GHL + Square)
- [ ] Create database tables (sync_logs, field_mappings, credentials)
- [ ] Build webhook handlers

### Week 2: GHL Integration
- [ ] Contact sync (bidirectional)
- [ ] Pipeline/opportunity sync
- [ ] Calendar/appointment sync
- [ ] Webhook event handling

### Week 3: Square Integration
- [ ] Customer sync (bidirectional)
- [ ] Booking sync
- [ ] Payment transaction sync
- [ ] Team member sync

### Week 4: Testing & Polish
- [ ] End-to-end testing
- [ ] Error handling verification
- [ ] Performance optimization
- [ ] Documentation

## Key Decisions (Approved 2026-09-14)

### 1. Unified CRM Connector Architecture
**Decision:** Build unified `CRMConnector` interface with pluggable adapters
- **Benefits:** Consistent API, easier testing, future-proof
- **Adapters:** `GHLConnector` (Phase 1), `SquareConnector` (Phase 1), `MindBodyConnector` (Phase 2), `PhorestConnector` (Phase 2)

### 2. GHL Agency Model Support
**Decision:** Support GHL sub-account structure
- Each AgentSocial user can connect multiple GHL sub-accounts
- Location-based sync (one AgentSocial account → many salon locations)
- Use GHL's location ID as primary key

### 3. GHL SaaS Mode (White-label)
**Decision:** Phase 2 consideration
- **Rationale:** Adds complexity, requires Agency Pro plan ($497/mo)
- **Phase 2 scope:** Agency commission program, white-label support
- **Agency value proposition:** Agencies sell AgentSocial to clients, earn commission, increase service value
- **Saved to:** `project-docs/specs/crm-integration-phase2.md`

### 4. Sync Frequency
**Decision:** Start hourly, monitor API usage
- **At scale:** Switch to webhook-based (real-time) for critical events, batch for updates
- **API limits:** GHL ~100 req/min, Square ~60 req/min
- **Estimation:** 1K users × 100 contacts = 100K contacts/hour

### 5. Field Mapping
**Decision:** Start simple, expand later
- **Phase 1:** Name, Phone, Email, Tags, Status
- **Phase 2:** Address, Marketing preferences, Appointment notifications, Transactions, Bookings

### 6. De-duplication
**Decision:** Match on Email + Phone, merge on creation
- **Square integration:** Leverage Square's built-in duplicate detection
- **Conflict resolution:** AgentSocial wins for social data, CRM wins for contact data

---

**Document Owner:** AgentSocial-CEO
**Last Updated:** 2026-09-14
**Status:** DRAFT — Pending Review
