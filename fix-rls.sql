-- Fix 17 RLS Issues for AgentSocial
-- Run this in Supabase Dashboard → SQL Editor

-- Enable RLS on all tables (idempotent)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_posts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS: users can read/update their own record
-- ============================================
CREATE POLICY "Users own their record" ON users
  FOR ALL USING (id = auth.uid());

-- ============================================
-- API KEYS: users manage their own keys
-- ============================================
CREATE POLICY "Users manage own API keys" ON api_keys
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- ORGANIZATIONS: members can read, admins can update
-- ============================================
CREATE POLICY "Org members can view" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_memberships om
      WHERE om.organization_id = organizations.id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org admins can update" ON organizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_memberships om
      WHERE om.organization_id = organizations.id AND om.user_id = auth.uid() AND om.role = 'admin'
    )
  );

-- ============================================
-- ORG MEMBERSHIPS: members can read, admins can manage
-- ============================================
CREATE POLICY "Members can view org memberships" ON organization_memberships
  FOR SELECT USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage memberships" ON organization_memberships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_memberships om
      WHERE om.organization_id = organization_memberships.organization_id
        AND om.user_id = auth.uid() AND om.role = 'admin'
    )
  );

-- ============================================
-- BRANDS: owner or org member access
-- ============================================
CREATE POLICY "Users access their brands" ON brands
  FOR ALL USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid()
    )
  );

-- ============================================
-- CHANNELS: via brand ownership
-- ============================================
CREATE POLICY "Users access their channels" ON channels
  FOR ALL USING (
    brand_id IN (
      SELECT b.id FROM brands b
      WHERE b.user_id = auth.uid() OR
        b.organization_id IN (
          SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid()
        )
    )
  );

-- ============================================
-- POSTS: via brand ownership
-- ============================================
CREATE POLICY "Users access their posts" ON posts
  FOR ALL USING (
    brand_id IN (
      SELECT b.id FROM brands b
      WHERE b.user_id = auth.uid() OR
        b.organization_id IN (
          SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid()
        )
    )
  );

-- ============================================
-- POST CHANNELS: via post ownership
-- ============================================
CREATE POLICY "Users access post channels" ON post_channels
  FOR ALL USING (
    post_id IN (
      SELECT p.id FROM posts p
      WHERE p.brand_id IN (
        SELECT b.id FROM brands b
        WHERE b.user_id = auth.uid() OR
          b.organization_id IN (
            SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid()
          )
      )
    )
  );

-- ============================================
-- MEDIA ASSETS: via brand ownership
-- ============================================
CREATE POLICY "Users access their media" ON media_assets
  FOR ALL USING (
    brand_id IN (
      SELECT b.id FROM brands b
      WHERE b.user_id = auth.uid() OR
        b.organization_id IN (
          SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid()
        )
    )
  );

-- ============================================
-- POST MEDIA: via post ownership
-- ============================================
CREATE POLICY "Users access post media" ON post_media
  FOR ALL USING (
    post_id IN (
      SELECT p.id FROM posts p
      WHERE p.brand_id IN (
        SELECT b.id FROM brands b
        WHERE b.user_id = auth.uid() OR
          b.organization_id IN (
            SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid()
          )
      )
    )
  );

-- ============================================
-- COMMENTS: via channel ownership
-- ============================================
CREATE POLICY "Users access comments" ON comments
  FOR ALL USING (
    channel_id IN (
      SELECT c.id FROM channels c
      WHERE c.brand_id IN (
        SELECT b.id FROM brands b
        WHERE b.user_id = auth.uid() OR
          b.organization_id IN (
            SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid()
          )
      )
    )
  );

-- ============================================
-- COMMENT REPLIES: via comment ownership
-- ============================================
CREATE POLICY "Users manage comment replies" ON comment_replies
  FOR ALL USING (
    comment_id IN (
      SELECT c.id FROM comments c
      WHERE c.channel_id IN (
        SELECT ch.id FROM channels ch
        WHERE ch.brand_id IN (
          SELECT b.id FROM brands b
          WHERE b.user_id = auth.uid() OR
            b.organization_id IN (
              SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid()
            )
        )
      )
    )
  );

-- ============================================
-- POST ANALYTICS: via post ownership
-- ============================================
CREATE POLICY "Users access analytics" ON post_analytics
  FOR ALL USING (
    post_id IN (
      SELECT p.id FROM posts p
      WHERE p.brand_id IN (
        SELECT b.id FROM brands b
        WHERE b.user_id = auth.uid() OR
          b.organization_id IN (
            SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid()
          )
      )
    )
  );

-- ============================================
-- DAILY ANALYTICS: via brand ownership
-- ============================================
CREATE POLICY "Users access daily analytics" ON daily_analytics
  FOR ALL USING (
    brand_id IN (
      SELECT b.id FROM brands b
      WHERE b.user_id = auth.uid() OR
        b.organization_id IN (
          SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid()
        )
    )
  );

-- ============================================
-- WEBHOOKS: users manage their own
-- ============================================
CREATE POLICY "Users manage webhooks" ON webhooks
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- EXPORT JOBS: via brand ownership
-- ============================================
CREATE POLICY "Users access export jobs" ON export_jobs
  FOR ALL USING (
    brand_id IN (
      SELECT b.id FROM brands b
      WHERE b.user_id = auth.uid() OR
        b.organization_id IN (
          SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid()
        )
    )
  );

-- ============================================
-- COMPETITOR PROFILES: via brand ownership
-- ============================================
CREATE POLICY "Users access competitors" ON competitor_profiles
  FOR ALL USING (
    brand_id IN (
      SELECT b.id FROM brands b
      WHERE b.user_id = auth.uid() OR
        b.organization_id IN (
          SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid()
        )
    )
  );

-- ============================================
-- COMPETITOR POSTS: via competitor profile
-- ============================================
CREATE POLICY "Users access competitor posts" ON competitor_posts
  FOR ALL USING (
    profile_id IN (
      SELECT cp.id FROM competitor_profiles cp
      WHERE cp.brand_id IN (
        SELECT b.id FROM brands b
        WHERE b.user_id = auth.uid() OR
          b.organization_id IN (
            SELECT om.organization_id FROM organization_memberships om WHERE om.user_id = auth.uid()
          )
      )
    )
  );

-- Verify all tables have RLS enabled
SELECT relname, relrowsecurity FROM pg_class WHERE relname IN (
  'users','api_keys','organizations','organization_memberships','brands',
  'channels','posts','post_channels','media_assets','post_media',
  'comments','comment_replies','post_analytics','daily_analytics',
  'webhooks','export_jobs','competitor_profiles','competitor_posts'
);
