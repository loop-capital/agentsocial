#!/bin/bash
# ───────────────────────────────────────────────────────────────
# AgentSocial Cloud — Health Check & Status Dashboard
# Usage: ./status.sh [client_name]
# ───────────────────────────────────────────────────────────────
set -euo pipefail

CLIENT_NAME="${1:-}"

HETZNER_TOKEN="${HETZNER_TOKEN:?Set HETZNER_TOKEN env var}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; }
warn() { echo -e "  ${YELLOW}!${NC} $1"; }

# ─── List or Check ───────────────────────────────────────────────
if [ -z "$CLIENT_NAME" ]; then
  # List all AgentSocial servers
  echo -e "${CYAN}═══ AgentSocial Cloud — All Instances ═══${NC}"
  SERVERS=$(curl -s "https://api.hetzner.cloud/v1/servers?label_selector=app==agentsocial" \
    -H "Authorization: Bearer ${HETZNER_TOKEN}")
  
  echo "$SERVERS" | python3 -c "
import sys, json
data = json.load(sys.stdin)
servers = data.get('servers', [])
if not servers:
    print('  No instances found.')
else:
    print(f\"  {'Name':<15} {'IP':<16} {'Type':<8} {'Status':<10} {'Created':<12}\")
    print(f\"  {'─'*15} {'─'*16} {'─'*8} {'─'*10} {'─'*12}\")
    for s in servers:
        ip = s['public_net']['ipv4']['ip'] if s['public_net']['ipv4'] else 'N/A'
        print(f\"  {s['name']:<15} {ip:<16} {s['server_type']['name']:<8} {s['status']:<10} {s['created'][:10]:<12}\")
"
  exit 0
fi

# ─── Check Specific Client ─────────────────────────────────────────
echo -e "${CYAN}═══ AgentSocial Cloud — ${CLIENT_NAME} Status ═══${NC}"

SERVERS=$(curl -s "https://api.hetzner.cloud/v1/servers?label_selector=client==${CLIENT_NAME}" \
  -H "Authorization: Bearer ${HETZNER_TOKEN}")

SERVER_IP=$(echo "$SERVERS" | python3 -c "import sys,json; s=json.load(sys.stdin)['servers']; print(s[0]['public_net']['ipv4']['ip'] if s else '')" 2>/dev/null)

if [ -z "$SERVER_IP" ]; then
  fail "No server found for client '${CLIENT_NAME}'"
  exit 1
fi

# VPS Status
echo ""
echo "VPS:"
ok "IP: ${SERVER_IP}"

# Health Checks
echo ""
echo "Services:"

# API
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://${SERVER_IP}:3001/health" 2>/dev/null || echo "000")
if [ "$API_STATUS" = "200" ]; then
  ok "API (port 3001)"
else
  fail "API (port 3001) — HTTP ${API_STATUS}"
fi

# Web
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://${SERVER_IP}:3000" 2>/dev/null || echo "000")
if [ "$WEB_STATUS" = "200" ] || [ "$WEB_STATUS" = "301" ]; then
  ok "Web (port 3000)"
else
  fail "Web (port 3000) — HTTP ${WEB_STATUS}"
fi

# Dograh
DOGRAH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://${SERVER_IP}:8010/api/v1/health" 2>/dev/null || echo "000")
if [ "$DOGRAH_STATUS" = "200" ]; then
  ok "Voice Agent (port 8010)"
else
  fail "Voice Agent (port 8010) — HTTP ${DOGRAH_STATUS}"
fi

# Dograh UI
UI_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://${SERVER_IP}:3020" 2>/dev/null || echo "000")
if [ "$UI_STATUS" = "200" ] || [ "$UI_STATUS" = "301" ]; then
  ok "Voice Dashboard (port 3020)"
else
  fail "Voice Dashboard (port 3020) — HTTP ${UI_STATUS}"
fi

# Disk Usage
echo ""
echo "Resources:"
DISK=$(ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@${SERVER_IP} "df -h / | tail -1 | awk '{print \$5}'" 2>/dev/null || echo "N/A")
ok "Disk: ${DISK} used"

MEM=$(ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@${SERVER_IP} "free -m | grep Mem | awk '{printf \"%d/%d MB (%.0f%%)\", \$3, \$2, \$3*100/\$2}'" 2>/dev/null || echo "N/A")
ok "RAM: ${MEM}"

DOCKER=$(ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@${SERVER_IP} "docker ps --format '{{.Names}}\t{{.Status}}' 2>/dev/null | head -10" || echo "N/A")
if [ "$DOCKER" != "N/A" ]; then
  echo "$DOCKER" | while IFS=$'\t' read -r name status; do
    if echo "$status" | grep -q "Up"; then
      ok "Container: ${name} (${status})"
    else
      fail "Container: ${name} (${status})"
    fi
  done
fi

echo ""
echo -e "${CYAN}════════════════════════════════════════${NC}"