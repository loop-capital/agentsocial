#!/bin/bash
# ───────────────────────────────────────────────────────────────
# AgentSocial Cloud — Provision a new client instance
# Usage: ./provision.sh <client_name> <client_domain> <hetzner_token>
# Example: ./provision.sh pleij pleij.clawstudio.co $HETZNER_TOKEN
# ───────────────────────────────────────────────────────────────
set -euo pipefail

CLIENT_NAME="${1:?Usage: provision.sh <client_name> <client_domain> <hetzner_token>}"
CLIENT_DOMAIN="${2:?Missing client_domain}"
HETZNER_TOKEN="${3:?Missing hetzner_token}"

# ─── Config ─────────────────────────────────────────────────────
VPS_TYPE="${VPS_TYPE:=cx22}"          # cx22=4GB $7, cx32=8GB $14
VPS_LOCATION="${VPS_LOCATION:=ash}"   # ash=Ashburn VA
SSH_KEY_NAME="${SSH_KEY_NAME:=agentsocial}"
IMAGE="ubuntu-24.04"

# ─── Colors ─────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ─── Step 1: Create VPS ─────────────────────────────────────────
info "Creating Hetzner VPS for ${CLIENT_NAME}..."

CREATE_RESPONSE=$(curl -s -X POST "https://api.hetzner.cloud/v1/servers" \
  -H "Authorization: Bearer ${HETZNER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "'"${CLIENT_NAME}"'",
    "server_type": "'"${VPS_TYPE}"'",
    "location": "'"${VPS_LOCATION}"'",
    "image": "'"${IMAGE}"'",
    "ssh_keys": ["'"${SSH_KEY_NAME}"'"],
    "labels": {
      "app": "agentsocial",
      "client": "'"${CLIENT_NAME}"'",
      "managed": "true"
    },
    "user_data": "'"#cloud-config\npackages:\n  - curl\n  - git\n  - python3\n\nruncmd:\n  - mkdir -p /opt/agentsocial\n"'"
  ')

SERVER_ID=$(echo "$CREATE_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['server']['id'])" 2>/dev/null || echo "")
SERVER_IP=$(echo "$CREATE_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['server']['public_net']['ipv4']['ip'])" 2>/dev/null || echo "")

if [ -z "$SERVER_ID" ] || [ -z "$SERVER_IP" ]; then
  error "Failed to create VPS. Response: ${CREATE_RESPONSE}"
fi

info "VPS created: ID=${SERVER_ID}, IP=${SERVER_IP}"

# ─── Step 2: Wait for SSH ───────────────────────────────────────
info "Waiting for SSH to be available..."
for i in $(seq 1 30); do
  if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@${SERVER_IP} echo "SSH OK" 2>/dev/null; then
    break
  fi
  info "Attempt $i/30: Waiting for SSH..."
  sleep 10
done

# ─── Step 3: DNS ────────────────────────────────────────────────
info "Creating DNS record for ${CLIENT_DOMAIN}..."
info "Add this DNS record manually if not using Hetzner DNS:"
info "  A record: ${CLIENT_DOMAIN} → ${SERVER_IP}"

# ─── Step 4: Generate .env ──────────────────────────────────────
info "Generating environment file..."
ENV_FILE="infra/.env.${CLIENT_NAME}"
cp infra/.env.example "$ENV_FILE"

# Generate secure passwords
PG_PASS=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)
REDIS_PASS=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)
JWT_SECRET=$(openssl rand -base64 48 | tr -d '/+=' | head -c 64)
MINIO_SECRET=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)

sed -i "s/CLIENT_DOMAIN=.*/CLIENT_DOMAIN=${CLIENT_DOMAIN}/" "$ENV_FILE"
sed -i "s/CLIENT_NAME=.*/CLIENT_NAME=${CLIENT_NAME}/" "$ENV_FILE"
sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=${PG_PASS}/" "$ENV_FILE"
sed -i "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=${REDIS_PASS}/" "$ENV_FILE"
sed -i "s/JWT_SECRET=.*/JWT_SECRET=${JWT_SECRET}/" "$ENV_FILE"
sed -i "s/MINIO_SECRET_KEY=.*/MINIO_SECRET_KEY=${MINIO_SECRET}/" "$ENV_FILE"

info "Environment file saved: ${ENV_FILE}"

# ─── Step 5: Create Ansible inventory ────────────────────────────
info "Creating Ansible inventory..."
cat > infra/ansible/inventory.yml <<EOF
all:
  hosts:
    ${CLIENT_NAME}:
      ansible_host: ${SERVER_IP}
      ansible_user: root
      ansible_ssh_common_args: -o StrictHostKeyChecking=no
  vars:
    client_domain: ${CLIENT_DOMAIN}
    client_name: ${CLIENT_NAME}
    env_file: ../.env.${CLIENT_NAME}
EOF

# ─── Step 6: Run Ansible ────────────────────────────────────────
info "Running Ansible provisioning playbook..."
cd infra/ansible
ansible-playbook -i inventory.yml provision.yml \
  -e "client_domain=${CLIENT_DOMAIN}" \
  -e "client_name=${CLIENT_NAME}" \
  -e "env_file=../.env.${CLIENT_NAME}"
cd ../..

# ─── Done ───────────────────────────────────────────────────────
echo ""
info "═══════════════════════════════════════════════════════"
info "  AgentSocial Cloud — Client Provisioned!"
info "═══════════════════════════════════════════════════════"
info ""
info "  Client:    ${CLIENT_NAME}"
info "  Domain:    ${CLIENT_DOMAIN}"
info "  VPS IP:    ${SERVER_IP}"
info "  VPS ID:    ${SERVER_ID}"
info "  VPS Type:  ${VPS_TYPE}"
info ""
info "  URLs:"
info "    App:    https://${CLIENT_DOMAIN}/app"
info "    API:    https://${CLIENT_DOMAIN}/api/v1"
info "    Voice:  https://${CLIENT_DOMAIN}/voice"
info ""
info "  Next steps:"
info "    1. Point DNS: A record ${CLIENT_DOMAIN} → ${SERVER_IP}"
info "    2. Wait for SSL cert (auto via Caddy)"
info "    3. Configure voice agent at https://${CLIENT_DOMAIN}/voice"
info "    4. Set up Twilio webhook to https://${CLIENT_DOMAIN}/voice-api/api/v1/voice/webhook/twilio"
info ""
info "  Credentials saved to: ${ENV_FILE}"
info "═══════════════════════════════════════════════════════"