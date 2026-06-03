-- GetUpLook Professional Profiles
-- Public-facing SEO profile pages for businesses on GetUpLook.com

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  business_name text NOT NULL,
  category text NOT NULL,
  description text,
  phone text,
  email text,
  website_url text,
  address text,
  city text,
  state text,
  zip text,
  latitude double precision,
  longitude double precision,
  hours jsonb DEFAULT '{}',
  photos jsonb DEFAULT '[]',
  services jsonb DEFAULT '[]',
  rating_avg double precision DEFAULT 0,
  review_count integer DEFAULT 0,
  theme text NOT NULL DEFAULT 'modern',
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Unique slug index (already unique from constraint, but explicit for lookups)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_slug_idx ON profiles(slug);

-- Category browsing
CREATE INDEX IF NOT EXISTS profiles_category_idx ON profiles(category) WHERE is_published = true;

-- City+state location lookups
CREATE INDEX IF NOT EXISTS profiles_city_state_idx ON profiles(city, state) WHERE is_published = true;

-- Published filter
CREATE INDEX IF NOT EXISTS profiles_is_published_idx ON profiles(is_published) WHERE is_published = true;

-- Brand FK lookup
CREATE INDEX IF NOT EXISTS profiles_brand_id_idx ON profiles(brand_id);