# AgentSocial Adobe Firefly MCP Setup

## Date: 2026-09-11

## What Changed
- **Previous approach**: Composio CLI (dead for Firefly)
- **New approach**: `adobe-firefly-mcp` browser automation via MCP server

## Installation Steps

1. **Install MCP server**: `npm install -g adobe-firefly-mcp`
2. **Install Playwright browsers**: `npx playwright install chromium` (downloaded v1243)
3. **Create WSLg wrapper**: `/tmp/firefly-mcp-wrapper.sh`
   ```bash
   #!/bin/bash
   export DISPLAY=:0
   export PULSE_SERVER=/mnt/wslg/PulseServer
   export WAYLAND_DISPLAY=wayland-0
   export XDG_RUNTIME_DIR=/mnt/wslg/runtime-dir
   exec adobe-firefly-mcp "$@"
   ```
4. **Configure OpenClaw**: Updated `~/.openclaw/openclaw.json` with MCP server entry

## Status
- MCP Server: ✅ Running (version from npm)
- Browser: ✅ Opens via WSLg on Windows desktop
- Adobe Auth: ✅ Logged in as `clawstudioai@outlook.com`
- Tools Available:
  - `firefly_generate` — prompt-to-image
  - `firefly_generate_video` — prompt-to-video
  - `firefly_variations` — upload image variations
  - `firefly_expand` — generative expand/outpaint
  - `firefly_remove_background` — remove background

## Known Issues
- Image generation timed out during first test (prompt submitted but results didn't appear in time)
- May need to increase MCP tool timeout or retry mechanism

## Composio Status (for other toolkits)
- Composio CLI v0.4.1: ✅ Installed and authenticated
- Works for: Gmail, GitHub, Slack, etc. (just not Firefly)
