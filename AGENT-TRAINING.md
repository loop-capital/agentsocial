# Agent Team Training Guide

> **Created:** 2026-05-18
> **Purpose:** Train all agent teams to build correctly the first time. No more "done but broken."
> **Applies to:** Every project workspace. Every agent. Every task.

---

## The Problem

Our models are smart enough. The issue is we put them in bad environments:
- No discovery phase (agents write code without reading what exists)
- No architecture docs (agents don't know the stack, patterns, or gotchas)
- No acceptance criteria (agents decide when they're "done")
- No verification step (nobody checks if it actually works)

## The Fix: Every Task Follows This Pipeline

```
Phase 0: DISCOVER  (5-10 min)  → Read codebase, understand state
Phase 1: BUILD     (actual work) → One agent, one deliverable
Phase 2: VERIFY    (Che's job)   → Test against acceptance criteria
Phase 3: DEPLOY    (commit/ship) → Verify live version
```

---

## Rule 1: Read Before You Write

Before touching ANY file, you MUST:

1. **Read the target file** — understand what's there now
2. **Check git history** — `git log --oneline -10 <file>` to see who changed it and why
3. **Read the architecture doc** — if one exists in the project root
4. **Check for existing patterns** — read 2-3 similar files to match the style
5. **Report your findings** before making changes

**Example prompt that works:**
> Read `src/screens/FormulateScreen.tsx`, `src/api/client.ts`, and `dashboard/app/formulate/page.tsx`. Report: what fields exist in each, what's missing between them, and what patterns they use. THEN add the missing fields.

**Example prompt that fails:**
> Add texture, density, and chemical history fields to FormulateScreen.tsx.

---

## Rule 2: Every Project Gets These Docs

Before any agent works on a project, these files must exist:

### ARCHITECTURE.md (project-specific)
Each project maintains its own ARCHITECTURE.md with:
- Stack (framework, database, auth, deployment)
- API patterns (where routes live, auth flow, response format)
- Component patterns (how UI is organized)
- Deployment commands (exact commands to build and deploy)
- Known gotchas (environment quirks, platform limitations)

### DELIVERY-CHECKLIST.md (per feature)
```markdown
## Feature: [Name]
### Discovery
- [ ] Read [relevant files]
- [ ] Check git history for prior work
- [ ] Understand current deployed state

### Build
- [ ] [Specific testable requirement 1]
- [ ] [Specific testable requirement 2]

### Verify
- [ ] Code builds without errors
- [ ] API returns expected response (curl test)
- [ ] UI renders correctly (describe or screenshot)
- [ ] Deployed to production
- [ ] Live version matches expected state
```

---

## Rule 3: Acceptance Criteria Must Be Testable

Bad criteria (agents will game these):
- "Build the upload feature" ✗
- "Fix the settings page" ✗
- "Add form fields" ✗

Good criteria (verifiable):
- "POST to `/api/endpoint` with FormData returns 200 with `{ url: string }`" ✓
- "Settings toggles persist to storage and survive app restart" ✓
- "Screen includes all fields from [reference implementation]" ✓

**The test:** Can I verify this by running a command or checking a file? If yes, it's a good criterion. If no, make it more specific.

---

## Rule 4: Match Existing Patterns

### For API Endpoints
1. Check existing endpoints first: `ls app/api/` or equivalent
2. Use the same validation library (zod, joi, etc.)
3. Use the same response format
4. Use the same auth middleware
5. Test with curl before declaring done

### For UI Components
1. Check existing components: `ls components/` or equivalent
2. Use the same styling approach (Tailwind / inline styles / CSS modules)
3. Use the same state management pattern
4. Use the same navigation patterns
5. Test render before declaring done

### For Database Changes
1. Read existing schema/migrations first
2. Use the same naming conventions
3. Add proper indexes
4. Write migration if schema changes
5. Test with seed data before declaring done

---

## Rule 5: Verification Is Non-Negotiable

After EVERY build task, run these checks:

### Web Apps
```bash
npm run build
# Must pass with zero errors
```

### Mobile Apps
```bash
npx tsc --noEmit
# Must pass with zero errors
```

### API Endpoints
```bash
curl -X POST https://[domain]/api/[endpoint] \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
# Must return expected response format
```

### UI Components
- Can you describe what renders on screen?
- Does the component compile?
- Do all props have correct types?

---

## Rule 6: When Things Go Wrong

### First failure:
1. Read the full error message
2. Search memory for similar errors
3. Check: is this a known gotcha? (Read ARCHITECTURE.md)
4. Fix the root cause, not the symptom

### Second failure:
1. Stop. Diagnose.
2. Is the approach wrong? (Wrong file, wrong pattern, wrong assumption)
3. Read the code around the error
4. Try a different approach

### Third failure:
1. Escalate. Tell Che the error, what you tried, and what didn't work.
2. Do NOT keep retrying the same fix.

---

## Rule 7: The Agent Prompt Template

Every agent task should follow this structure:

```
TASK: [One sentence description]

PHASE 0 — DISCOVERY (do this FIRST, no code changes):
- Read: [list specific files]
- Report: what exists now, what's missing, what patterns are used
- STOP and report findings before proceeding

PHASE 1 — BUILD:
- [Specific acceptance criterion 1]
- [Specific acceptance criterion 2]
- Match existing patterns in [reference file]

PHASE 2 — VERIFY:
- Run: [specific command to verify]
- Report: what changed in each file

RULES:
- Do NOT modify files outside [scope]
- Do NOT change [specific things]
- Max 2 attempts at any failing step, then diagnose
- Use existing patterns from [reference files]
```

---

## The Golden Rule

**An agent's job is NOT to write code. An agent's job is to make a feature work.**

"Done" means:
1. The code compiles
2. The feature does what it's supposed to do
3. It works when you actually use it
4. It doesn't break existing features

If any of those is false, it's not done.
