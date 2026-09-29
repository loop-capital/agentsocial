# LEARNINGS.md — System Learnings & Best Practices

## Architectural Rules & Standards
- TypeScript Strict: No `any` types.
- Package Manager: Always use pnpm (never npm or yarn). This repo has a pnpm workspace; `npm install` only hydrates the root package and leaves workspace packages broken.
- Components: Use Tailwind CSS + shadcn/ui.
- Validation: Validate API inputs with Zod schemas.
- Auth wiring: Place `AuthProvider` in the root layout so every route can use `useAuth`; use group-level `ProtectedRoute` guards for authenticated-only route groups.

## Codebase Patterns
- Check active schema before creating database migrations.
- Verify file imports and routes after creating new files.
- Always run `pnpm tsc --noEmit` before marking tasks complete.

## 2026-09-13: Phase 2 Task 3 — AI generation integration
- When adding a new method to an existing service, update the return-type interface at the same time. Adding `cost` to `TextGenerationResponse` fixed a TypeScript error from the new `generateText` implementation.
- Cloudinary should be treated as optional in this codebase; the existing media path uses S3/R2. Fallback to source URL / base64 data URL keeps local dev working without Cloudinary env vars.
- Fastify route modules can share the same prefix if both are registered with `await server.register(routes, { prefix: "/api/v1/generate" })`; the new `/generate/image-from-caption`, `/generate/video-from-caption`, and `/generate/related-posts` routes coexist with the existing `/generate/*` generation routes.

## Historical Corrections
- Check existing utility functions before adding custom helpers.
