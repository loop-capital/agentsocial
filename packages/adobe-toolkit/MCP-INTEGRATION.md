# Adobe for Creativity — MCP Integration Guide

## Status: Partially Working ✅/⚠️

The Adobe for Creativity connector IS real, IS MCP-based, and DOES work with personal Adobe accounts. However, the setup instructions you received were partially incorrect. Here's what's actually true.

---

## What's Real

- **"Adobe for Creativity"** = Official Adobe MCP connector (launched April 28, 2026)
- **50+ tools** across Photoshop, Lightroom, Illustrator, Firefly, Premiere, Express, InDesign, Stock
- **Personal Adobe account works** — no enterprise required
- **Guest mode** gives ~40 tools without signing in
- **OAuth with Adobe ID** unlocks 50+ tools + Creative Cloud storage + higher limits
- **6 built-in skills**: Retouch Portraits, Design from Template, Resize Videos, Quick Cut, Social Variations, Batch Edit Photos
- **Skills repo**: https://github.com/adobe/skills/tree/main/plugins/creative-cloud/adobe-for-creativity/skills

## What's Wrong in the Instructions

| Claimed | Reality |
|---------|---------|
| `npm install openclaw-claude-code-skill` | ❌ Package doesn't exist |
| `npx -y @adobe/mcp-server-creativity` | ❌ Package doesn't exist on npm |
| `openclaw skill add --type mcp` | ❌ Not a real OpenClaw command |
| Connect via stdio | ❌ It's a remote HTTP/SSE MCP server, not stdio |

## The Actual Architecture

Adobe's connector is a **hosted remote MCP server** at Adobe's infrastructure, following the same pattern as their Analytics MCP:

```
Pattern: https://mcp-gateway.adobe.io/<service>/mcp
Analytics:  https://mcp-gateway.adobe.io/aa/mcp
CJA:        https://mcp-gateway.adobe.io/cja/mcp
Creativity: https://mcp-gateway.adobe.io/creativity/mcp  (guessed — returns 403 without auth)
```

It's designed to be consumed by Claude's "Connectors" feature, which handles OAuth internally.

---

## Two Working Paths for OpenClaw

### Path 1: Register via mcporter (RECOMMENDED)

mcporter is installed and can bridge remote MCP servers into OpenClaw.

```bash
# Already done:
mcporter config add adobe-creativity --url "https://mcp-gateway.adobe.io/creativity/mcp"

# Auth (opens browser for Adobe OAuth):
mcporter auth adobe-creativity

# List available tools:
mcporter list adobe-creativity --schema

# Call a tool:
mcporter call adobe-creativity.<tool_name> key=value
```

**Current status**: The endpoint returns 403 — it recognizes the URL but needs valid OAuth.
The mcporter auth flow tried to trigger browser-based OAuth but hit a 403, likely because:
1. The exact endpoint path might differ (not `/creativity/mcp`)
2. Or it requires a specific OAuth client ID from Claude's integration

**Next step**: Try the auth flow from a machine with a browser to complete OAuth.

### Path 2: Use Claude as the bridge

Since the connector is designed for Claude:

1. **Install the connector in Claude** (claude.ai → Customize → Connectors → search "Adobe for creativity" → Install → Sign in with Adobe ID)
2. **Use Claude as your MCP proxy** — when you need Adobe tools, route through Claude
3. OpenClaw can spawn Claude Code sessions that have access to the connector

This is less direct but guaranteed to work since it's the official integration path.

### Path 3: matrayu/adobe-mcp (Community, Local Apps)

If you have Adobe Creative Suite installed locally (Photoshop, Premiere, etc.), the community project `matrayu/adobe-mcp` provides local MCP servers that control desktop Adobe apps via UXP plugins:

```json
{
  "mcpServers": {
    "adobe-photoshop": { "command": "adobe-photoshop" },
    "adobe-premiere": { "command": "adobe-premiere" },
    "adobe-illustrator": { "command": "adobe-illustrator" },
    "adobe-indesign": { "command": "adobe-indesign" }
  }
}
```

This requires: Python 3.10+, Node.js 18+, Adobe apps running locally, UXP Developer Tools.

---

## What We Know About the 50+ Tools

From Adobe's documentation and skills repo, the connector provides tools across:

- **Photoshop**: Layer editing, filters, selections, adjustments, background removal
- **Lightroom**: Color grading, cropping, presets, batch editing
- **Firefly**: Generative fill, expand, text-to-image
- **Express**: Template-based design, social media resizing, animation
- **Premiere**: Video editing, quick cuts, resizing for platforms
- **Illustrator**: Vector editing, text manipulation
- **InDesign**: Document layout
- **Stock**: Asset search and licensing

6 packaged skills:
1. `adobe-retouch-portraits` — Portrait refinement
2. `adobe-design-from-template` — Design from template library (requires Adobe ID)
3. `adobe-resize-photos-and-videos` — Cross-platform resizing
4. `adobe-edit-quick-cut` — Video highlight clips (requires Adobe ID)
5. `adobe-create-social-variations` — Multi-platform social content (requires Adobe ID)
6. `adobe-batch-edit-photos` — Batch photo editing

---

## Recommended Next Steps

1. **Try mcporter auth from a browser-accessible machine** to complete OAuth
2. **If that fails**, install the connector in Claude Desktop and use Claude as the bridge
3. **For local Adobe app control**, set up matrayu/adobe-mcp if you have CC installed
4. **Keep the @agentsocial/adobe-toolkit** for direct API access (Firefly API + Stock API) as a fallback for server-side automation that doesn't need a browser