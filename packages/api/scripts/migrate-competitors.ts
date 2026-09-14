import "dotenv/config";
import { pool } from "../src/db/index.js";

const SQL = `
CREATE TABLE IF NOT EXISTS "competitor_profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "brand_id" uuid NOT NULL REFERENCES "brands"("id") ON DELETE cascade,
  "platform" text NOT NULL,
  "handle" text NOT NULL,
  "display_name" text,
  "avatar_url" text,
  "bio" text,
  "follower_count" integer DEFAULT 0 NOT NULL,
  "following_count" integer DEFAULT 0 NOT NULL,
  "post_count" integer DEFAULT 0 NOT NULL,
  "engagement_rate" integer,
  "profile_url" text,
  "last_fetched_at" timestamp with time zone,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "competitor_posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "profile_id" uuid NOT NULL REFERENCES "competitor_profiles"("id") ON DELETE cascade,
  "external_id" text NOT NULL,
  "content" text,
  "media_urls" text[],
  "post_type" text DEFAULT 'standard' NOT NULL,
  "published_at" timestamp with time zone,
  "likes" integer DEFAULT 0 NOT NULL,
  "comments" integer DEFAULT 0 NOT NULL,
  "shares" integer DEFAULT 0 NOT NULL,
  "views" integer DEFAULT 0 NOT NULL,
  "engagement_rate" integer,
  "hashtags" text[],
  "mentions" text[],
  "url" text,
  "fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "competitor_profiles_brand_id_idx" ON "competitor_profiles"("brand_id");
CREATE INDEX IF NOT EXISTS "competitor_posts_profile_id_idx" ON "competitor_posts"("profile_id");
`;

async function main() {
  try {
    await pool.query(SQL);
    console.log("✅ Competitor tables created successfully");

    // Verify
    const { rows } = await pool.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'competitor%' ORDER BY tablename"
    );
    console.log("Tables:", rows.map((r: any) => r.tablename).join(", "));
  } catch (err: any) {
    console.error("❌ Migration failed:", err.message);
    console.error(err.stack);
  } finally {
    await pool.end();
  }
}

main();