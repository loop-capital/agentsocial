# File Management System - Che Workspace

## Directory Structure

```
/workspace/
├── /docs/                    # Permanent documentation
│   ├── /deep-research/       # Completed research (keep indefinitely)
│   ├── /audience-research/   # Audience insights (keep indefinitely)
│   ├── /agency-research/     # Agency findings (keep indefinitely)
│   └── /specs/               # Feature specifications (keep until implemented)
├── /research/                # Active research files (temporary lifecycle)
│   ├── /active/              # Currently being worked on (< 7 days)
│   ├── /completed/           # Recently finished research (7-30 days)
│   └── /archive/             # Old research (30-90 days, then delete)
├── /memory/                  # Session logs and memory files
│   ├── /daily/               # YYYY-MM-DD.md files (keep 90 days)
│   ├── /long-term/           # Curated MEMORY.md updates (keep indefinitely)
│   └── /temp/                # Temporary memory files (delete after 7 days)
├── /temp/                    # General temporary files
│   ├── /scratch/             # Scratch work (delete after 1 day)
│   ├── /cache/               # Cached data (delete after 30 days)
│   └── /logs/                # Log files (keep 90 days)
└── /archive/                 # Long-term archive (business decisions, etc.)
```

## File Lifecycle Policies

### Research Files
- **Active** (< 7 days): Current work in progress
- **Completed** (7-30 days): Moved from active after completion
- **Archive** (30-90 days): Moved from completed after 30 days
- **Deleted** (> 90 days): Automatic deletion with 24-hour warning

### Memory Files
- **Daily logs** (YYYY-MM-DD.md): Keep 90 days, then archive
- **Long-term memory** (curated updates to MEMORY.md): Keep indefinitely
- **Temp memory files**: Delete after 7 days

### Temporary Files
- **Scratch work**: Delete after 24 hours
- **Cache files**: Delete after 30 days
- **Log files**: Keep 90 days for debugging

## Naming Conventions

### Temporary File Tagging
When creating temporary files, use this format in the first line:
```
# TEMP: [purpose] - [expected completion date]
```

### Permanent File Tagging
For files that should be retained indefinitely:
```
# PERM: [reason for permanent retention]
```

## Automation

A daily cleanup cron job runs to:
1. Move files between lifecycle stages based on age
2. Send deletion warnings 24 hours before deletion
3. Delete files past retention limits
4. Report cleanup statistics

## Current Status

As of April 29, 2026:
- ✅ Directory structure implemented
- ✅ Recent research files moved to completed/
- ✅ Older research files moved to archive/
- ✅ Memory files organized by date (daily/long-term/temp)
- ✅ Temp directory structure created
- ✅ Windows Zone.Identifier files cleaned up

## Maintenance

To run manual cleanup:
```
/path/to/cleanup-script.sh
```

Or wait for the daily automated cleanup.
