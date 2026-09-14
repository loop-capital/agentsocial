#!/bin/bash
# PLEIJ Salon Voice Agent - Setup Script
# Deploys Dograh + configures the PLEIJ Salon voice agent

set -e

echo "🎙️ AgentSocial Voice Agent Setup — PLEIJ Salon"
echo "================================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Check prerequisites
echo ""
echo "📋 Checking prerequisites..."

command -v podman &>/dev/null && echo "  ✅ podman" || { echo -e "  ${RED}❌ podman not found${NC}"; exit 1; }
command -v podman-compose &>/dev/null && echo "  ✅ podman-compose" || { echo -e "  ${RED}❌ podman-compose not found${NC}"; exit 1; }
command -v node &>/dev/null && echo "  ✅ node" || { echo -e "  ${YELLOW}⚠️  node not found (needed for integration server)${NC}"; }

# Copy .env if needed
if [ ! -f .env ]; then
  echo ""
  echo "📝 Creating .env from .env.example..."
  cp .env.example .env
  echo -e "  ${YELLOW}⚠️  Edit .env with your API keys before continuing!${NC}"
  echo "  Key keys needed:"
  echo "    - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER"
  echo "    - OPENAI_API_KEY"
  echo "    - DEEPGRAM_API_KEY"
  echo "    - ELEVENLABS_API_KEY"
  echo ""
  read -p "Press Enter after editing .env, or Ctrl+C to abort..."
fi

# Start Dograh
echo ""
echo "🐳 Starting Dograh platform..."
export REGISTRY=ghcr.io/dograh-hq
export ENABLE_TELEMETRY=false
podman-compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
for i in {1..30}; do
  if curl -s http://localhost:8000/api/v1/health &>/dev/null; then
    echo -e "  ${GREEN}✅ Dograh API is up!${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "  ${RED}❌ Dograh API failed to start. Check logs: podman-compose logs api${NC}"
    exit 1
  fi
  sleep 5
  echo "  Waiting... ($i/30)"
done

echo ""
echo "✨ Dograh is running!"
echo "  📊 Dashboard: http://localhost:3010"
echo "  🔌 API: http://localhost:8000"
echo ""
echo "🎯 Next Steps:"
echo "  1. Open http://localhost:3010 in your browser"
echo "  2. Create an account"
echo "  3. Create a new Inbound agent named 'PLEIJ Salon Receptionist'"
echo "  4. Copy the PLEIJ Salon workflow prompt from src/workflows/pleij-salon.ts"
echo "  5. Configure STT (Deepgram), LLM (OpenAI), TTS (ElevenLabs)"
echo "  6. Add Twilio telephony for phone calls"
echo "  7. Test with a web call first!"
echo ""
echo "📞 For Twilio setup:"
echo "  1. Buy a phone number in Twilio"
echo "  2. Set webhook URL to: https://your-domain.com/webhooks/twilio/voice"
echo "  3. Configure in Dograh UI under Telephony settings"
echo ""
echo "💰 Estimated monthly costs for PLEIJ Salon (~500 calls/mo):"
echo "  Deepgram STT:  ~$3"
echo "  OpenAI LLM:    ~$2"
echo "  ElevenLabs TTS: ~$3"
echo "  Twilio:        ~$7 + $0.013/min"
echo "  Dograh:        $0 (self-hosted)"
echo "  ──────────────────────────"
echo "  Total:         ~$15/mo"
echo ""
echo "  (Compare: Vapi would charge $25/mo for same volume on usage tier)"