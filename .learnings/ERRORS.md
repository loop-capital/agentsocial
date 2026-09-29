# ERRORS.md — Known Errors & Pitfalls

## Common Gotchas & Fixes
- **Build Errors**: Check for missing imports or environment variable references.
- **Type-check failures after dependency changes**: This repo is a pnpm workspace. If `node_modules/next` is missing or Next.js types cannot be resolved, run `pnpm install` from the workspace root, not `npm install`.
- **Context overload**: Break large tasks (>3 files) into bounded 15-30 minute chunks.
- **Deployment Warnings**: Ensure all exported components in App Router use clean client/server directives.

## 2026-09-13: Phase 2 Task 3 — AI generation integration
- Full `npm run build` in `packages/api` fails with pre-existing errors: `src/mcp/generation-mcp-server.ts` references methods (`generateLipsyncVideo`, `generateTTS`, `trainAvatar`, etc.) not present on `GenerationService`; `account-manager.ts`, `billing-tiers.ts`, `campaigns.ts`, `gbp.ts` import types not exported from `@agentsocial/shared`.
- Full `npm run build` in `packages/frontend` fails with pre-existing error: `src/app/gbp/page.tsx` imports `GbpAccount` from `@agentsocial/shared` which does not export it.
- Type-checking only the files changed for this task (`src/services/generation.ts`, `src/services/cloudinary.ts`, `src/routes/generate-post-assets.ts`, `src/server.ts`, `src/app/social/create/page.tsx`) returns zero errors, so the integration itself is clean.
- One error introduced by this task was fixed: `TextGenerationResponse` interface was missing the `cost` field returned by the new `generateTextMuapi` implementation.

## 2026-09-13: Auth route wiring (Phase 1 Task 3)
- Onboarding page imports `api` from `../../../lib/api`, but `src/lib/api.ts` does not exist. This page is already broken independently of auth wiring.
- Next.js 14 App Router does not allow `use client` root layout with metadata export; keep root layout server-only and move client wrappers into group/layout children as needed. The `AuthProvider` in root layout is a client component import but the layout itself remains a server component, which is valid because the provider is rendered as a client subtree.
