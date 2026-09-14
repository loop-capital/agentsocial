# LEARNINGS.md — System Learnings & Best Practices

## Architectural Rules & Standards
- TypeScript Strict: No ny types.
- Package Manager: Always use pnpm (never 
pm or yarn).
- Components: Use Tailwind CSS + shadcn/ui.
- Validation: Validate API inputs with Zod schemas.

## Codebase Patterns
- Check active schema before creating database migrations.
- Verify file imports and routes after creating new files.
- Always run pnpm tsc --noEmit before marking tasks complete.

## Historical Corrections
- Check existing utility functions before adding custom helpers.
