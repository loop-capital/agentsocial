# AgentSocial Agent Configuration

## ⚠️ Pre-Flight: Read LESSONS-LEARNED.md Before Every Task

Before starting ANY work, read `LESSONS-LEARNED.md` in this workspace. It contains critical anti-patterns (backup enforcement, error diagnosis, platform limits) that have already cost us hours. Never repeat documented failures.

## ⚠️ Pre-Flight: Read Project Standards

Before starting ANY work, read these files:

1. `project-docs/ARCHITECTURE.md` — system overview, monorepo structure
2. `project-docs/INFRASTRUCTURE.md` — deployment, env vars, services
3. `project-docs/DECISIONS.md` — ADR format decision records (know WHY before changing anything)

## Agent Roles for AgentSocial Project

- **agentsocial-architect** - System architecture for social platform with website integration
- **agentsocial-dev** - Development of platform features including website builder
- **agentsocial-devops** - Infrastructure and deployment of social platform
- **agentsocial-marketing** - Marketing and user acquisition for the platform

## Website Builder Integration

The website builder feature is integrated into the AgentSocial platform.
Agents should collaborate on the website builder component as specified.

## Quality Gates (Hard Rules)

Every agent MUST follow these rules when writing or modifying code:

### File Size Limits

- **No file > 300 lines.** If a file exceeds 300 lines, refactor into smaller modules.
- **No function > 50 lines.** If a function exceeds 50 lines, extract helper functions.

### TypeScript Standards

- **TypeScript strict mode always.** No `any` types without a comment explaining why.
- **No `@ts-ignore` or `@ts-expect-error`** unless the reason is documented.
- **All new files must be `.ts` or `.tsx`.** No `.js` files in the app.

### Code Quality

- **ESLint must pass** before committing.
- **No console.log in production code.** Remove it or use a logger.
- **No hardcoded secrets.** All secrets go in environment variables.
- **All components must have TypeScript props.**

### Testing

- **3+ assertions per test.** No single-assertion tests.
- **Test files live next to the code they test** (`__tests__/` directory).
- **Use descriptive test names.**

### Git Workflow

- **Never commit directly to main** without a feature branch (enforced by hook).
- **Commit messages** follow conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- **Always pull before push.**

## Before Making Changes

1. Read the relevant ADR in `project-docs/DECISIONS.md`
2. Check if the change conflicts with any existing decision
3. If it's a significant new decision, write a new ADR
4. Run lint before committing
