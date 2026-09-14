# AgentSocial Voice Agent — PLEIJ Salon

Self-hosted voice AI platform powered by [Dograh](https://github.com/dograh-hq/dograh) (open-source Vapi alternative).

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Customer Calls                      │
│              PLEIJ Salon Phone Number                │
└──────────────────┬──────────────────────────────────┘
                   │ Twilio / Vonage
                   ▼
┌─────────────────────────────────────────────────────┐
│              Dograh Voice Agent                      │
│  ┌─────────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  STT (Deepgram)│→│ LLM (GPT) │→│ TTS (ElevenLabs)│ │
│  └─────────────┘  └──────────┘  └───────────────┘  │
│                                                      │
│  Workflow: Greet → Qualify → Book → Transfer       │
└──────────────────┬──────────────────────────────────┘
                   │
         ┌─────────┴──────────┐
         ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│  AgentSocial API │  │  Salon Booking   │
│  (leads, CRM)    │  │  System          │
└─────────────────┘  └─────────────────┘
```

## PLEIJ Salon Agent Workflow

### Inbound Call Flow
1. **Greeting**: "Thank you for calling PLEIJ Salon! This is your AI assistant. How can I help you today?"
2. **Intent Detection**: Classify as booking, hours, services, pricing, or other
3. **Booking Flow**: Collect name, service type, preferred stylist, date/time
4. **Hours/Location**: Answer common questions (hours, address, parking)
5. **Transfer**: Escalate to human staff when needed

### Outbound Campaign Flow
- Rebooking reminders (7 days post-appointment)
- Review solicitation (3 days post-appointment)
- Special offer announcements

## Quick Start

```bash
# Start Dograh platform
cd packages/voice-agent
REGISTRY=ghcr.io/dograh-hq ENABLE_TELEMETRY=false podman-compose up -d

# Access UI at http://localhost:3010
# API at http://localhost:8000
```

## API Integration

The voice agent connects to AgentSocial's existing API for:
- **Lead capture**: Calls create leads in the CRM
- **Booking sync**: Appointments sync with salon booking system
- **Analytics**: Call metrics feed into AgentSocial dashboard
- **Campaign triggers**: Rebooking/review campaigns triggered by call outcomes

## Salon Templates (Planned)

| Template | Description | Use Case |
|----------|-------------|----------|
| salon-inbound | Receptionist agent | Handle incoming calls |
| salon-rebooking | Outbound reminder | Reduce no-shows |
| salon-review | Review solicitation | Build Google reviews |
| salon-promo | Special offers | Drive repeat visits |

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `TWILIO_ACCOUNT_SID` - Twilio account
- `TWILIO_AUTH_TOKEN` - Twilio auth
- `TWILIO_PHONE_NUMBER` - Salon's phone number
- `OPENAI_API_KEY` - LLM provider
- `DEEPGRAM_API_KEY` - Speech-to-text
- `ELEVENLABS_API_KEY` - Text-to-speech
- `AGENTSOCIAL_API_KEY` - AgentSocial backend
- `AGENTSOCIAL_API_URL` - http://localhost:3001/api/v1

## Costs (Self-Hosted)

| Component | Provider | Est. Monthly |
|-----------|----------|-------------|
| STT | Deepgram | ~$30 (5000 min) |
| LLM | OpenAI GPT-4o-mini | ~$5 |
| TTS | ElevenLabs | ~$5 |
| Telephony | Twilio | ~$15 + $0.013/min |
| Hosting | Our server | $0 (existing) |
| **Total** | | **~$55/mo for 5000 min** |

Compare: Vapi charges $0.05/min = $250/mo for same volume.