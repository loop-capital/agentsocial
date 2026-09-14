---
tags: [protocol, memory, agentsocial]
updated: 2026-05-10
---

# AgentSocial Memory Protocol

## Memory Architecture (read in this order before each task)

1. **MEMORY.md** — Curated long-term memory at workspace root
2. **OpenClaw memory_search** — Semantic search via QMD (12K+ docs indexed)
3. **Obsidian Vault** — Structured notes (concepts, documents, journal)
4. **Wiki (wiki_apply/wiki_get)** — Synthesized knowledge via memory-wiki plugin
5. **QMD CLI** — Fallback deep search: `qmd query "<query>" --collection <name>`

## Storage Locations

| System | Path | Purpose |
|--------|------|---------|
| MEMORY.md | `/home/jason/.openclaw/workspaces/agentsocial/MEMORY.md` | Curated long-term memory |
| Daily logs | `/home/jason/.openclaw/workspaces/agentsocial/memory/YYYY-MM-DD.md` | Session notes (auto-indexed) |
| Dream reports | `/home/jason/.openclaw/workspaces/agentsocial/memory/.dreams/` | Nightly dream cycles |
| Obsidian vault | `/home/jason/.openclaw/obsidian-vault/` | Structured knowledge |
| Wiki vault | `/home/jason/.openclaw/wiki/agentsocial/` | Synthesized wiki pages |
| Second brain | `/home/jason/.openclaw/workspaces/agentsocial/second-brain/` | Structured concepts/docs |
| Directives | `/home/jason/.openclaw/workspaces/agentsocial/directives/` | SOPs and protocols |
| Graphify | `/home/jason/.openclaw/workspaces/agentsocial/graphify-out/` | Knowledge graph |

## QMD Collections

| Collection | Path | Docs |
|------------|------|------|
| agentsocial_workspace | /workspaces/agentsocial | 6,771 |
| byondedu_workspace | /workspaces/byondedu | 5,624 |
| colorgenius_workspace | /workspaces/colorgenius | 9 |
| agent_memories | /agents | 86 |
| obsidian_vault | /obsidian-vault | 5+ |
| agentsocial-wiki | /wiki/agentsocial | new |
| byondedu-wiki | /wiki/byondedu | indexed |
| che-wiki | /wiki/che | indexed |
| colorgenius-wiki | /wiki/colorgenius | indexed |

## Daily Workflow

1. **Start of session**: Read `MEMORY.md` for current context
2. **Before tasks**: Run `memory_search` or `wiki_search` to find relevant prior work
3. **During tasks**: Write session notes to `memory/YYYY-MM-DD.md`
4. **After significant work**: Write concepts/decisions to Obsidian vault or second-brain
5. **Periodic curation**: Move important items from daily logs to `MEMORY.md`
6. **Weekly**: Review and clean up, refresh graphify if codebase changed

## Writing Rules

- Append to daily logs, never overwrite
- Use frontmatter tags on all Obsidian/second-brain files
- Cross-reference between systems (link wiki pages ↔ memory entries)
- Graphify after major codebase changes
- Use `wiki_apply` for synthesis pages, not raw edits

## Maintenance Cron Jobs

- **Daily 6am**: Re-index QMD collections
- **Weekly Sunday 3am**: Full graphify refresh + MEMORY.md curation
- **Daily 3am**: Dream cycle (auto via memory-core plugin)
