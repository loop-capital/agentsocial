# Givvy — Project Plan

## Overview
Givvy is a giveaway and contest curation platform. Users visit to browse and enter contests. Their contact information is collected via gated content (popup/modal) and they opt-in for future marketing.

## Revenue Model
- **Primary**: Sell advertising/sponsored contests to partner businesses
- **Secondary**: Affiliate commissions from contest providers
- **Asset**: Opted-in user database for targeted marketing

## Architecture

### Website (WordPress)
- **Theme**: Custom or child theme with contest listing pages
- **Contest Pages**: Show preview data, full details gated behind popup
- **Data Collection Popup**: Name, email, phone, marketing opt-in checkbox
- **Plugins Needed**:
  - Custom popup/modal plugin (or Elementor Pro, Popup Maker)
  - Form plugin (WPForms, Gravity Forms, or custom)
  - User registration/profile management
  - Email integration (Mailchimp, SendGrid, etc.)
  - SEO plugin (Yoast or RankMath)
  - Caching (WP Super Cache or LiteSpeed)

### Mobile App (iOS + Android)
- **Framework**: React Native (recommended) or Flutter
- **Features**:
  - Browse curated contests/giveaways
  - Enter contests (triggers data collection)
  - User profile with contact info
  - Push notifications for new contests
  - Marketing opt-in management
- **Data Collection**: Same flow as website — user info required to enter

### Backend API (Shared)
- **Purpose**: Store user data from both website and app
- **Stack**: Node.js/Express or Python/FastAPI with PostgreSQL
- **Endpoints**:
  - POST /api/users — Register/collect user data
  - GET /api/contests — List available contests
  - POST /api/contests/:id/enter — Enter a contest
  - GET /api/users/:id/profile — User profile
  - PUT /api/users/:id/preferences — Update marketing preferences
- **Auth**: JWT tokens
- **Data Stored**: Name, email, phone, opt-in preferences, contest entries

### Database Schema (PostgreSQL)
```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    marketing_opt_in BOOLEAN DEFAULT false,
    source VARCHAR(50), -- 'website' or 'app'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Contests table
CREATE TABLE contests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    sponsor VARCHAR(255),
    start_date DATE,
    end_date DATE,
    prize_value DECIMAL(10,2),
    category VARCHAR(100),
    external_url VARCHAR(500),
    is_featured BOOLEAN DEFAULT false,
    is_sponsored BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Entries table
CREATE TABLE entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    contest_id INTEGER REFERENCES contests(id),
    entered_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, contest_id)
);

-- Partners/Advertisers table
CREATE TABLE partners (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    contract_value DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Development Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Set up WordPress hosting
- [ ] Create Givvy WordPress theme
- [ ] Design database schema
- [ ] Build basic backend API
- [ ] Set up user data collection popup

### Phase 2: Website Launch (Week 3-4)
- [ ] Contest listing pages
- [ ] Data-gating popup working
- [ ] User registration flow
- [ ] Email integration
- [ ] Basic SEO setup
- [ ] Launch MVP

### Phase 3: Mobile App (Week 5-8)
- [ ] React Native project setup
- [ ] Contest browsing screens
- [ ] User registration/profile
- [ ] Contest entry flow
- [ ] Push notifications
- [ ] App Store / Play Store submission

### Phase 4: Growth (Week 9+)
- [ ] Partner advertising portal
- [ ] Analytics dashboard
- [ ] Email marketing automation
- [ ] Social media integration
- [ ] Referral program
