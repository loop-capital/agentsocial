# Meta Muse Connector Setup Skill

Description: Set up Meta Muse AI connector for any project. Start local server, create Cloudflare tunnel, verify connectivity.

## Steps

### 1. Check Prerequisites
- Node.js installed (`node --version`)
- Cloudflared installed (`which cloudflared`)
- Project has a `muse-connector/` directory or create one

### 2. Start Muse Server
```bash
cd /path/to/project/tools/muse-connector/
node muse-server.js &
```

### 3. Verify Local Endpoint
```bash
curl -s http://localhost:3456/muse/health
```

Expected response:
```json
{"status":"connected","version":"1.0.0","salon":"PLEIJ Salon","capabilities":["booking","availability_check","service_inquiry","pricing"]}
```

### 4. Create Public Tunnel
```bash
cloudflared tunnel --url http://localhost:3456
```

Wait for URL output (takes 10-30 seconds):
```
https://your-random-subdomain.trycloudflare.com
```

### 5. Verify Public Endpoint
```bash
curl -s https://your-subdomain.trycloudflare.com/muse/health
```

### 6. Register with Meta Muse
- Submit connector URL at https://muse.ai/platform
- Or configure in AgentSocial dashboard

## Per-Machine Setup

| Machine | Action | Command |
|---------|--------|---------|
| PC1 (Home) | Start Muse + tunnel | `node muse-server.js &` + `cloudflared tunnel --url http://localhost:3456` |
| PC2 (Office) | Start Muse + tunnel | Same as above |
| PC3 (Marcus) | Start Muse + tunnel | Same as above |

## Troubleshooting

| Error | Fix |
|-------|-----|
| Connection refused | Muse server not running — start it |
| 429 rate limit | Wait 2 minutes, retry tunnel |
| Tunnel expires | Restart cloudflared (tunnels last ~2 hours) |
| DNS not resolving | Wait 30 seconds for propagation |

## Verification Commands

```bash
# Check local
ps aux | grep muse-server

# Check tunnel
ps aux | grep cloudflared

# Test endpoints
curl http://localhost:3456/muse/health
curl https://your-tunnel.trycloudflare.com/muse/health
```
