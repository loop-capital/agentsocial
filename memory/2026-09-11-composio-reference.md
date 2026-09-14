# COMPOSIO — COMPLETE FUNCTIONAL REFERENCE
<!-- Saved 2026-09-11 from direct reading of SKILL.md + all reference docs -->

## What Composio IS
Composio is a CLI tool that connects OpenClaw to 1,000+ external apps (Gmail, GitHub, Slack, Notion, Salesforce, Adobe Firefly, etc.) via OAuth. It handles tool discovery, account connections, live schemas, and execution.

## What Composio is NOT
- Not for local files, shell commands, browser, or public web search (use native OpenClaw for those)
- Not a standalone CLI you run directly — it's a skill that provides routing and operating policy

## How It Works
1. **Plugin**: Installed via `openclaw plugins install clawhub:@composio/composio` then `openclaw plugins enable composio`
2. **Skill**: The bundled skill (`~/.openclaw/plugin-skills/composio/SKILL.md`) provides routing rules and safety policies
3. **CLI Binary**: Must be installed separately and be >= v0.4.0. Lives wherever the executor puts it (could be ~/.local/bin, /usr/local/bin, etc.)
4. **Authentication**: Each app connection is done via `composio link <toolkit>` which generates an OAuth URL for the user to click and log in directly
5. **Execution**: `composio execute <SLUG> -d '<json>'` runs tools, `composio proxy` calls authenticated APIs when no dedicated tool exists

## Key Commands (from workflow.md)
- `composio execute <SLUG> -d '<json>'` — Run a known tool
- `composio tools list <toolkit>` — List tools for a known app
- `composio search "<task>" --limit 3` — Find tools by description
- `composio link <toolkit>` — Connect/authenticate an app (generates OAuth URL)
- `composio execute --parallel` — Run independent calls simultaneously
- `composio run --file ./workflow.ts` — Run reviewed scripts
- `composio proxy <url> --toolkit <name> --method GET` — Call authenticated API directly
- `composio connections list` — List connected accounts

## Critical Rules (from SKILL.md + safety.md)
- ALWAYS check `command -v composio`, `composio --version`, `composio whoami` BEFORE first operation
- Version MUST be >= 0.4.0
- `composio execute` REQUIRES `-d` flag (never wait on stdin)
- `composio proxy` stdin must be redirected from /dev/null unless passing -d -
- Judge success by `successful` field in JSON output, NOT exit code
- NEVER share API keys, OAuth codes, or credentials in chat
- NEVER use `--skip-checks` or bypass flags
- Auth URLs are sensitive — share only with trusted operator in private context
- `--no-skill-install` flag on EVERY login path (plugin already supplies the skill)
- For headless auth: `composio login --no-browser --no-wait --no-skill-install` then `composio login --poll --no-skill-install`

## App Discovery Flow
When user says "connect my Adobe account":
1. Check composio is working (command -v, --version, whoami)
2. Run `composio link adobe` or `composio link adobe.firefly`
3. Composio generates an OAuth URL
4. Share the URL privately with the user
5. User clicks the URL, logs into Adobe, authorizes
6. Run `composio whoami` to confirm connection
7. Now all Adobe/Firefly tools are available via `composio execute`

## For AgentSocial
Adobe Firefly toolkit will be available after linking. Can generate images, graphics, social media content programmatically.