-- Admin accounts reach cross-tenant areas (/manager, /social) and any brand.
-- Grant with: UPDATE users SET is_admin = true WHERE id = '<user id>';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
