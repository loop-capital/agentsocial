-- Outbound SMS and voice calls (appointment reminders, follow-ups)

-- Numbers that texted STOP. Checked before every outbound SMS or call.
CREATE TABLE IF NOT EXISTS sms_opt_outs (
  phone text PRIMARY KEY,               -- E.164
  opted_out_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'inbound_keyword'
);

-- Per-brand sending settings. from_number null = TWILIO_PHONE_NUMBER.
CREATE TABLE IF NOT EXISTS messaging_settings (
  brand_id uuid PRIMARY KEY REFERENCES brands(id) ON DELETE CASCADE,
  from_number text,
  quiet_hours_start smallint NOT NULL DEFAULT 21,  -- local hour, no sends from here…
  quiet_hours_end smallint NOT NULL DEFAULT 8,     -- …until here
  daily_limit_per_recipient smallint NOT NULL DEFAULT 3,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS outbound_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL,                   -- sms | call
  purpose text NOT NULL DEFAULT 'transactional', -- reminder | follow_up | transactional
  to_number text NOT NULL,
  from_number text NOT NULL,
  body text NOT NULL,                   -- SMS text, or the script a call speaks
  voice text,
  status text NOT NULL DEFAULT 'scheduled',
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  deferred_reason text,
  sent_at timestamptz,
  completed_at timestamptz,
  provider_sid text,
  error jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS outbound_messages_brand_idx ON outbound_messages (brand_id, created_at DESC);
CREATE INDEX IF NOT EXISTS outbound_messages_due_idx ON outbound_messages (scheduled_at) WHERE status = 'scheduled';
CREATE UNIQUE INDEX IF NOT EXISTS outbound_messages_sid_idx ON outbound_messages (provider_sid) WHERE provider_sid IS NOT NULL;

-- Carry over opt-outs recorded on review requests
INSERT INTO sms_opt_outs (phone, opted_out_at, source)
SELECT customer_phone, coalesce(max(opted_out_at), now()), 'review_sentry'
FROM review_requests
WHERE opted_out = true AND customer_phone IS NOT NULL
GROUP BY customer_phone
ON CONFLICT (phone) DO NOTHING;
