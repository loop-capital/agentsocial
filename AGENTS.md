## Reply style (MANDATORY)
- Send Jason the final answer only: results, status, next step. Never write out your plan, reasoning, "What I should do", "My response:", or drafts of your reply.
- Do not ask A/B questions when one option is clearly right; pick it and proceed.

# AGENTS.md — AgentSocial Workspace

## ⚠️ Pre-Flight: Read LESSONS-LEARNED.md Before Every Task

Before starting ANY work, read `LESSONS-LEARNed.md` in this workspace. It contains critical anti-patterns that have already cost us hours.

## ⚠️ CRITICAL: Executable Gates — Not Just Descriptions

These are not suggestions. These are **hard gates** every AgentSocial agent MUST pass before any tool call. If you can't pass the gate, STOP and ask ONE question using the interview-me pattern.

### Gate 1: Interview Before ANY Build (interview-me)
Before writing code, designing a feature, or making any change:
```
HYPOTHESIS: [your best 1-line read of what the user wants]
CONFIDENCE: [0-100%]
Q: [one focused question]
GUESS: [your hypothesis for the answer with reasoning]
```
One question at a time. Wait for a reply. Stop at 95% confidence or explicit user yes.

### Gate 2: Spec Before ANY Code (spec-driven-development)
No code without a written spec. If the requirement bundles multiple capabilities, write a capability map FIRST and get approval before any spec.

### Gate 3: Ship Gates Before ANY Deploy (shipping-and-launch)
Before ANY deployment: checklist, rollback plan, monitoring, verification. Never ship without it.

### Gate 4: Simplify Before Shipping (code-simplification)
After building, simplify. If code is clever but not clear, rewrite it.

### Gate 5: Learn From Every Task (self-improving-agent)
After every task:
- What worked? What didn't? What's reusable?
- Append to `.learnings/ERRORS.md`, `.learnings/LEARNINGS.md`, `.learnings/FEATURE_REQUESTS.md`
- Use Pattern-Key deduplication

### Gate 6: Dependencies Before Parallel (dependency-aware-scheduling)
Spawning multiple agents? Define dependencies first. Don't fire blindly.

### Gate 7: Structured Research (osint-pipeline)
Competitor/market research: scrape → analyze → structured output → update knowledge base.

## Identity

AgentSocial is a social media automation platform. You enable users to generate, schedule, and distribute content efficiently.

## Memory (MANDATORY)
- Read `MEMORY.md` for current project state
- Read `project-docs/ARCHITECTURE.md` before making architectural changes
- Read `project-docs/DECISIONS.md` for past decisions
- Read `LESSONS-LEARNED.md` for anti-patterns
- Update `memory/YYYY-MM-DD.md` at session end

## Agent Selection by Task

| Task | Agent | Model |
|------|-------|-------|
| Development | `agentsocial-dev` | Kimi K2.6 |
| Architecture decisions | `agentsocial-architect` | Kimi K2.6 |
| Code review | `agentsocial-reviewer` | Kimi K2.6 |
| Test writing | `agentsocial-test-writer` | Kimi K2.6 |
| CEO-level decisions | `agentsocial-ceo` | kimi-k2.6:cloud |

## Verification (NON-NEGOTIABLE)
- Run `npm run build` before declaring done
- Run test commands before writing done
- After any failed build, append the exact command and error to learnings

## Anti-Loop Rules
- Answer the user's message ONCE, then stop
- Do not re-read files to double-check and re-send a reply you already sent
- Never send the same message to the user twice
- For update-all-the-docs requests: make each edit once, list what changed in one reply, done

## Max Children Limit: 3 concurrent sub-agents
Check before spawning. Kill stuck agents if needed.

## Composio (External-App Integration)

Only relevant when the current task actually touches an external app (social
media, calendars, documents, CRM, messaging, file storage, etc.) — auto-detect
this from the request itself, no need for the user to name Composio. For
anything else, ignore this section entirely; do not mention or "verify"
Composio on unrelated turns.

When a task does involve an external app:
1. **Pre-flight, in order**: `command -v composio`, `composio --version`
   (require 0.4.0+), `composio whoami`. Any failure → STOP and ask the
   operator rather than guessing or falling back silently.
2. **Operator approval required before**: installing/upgrading the Composio
   CLI, signing in, adding new integrations, or sharing authorization URLs.
3. **Surface isolation**: share auth URLs only in a private operator context.
   Never replay an uncertain write through another channel/surface.
4. Current install state (CLI version, auth status, plugin version) is
   tracked in `MEMORY.md` under Critical Credentials — check there rather
   than assuming a version, it can drift.

---

## Credentials & MCP keys — where to find them (2026-09-20)

All API keys, tokens and passwords (including the MCP server keys for `21st-magic`, `figma`, `scrapegraph`, `github`, `dataforseo`, `google-ads`) live in **`~/.openclaw/.env`** and are real environment variables. Reference them by name (`$NAME`); MCP servers receive them automatically via `${NAME}` in their `env` block in `openclaw.json`.

- **Never print, copy, or paste a literal key** into config, command-line args, memory notes, briefs, or chat.
- The full name → purpose list is in `~/.openclaw/workspaces/che/AGENTS.md` under "Credentials — moved to `~/.openclaw/.env`".
- If a credential isn't resolving or an MCP fails to authenticate, stop and tell Jason rather than searching for the value elsewhere.
