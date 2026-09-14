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
