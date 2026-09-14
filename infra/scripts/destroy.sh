#!/bin/bash
# ───────────────────────────────────────────────────────────────
# AgentSocial Cloud — Destroy a client instance
# Usage: ./destroy.sh <client_name> <hetzner_token>
# WARNING: This deletes the VPS and all data permanently!
# ───────────────────────────────────────────────────────────────
set -euo pipefail

CLIENT_NAME="${1:?Usage: destroy.sh <client_name> <hetzner_token>}"
HETZNER_TOKEN="${2:?Missing hetzner_token}"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ─── Find Server ─────────────────────────────────────────────────
info "Looking up server for ${CLIENT_NAME}..."

SERVERS=$(curl -s "https://api.hetzner.cloud/v1/servers?label_selector=client==${CLIENT_NAME}" \
  -H "Authorization: Bearer ${HETZNER_TOKEN}")

SERVER_ID=$(echo "$SERVERS" | python3 -c "import sys,json; servers=json.load(sys.stdin)['servers']; print(servers[0]['id'] if servers else '')" 2>/dev/null || echo "")
SERVER_IP=$(echo "$SERVERS" | python3 -c "import sys,json; servers=json.load(sys.stdin)['servers']; print(servers[0]['public_net']['ipv4']['ip'] if servers else '')" 2>/dev/null || echo "")

if [ -z "$SERVER_ID" ]; then
  error "No server found for client '${CLIENT_NAME}'"
  exit 1
fi

# ─── Confirm ─────────────────────────────────────────────────────
echo -e "${RED}⚠️  WARNING: This will permanently delete the VPS and all data!${NC}"
echo -e "${RED}   Client: ${CLIENT_NAME}${NC}"
echo -e "${RED}   Server ID: ${SERVER_ID}${NC}"
echo -e "${RED}   IP: ${SERVER_IP}${NC}"
echo ""
read -p "Type '${CLIENT_NAME}' to confirm deletion: " CONFIRM

if [ "$CONFIRM" != "$CLIENT_NAME" ]; then
  info "Deletion cancelled."
  exit 0
fi

# ─── Optional: Backup DB ─────────────────────────────────────────
info "Creating final database backup before deletion..."
ssh -o StrictHostKeyChecking=no root@${SERVER_IP} "cd /opt/agentsocial && docker exec postgres pg_dumpall -U agentsocial" > "backups/${CLIENT_NAME}_final_$(date +%Y%m%d).sql" 2>/dev/null || warn "Could not create backup (server may be down)"

# ─── Delete VPS ──────────────────────────────────────────────────
info "Deleting VPS ${SERVER_ID}..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "https://api.hetzner.cloud/v1/servers/${SERVER_ID}" \
  -H "Authorization: Bearer ${HETZNER_TOKEN}")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
  info "VPS deleted successfully."
else
  error "Failed to delete VPS (HTTP ${HTTP_CODE})"
fi

# ─── Clean up local files ─────────────────────────────────────────
rm -f "infra/.env.${CLIENT_NAME}"
rm -f "infra/ansible/inventory.yml"

info "Local config files cleaned up."
info "Remember to remove DNS record for ${CLIENT_NAME}.clawstudio.co"