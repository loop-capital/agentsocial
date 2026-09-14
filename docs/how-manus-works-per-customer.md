# How Manus/Meta Integration Works Per Customer in AgentSocial

## Overview
Each AgentSocial customer (workspace) gets their own isolated connection to Meta's Manus capabilities with individual credit tracking, ensuring fair usage and data privacy.

## The Per-Workspace Architecture

### **1. Workspace-Level Isolation**
Every AgentSocial customer gets a unique workspace record:
```sql
-- One row per customer/team in workspaces table
INSERT INTO workspaces (id, name, meta_business_account_id, meta_phone_number_id)
VALUES 
  ('workspace-a-uuid', 'FitLife Gym', '123456789', '987654321'),
  ('workspace-b-uuid', 'Bella Boutique', '987654321', '123456789');
```

### **2. Individual Meta Account Connection**
Each workspace connects to **their own** Meta/Facebook account:
- Workspace A connects to FitLife Gym's Facebook account
- Workspace B connects to Bella Boutique's Facebook account
- Each connection generates a **separate** user access token
- Tokens are encrypted and stored per workspace:
  - `encrypted_meta_token_workspace_a`
  - `encrypted_meta_token_workspace_b`

### **3. Per-Workspace Credit Tracking**
Credits are tracked independently in `manus_usage_daily`:
```sql
-- Daily credits for Workspace A (FitLife Gym)
INSERT INTO manus_usage_daily 
  (workspace_id, usage_date, credits_consumed, credits_remaining, daily_credit_limit)
VALUES
  ('workspace-a-uuid', '2026-04-18', 150, 1150, 300);  -- Used 150 of 300 daily

-- Daily credits for Workspace B (Bella Boutique) 
INSERT INTO manus_usage_daily
  ('workspace-b-uuid', '2026-04-18', 100, 1200, 300);  -- Used 100 of 300 daily
```

### **4. Request Flow: How It Works Per Customer**

**When FitLife Gym (Workspace A) requests a trend scan:**
1. User clicks "Scan Fitness Trends" in Website Builder
2. Request hits `/api/manus/trend-scan` endpoint
3. System identifies request came from Workspace A (via auth/session)
4. System retrieves Workspace A's **encrypted Meta token** from database
5. System decrypts token and uses it to call Meta Graph API
6. Meta responds with trend data (using Workspace A's token)
7. System increments Workspace A's `credits_consumed` in `manus_usage_daily`
8. System returns trend data to FitLife Gym's UI
9. Workspace B's credits and data remain completely unaffected

**When Bella Boutique (Workspace B) requests copy optimization:**
1. Same process, but using Workspace B's token
2. Credits deducted from Workspace B's balance only
3. No interaction with Workspace A's data or credits

### **5. Token Management Per Workspace**

**Initial Connection (OAuth Flow):**
1. User clicks "Connect Meta Account" in Settings
2. Redirects to Facebook Login with AgentSocial's app ID
3. User logs in with **their own** Facebook credentials
4. User grants permissions to **their own** account
5. Facebook returns authorization code to AgentSocial
6. Backend exchanges code for **user access token** (starts with EAAB...)
7. Token encrypted and stored in that workspace's record only
6. System also stores workspace's `meta_business_account_id`, etc.

**Token Refresh & Rotation:**
- Each workspace's token managed independently
- Short-lived tokens (~2 hrs) automatically refreshed using long-lived tokens or refresh flow
- If refresh fails: Only that workspace sees "Reconnect Meta Account" prompt
- Other workspaces continue unaffected

### **6. Cache Isolation**

Cached insights are **workspace-specific**:
```sql
-- manus_cache table includes workspace_id in primary key
INSERT INTO manus_cache
  (workspace_id, cache_key, cache_value, expires_at)
VALUES
  ('workspace-a-uuid', 'trends:fitness:us:week', '{...}', '2026-04-18 22:00:00'),
  ('workspace-b-uuid', 'trends:fashion:us:week', '{...}', '2026-04-18 22:00:00');
```
- Workspace A's fitness trends cache not accessible to Workspace B
- Prevents cross-contamination of insights
- Allows different caching strategies per vertical/usage patterns

### **7. Usage Limits & Quotas Per Workspace**

Each workspace gets Meta's standard free tier:
- **1,000 initial credits** (one-time bonus)
- **300 credits daily** (&contact us for exact numbers as these may vary)
- Tracked in `manus_usage_daily.daily_credit_limit` and `monthly_credit_limit`

**Example Daily Reset:**
At midnight UTC:
- Workspace A: `credits_remaining` reset to 1,300 (1,000 + 300)
- Workspace B: `credits_remaining` reset to 1,300
- Each workspace's quota replenished independently

### **8. Error Isolation**

Failures are contained to the affected workspace:
- If Workspace A's token expires: Only they see reconnect prompt
- If Workspace B hits rate limit (429): Only they get throttled/filtered
- Meta API downtime: Only impacts workspaces trying to call at that moment
- Other workspaces continue using their own tokens/normally

### **9. Privacy & Data Separation Guarantees**

**What we do NOT do:**
- ❌ Share tokens between workspaces
- ❌ Mix query results or cache entries
- ❌ Allow one workspace to see another's credits/usage
- ❌ Send Workspace A's data using Workspace B's token (or vice versa)
- ❌ Store raw Meta API responses containing PII or user-generated data

**What we DO do:**
- ✅ Encrypt tokens per workspace with separate encryption context
- ✅ Scope all database queries by `workspace_id`
- ✅ Include `workspace_id` in cache keys
- ✅ Make Meta API calls using only the requesting workspace's token
- ✅ Store only anonymized, aggregated insights (no user data)
- ✅ Log access with workspace ID for audit trails

### **10. Customer Experience: What They See**

In the AgentSocial UI for **each individual customer**:

**Settings → Integrations:**
- Status: "Meta Account: Connected" (or "Disconnected")
- Button: "Reconnect Meta Account" (if needed)
- Note: "Connect your Facebook/Meta account to access trend scanning and copy optimization"

**Usage Dashboard (if shown):**
```
Meta Insights Usage Today
• Credits Used: 145 / 300 daily
• Credits Remaining: 155
• Credits Reset: Midnight UTC (in 4h 22m)
• Initial Bonus: 1,000/1,000 used
```

**Feature Usage:**
- Website Builder: "Get Meta-Optimized Copy" button (shows "(Cost: ~100 credits)" on hover)
- Ad Creator: "Optimize for Meta Platforms" toggle (default: OFF for privacy)
- Analytics Panel: "Scan Current Trends" button with vertical selector

**Notifications:**
- Toast: "You've used 80% of your daily Meta insights credits" (per workspace)
- Toast: "Your Meta insights credits will reset at midnight UTC" (per workspace)
- Inline: "Using standard AI insights (Meta insights unavailable until credits reset)" when quota exhausted

### **11. Scaling & Multi-Tenant Considerations**

**How this scales to 10,000+ customers:**
- **Database Rows**: 
  - `workspaces`: 1 row per customer
  - `manus_usage_daily`: 1 row per customer per day
  - `manus_cache`: Variable rows per customer based on usage
- **API Requests**: Each request includes workspace context (from auth/session)
- **Token Storage**: Encrypted tokens stored per workspace (O(n) storage)
- **Processing**: Each request handled independently (no shared state)
- **Costs**: 
  - Infrastructure scales with request volume (standard web app economics)
  - Meta API costs: $0 per customer (uses their free tier)
  - No per-customer licensing fees to Meta

**Optimizations:**
- Read replicas for `workspaces` and `manus_usage_daily` lookups
- Caching of non-sensitive workspace metadata (name, status, etc.)
- Batch processing for midnight UTC reset jobs
- Archive old usage data (>90 days) to reduce table size

### **12. Implementation Summary**

**For each new AgentSocial customer:**
1. Create workspace record (`workspaces` table)
2. Provide "Connect Meta Account" UI in settings
3. On connection: 
   - Perform OAuth flow with Facebook
   - Encrypt and store resulting user access token
   - Store associated IDs (business account, phone number, user ID)
4. Initialize daily credit tracking (`manus_usage_daily` for today)
5. Route all Meta API requests through secure wrapper using that workspace's token
6. Track usage against that workspace's daily/monthly limits
7. Provide per-workspace usage dashboard and controls
8. Handle token refresh, errors, and quota notifications per workspace

**Result:** Each customer gets a seamless experience where they feel like they're getting native Meta insights built into AgentSocial, while actually using their own Meta account and free tier credits—with zero data leakage or cross-customer impact.

## ✅ **The Bottom Line**

This per-workspace architecture ensures that:
- 🔐 **Security**: Each customer's Meta token is isolated and encrypted
- ⚖️ **Fairness**: Each customer gets their own free tier credits from Meta
- 🔒 **Privacy**: No data sharing or cross-contamination between customers
- 📊 **Transparency**: Each customer sees only their own usage and status
- 🛠️ **Reliability**: Failures are isolated to the affected workspace
- 📈 **Scalability**: The system scales linearly with customer count
- 💰 **Cost-Effectiveness**: Leverages Meta's free tier per customer—no extra cost to us or them

Customers simply connect their Facebook/Meta account once and then enjoy Manus-powered features like trend scanning and copy optimization, with automatic credit management and graceful fallback to local LLM when needed—all without needing to understand the underlying API complexity or quota tracking.

Would you like me to show you the exact SQL schema for the tables involved, or walk through a specific code example of how the Meta API wrapper retrieves and uses a workspace's token?