# Google Skills Repository Analysis

**Date:** 2026-08-27
**Source:** [github.com/google/skills](https://github.com/google/skills), [github.com/googleads/google-ads-mcp](https://github.com/googleads/google-ads-mcp)

---

## Summary

Most of google/skills is GCP vendor lock-in. One category is high-value: **Google Ads MCP Server + Account Diagnostics**.

---

## 🟢 Google Ads MCP Server — High Value

**Repo:** `googleads/google-ads-mcp` (official, Apache-2.0)
**Install:** `pipx install google-ads-mcp` (Python 3.12+, stdio transport)

### 3 Tools (Read-Only)

| Tool | Purpose |
|------|---------|
| `search` | Run GAQL queries (campaigns, ad groups, keywords, metrics, conversions, impression share, etc.) |
| `get_resource_metadata` | Schema discovery — what fields exist for a resource before querying |
| `list_accessible_customers` | List all accounts under your MCC |

### 4 Resources

- Discovery document
- Metrics catalog
- Segments catalog
- Release notes

### OpenClaw Integration Config

```json
{
  "mcpServers": {
    "google-ads": {
      "command": "pipx",
      "args": ["run", "google-ads-mcp"],
      "env": {
        "GOOGLE_ADS_DEVELOPER_TOKEN": "...",
        "GOOGLE_ADS_CLIENT_ID": "...",
        "GOOGLE_ADS_CLIENT_SECRET": "...",
        "GOOGLE_ADS_REFRESH_TOKEN": "..."
      }
    }
  }
}
```

### Prerequisites

1. Google Ads Manager Account (for developer token)
2. GCP project with Google Ads API enabled
3. OAuth2 Desktop App credentials
4. Refresh token via `gcloud auth application-default login`
5. Client must grant MCC access to their account (standard agency setup)

---

## 🟢 Account Diagnostics — Product Feature

Diagnostics skill documents how to query for:

1. **Conversion loss** — by device, conversion action, date range
2. **Lost impression share** — budget-lost vs rank-lost (under-spending vs under-bidding)
3. **Low lead flow** — traffic drop vs conversion rate drop, with change_event tracking
4. **Offline upload pipeline health** — store-visit/store-sale conversions

**Product angle:** Natural-language ad diagnostics as a dashboard feature.
"Why did my leads drop this week?" → agent runs 3-4 GAQL queries → diagnosis.
Elite-tier value.

---

## 🟡 Data Manager API — Medium Value

Three skills for first-party data → ad targeting:

| Skill | Purpose |
|-------|---------|
| `data-manager-api-setup` | Connect to Google's Data Manager |
| `data-manager-api-audience-ingestion` | Push custom audiences (email lists, phone numbers) for Customer Match |
| `data-manager-api-event-ingestion` | Push conversion events (store visits, purchases, phone calls) for enhanced conversions |

**Use case:** PLEIJ booking data → conversion events → Google Ads optimized bidding.
Salon calls from Voice Agent → offline conversion uploads → Google knows which calls led to bookings.
Closes the loop between our platform and ad spend ROI.

**Blocker:** Requires Google Ads API production access (Basic Access, not just test accounts).

---

## 🔵 Genkit Agent Orchestration — Architectural Reference

Patterns worth noting:

- **Orchestrator + Sub-agents** via `agents()` middleware
- Auto-generated `delegate_to_<name>` tools for routing
- **`maxDelegations`** — hard cap on delegation depth (we don't have this)
- **`historyLength`** — middle ground between full fork and isolated (e.g., "last 4 messages")
- **`artifactStrategy`** — `'inline'` (model sees result directly) vs `'session'` (read on demand)

**Already how OpenClaw works**, but two ideas worth borrowing:
1. `maxDelegations` as a guard rail against runaway sub-agent spawns
2. `historyLength` for giving sub-agents partial context without full fork

---

## 🔵 Gemini Agents API — Not Applicable

Google's managed agent runtime on Vertex AI. MCP-first architecture validates our approach, but we self-host. Skip.

---

## Action Items

| Priority | Item | When |
|----------|------|------|
| 🟢 Now | Set up Google Ads MCP server in OpenClaw | When we have a client running Google Ads |
| 🟢 Now | Build ad diagnostics as dashboard feature | Same — product feature, not just integration |
| 🟡 Later | Data Manager API for conversion loop | After Google Ads API production access |
| 🔵 Reference | maxDelegations + historyLength patterns | Architectural backlog |

---

## Client Opportunities

- **PLEIJ:** Doesn't currently run Google Ads
- **The Salon Project (NYC):** Likely runs Google Ads — good first candidate for MCP integration + diagnostics feature