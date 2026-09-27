# Meta Muse Connector for AgentSocial Salons

## What This Is
Connector configuration for Meta Muse AI agent to interact with AgentSocial salon systems.

## How Muse Connects
Muse uses connectors to interact with businesses:
- Built-in connectors (limited availability)
- Custom connectors via API credentials
- Browser-based fallback (no API needed)

## Connector Setup

### Option 1: Browser-Based (Recommended for now)
Muse can browse your salon's web interface directly:
- Muse visits your salon website
- Fills out booking forms
- Checks availability
- No API needed

### Option 2: Custom Connector (Future)
Submit connector at: https://muse.ai/platform
Requires:
- API endpoint documentation
- Authentication flow
- Webhook support

## For PLEIJ Salon

### Current Setup
- Website: https://pleijsalon.com
- Booking: Via website or phone
- Hours: Mon-Sat 9am-7pm

### Muse Capabilities
- Browse services and pricing
- Check stylist availability
- Book appointments
- Get directions
- Ask questions about services

## Configuration
See `pleij-salon.json` for connector config.
