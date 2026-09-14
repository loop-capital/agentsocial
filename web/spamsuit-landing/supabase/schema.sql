-- SpamSuit Database Schema
-- Supabase / PostgreSQL

-- ============================================
-- 1. SPAM REPORTS (incoming forwarded texts)
-- ============================================
CREATE TABLE spam_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Source info
  sender_phone TEXT NOT NULL,          -- The spammer's phone number
  message_body TEXT NOT NULL,          -- Content of the spam text
  received_at TIMESTAMPTZ NOT NULL,    -- When the victim received it
  
  -- Victim info (optional until they opt-in)
  reporter_phone TEXT,                 -- Victim's phone (from forwarding)
  reporter_email TEXT,                  -- From landing page form
  reporter_name TEXT,                   -- From landing page form
  reporter_opted_in BOOLEAN DEFAULT FALSE, -- Consent to data sharing
  
  -- Validation
  spam_score INTEGER DEFAULT 0,        -- 0-100 AI confidence
  is_tcpa_violation BOOLEAN,           -- AI-validated
  violation_type TEXT[],                -- {'auto-dialer', 'no-consent', 'spoofed', 'after-opt-out'}
  validated_at TIMESTAMPTZ,
  validated_by TEXT,                    -- 'ai' | 'manual' | attorney id
  
  -- Pattern matching
  sender_hash TEXT,                    -- Hash for grouping same sender
  content_hash TEXT,                   -- Hash for grouping same content
  pattern_group_id UUID,              -- Links to pattern group
  
  -- Case management
  status TEXT DEFAULT 'pending'        -- pending | validated | matched | active | settled | dismissed
    CHECK (status IN ('pending', 'validated', 'matched', 'active', 'settled', 'dismissed')),
  attorney_id UUID,                    -- Assigned attorney
  case_id UUID,                        -- Linked case
  
  -- Metadata
  source TEXT DEFAULT 'sms'            -- sms | web | app | email
    CHECK (source IN ('sms', 'web', 'app', 'email')),
  twilio_message_sid TEXT,            -- Twilio message ID
  screenshot_url TEXT,                 -- S3 URL if uploaded
  ip_address INET,                     -- For web submissions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_spam_reports_sender ON spam_reports (sender_phone);
CREATE INDEX idx_spam_reports_status ON spam_reports (status);
CREATE INDEX idx_spam_reports_pattern ON spam_reports (pattern_group_id);
CREATE INDEX idx_spam_reports_sender_hash ON spam_reports (sender_hash);
CREATE INDEX idx_spam_reports_content_hash ON spam_reports (content_hash);
CREATE INDEX idx_spam_reports_created ON spam_reports (created_at DESC);

-- ============================================
-- 2. PATTERN GROUPS (same spam campaign)
-- ============================================
CREATE TABLE pattern_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Pattern identification
  sender_phone TEXT,                   -- Common sender
  content_signature TEXT,              -- Pattern of message content
  campaign_type TEXT,                  -- 'health_insurance' | 'mortgage' | 'lead_gen' | 'mlm' | 'other'
  
  -- Aggregation
  report_count INTEGER DEFAULT 1,
  victim_count INTEGER DEFAULT 1,
  first_seen_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  
  -- Geographic spread
  states_affected TEXT[],              -- ['OH', 'TX', 'FL']
  cities_affected TEXT[],              -- ['Columbus', 'Austin']
  
  -- Class action potential
  is_class_action_eligible BOOLEAN DEFAULT FALSE,
  estimated_violation_count INTEGER,
  estimated_settlement_value NUMERIC(12,2),
  
  -- Status
  status TEXT DEFAULT 'active'         -- active | under_investigation | in_litigation | resolved
    CHECK (status IN ('active', 'under_investigation', 'in_litigation', 'resolved')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. VICTIMS (opted-in users)
-- ============================================
CREATE TABLE victims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Contact info
  phone TEXT,
  email TEXT,
  name TEXT,
  state TEXT,
  city TEXT,
  
  -- Professional info (optional)
  profession TEXT,                     -- 'realtor' | 'insurance' | 'stylist' | 'other'
  
  -- Opt-ins
  opted_in_data_sharing BOOLEAN DEFAULT FALSE,
  opted_in_marketing BOOLEAN DEFAULT FALSE,
  opted_in_settlement BOOLEAN DEFAULT TRUE,
  
  -- Activity
  report_count INTEGER DEFAULT 0,
  total_potential_value NUMERIC(12,2) DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'active'         -- active | matched | settled | inactive
    CHECK (status IN ('active', 'matched', 'settled', 'inactive')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. ATTORNEYS
-- ============================================
CREATE TABLE attorneys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Info
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  firm_name TEXT,
  bar_number TEXT,
  state TEXT,
  
  -- Specialty
  specialty TEXT[] DEFAULT '{"tcpa"}',
  territory TEXT[],                     -- ['OH', 'National']
  max_cases INTEGER,                   -- Capacity
  
  -- Performance
  cases_accepted INTEGER DEFAULT 0,
  cases_won INTEGER DEFAULT 0,
  total_recovered NUMERIC(12,2) DEFAULT 0,
  avg_settlement NUMERIC(12,2),
  
  -- Financial
  fee_percentage NUMERIC(5,2) DEFAULT 33.33,  -- Their contingency %
  our_percentage NUMERIC(5,2) DEFAULT 25.00,   -- Our cut of their fee
  
  -- Status
  status TEXT DEFAULT 'pending'         -- pending | approved | active | suspended
    CHECK (status IN ('pending', 'approved', 'active', 'suspended')),
  stripe_connect_id TEXT,               -- For payouts
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. CASES (matched violations + attorney)
-- ============================================
CREATE TABLE cases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Parties
  attorney_id UUID REFERENCES attorneys(id),
  pattern_group_id UUID REFERENCES pattern_groups(id),
  
  -- Case details
  violation_count INTEGER DEFAULT 0,
  victim_ids UUID[],                    -- Array of victim IDs in this case
  estimated_value NUMERIC(12,2),
  
  -- Settlement
  settlement_amount NUMERIC(12,2),
  settlement_date TIMESTAMPTZ,
  our_fee NUMERIC(12,2),               -- Our cut
  attorney_fee NUMERIC(12,2),           -- Attorney's cut
  
  -- Status
  status TEXT DEFAULT 'open'            -- open | in_progress | settlement | settled | dismissed
    CHECK (status IN ('open', 'in_progress', 'settlement', 'settled', 'dismissed')),
  
  -- Dates
  filed_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. EVIDENCE (chain of custody)
-- ============================================
CREATE TABLE evidence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  report_id UUID REFERENCES spam_reports(id),
  case_id UUID REFERENCES cases(id),
  
  -- Evidence content
  evidence_type TEXT                    -- 'screenshot' | 'sms_metadata' | 'sender_lookup' | 'dnc_check'
    CHECK (evidence_type IN ('screenshot', 'sms_metadata', 'sender_lookup', 'dnc_check')),
  storage_url TEXT,                     -- S3 URL
  metadata JSONB,                      -- Flexible evidence metadata
  
  -- Chain of custody
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  collected_by TEXT DEFAULT 'system',
  hash_sha256 TEXT,                    -- Tamper verification
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. DATA SALES LOG
-- ============================================
CREATE TABLE data_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  buyer_name TEXT NOT NULL,
  buyer_type TEXT                       -- 'carrier' | 'security' | 'government' | 'app_developer' | 'researcher'
    CHECK (buyer_type IN ('carrier', 'security', 'government', 'app_developer', 'researcher')),
  
  product_type TEXT,                    -- 'spam_numbers' | 'trends' | 'fraud_alerts' | 'api_access'
  data_range_start TIMESTAMPTZ,
  data_range_end TIMESTAMPTZ,
  records_sold INTEGER,
  
  amount NUMERIC(12,2),
  currency TEXT DEFAULT 'USD',
  invoice_id TEXT,
  paid_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. ACTIVITY LOG
-- ============================================
CREATE TABLE activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL,            -- 'report' | 'case' | 'victim' | 'attorney' | 'data_sale'
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,                 -- 'created' | 'validated' | 'matched' | 'settled' etc.
  details JSONB,
  performed_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (enable per table)
-- ============================================
ALTER TABLE spam_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE victims ENABLE ROW LEVEL SECURITY;
ALTER TABLE attorneys ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER tr_spam_reports_updated BEFORE UPDATE ON spam_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_pattern_groups_updated BEFORE UPDATE ON pattern_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_victims_updated BEFORE UPDATE ON victims FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_attorneys_updated BEFORE UPDATE ON attorneys FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_cases_updated BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-increment victim report count
CREATE OR REPLACE FUNCTION increment_victim_reports()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reporter_phone IS NOT NULL THEN
    UPDATE victims SET 
      report_count = report_count + 1,
      updated_at = NOW()
    WHERE phone = NEW.reporter_phone;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_spam_reports_increment 
AFTER INSERT ON spam_reports 
FOR EACH ROW EXECUTE FUNCTION increment_victim_reports();