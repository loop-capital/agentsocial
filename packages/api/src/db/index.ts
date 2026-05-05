import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/agentsocial";

// Enable SSL for remote connections (Supabase requires it)
const isRemote = connectionString.includes("supabase") || connectionString.includes("pooler");

export const pool = new pg.Pool({ 
  connectionString,
  ...(isRemote ? { ssl: { rejectUnauthorized: false } } : {}),
  connectionTimeoutMillis: 15000,
  query_timeout: 30000,
});

export const db = drizzle(pool, { schema });

export { schema };

// Re-export schema tables for convenience
export const {
  users,
  apiKeys,
  organizations,
  organizationMemberships,
  brands,
  channels,
  posts,
  postChannels,
  postMedia,
  mediaAssets,
  comments,
  commentReplies,
  postAnalytics,
  dailyAnalytics,
  webhooks,
  exportJobs,
  competitorProfiles,
  competitorPosts,
} = schema;