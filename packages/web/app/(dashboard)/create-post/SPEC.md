# Create Post Page Spec

## Purpose
Buffer-style post composer for AgentSocial under `/dashboard/create-post`.

## Routes/API Used
- `POST /api/v1/posts` — save draft or schedule
- `POST /api/v1/posts/:id/publish` — publish now
- `GET /api/v1/brands` — active brand selection (first brand used if single)
- `GET /api/v1/channels?brand_id=...` — platform/channel listing
- `POST /api/v1/generate/image` — AI image from caption
- `POST /api/v1/generate/video` — AI video from caption (async job)
- `GET /api/v1/generate/video/:jobId` — poll video status

## UX
1. Tabs: Text, Image, Video, AI Generate.
2. Caption textarea with character count.
3. Platform checkboxes with color-coded chips: Instagram, TikTok, Facebook, YouTube, X, LinkedIn, GBP.
4. AI Magic Button runs image generation and shows preview.
5. AI Video Button runs video generation and shows job status.
6. Schedule: Now / Later (datetime-local) / Best Time (mock AI suggestion).
7. Preview pane simulates how the post renders per selected platform.
8. Post Now / Schedule / Save Draft actions.

## Notes
- No external muapi keys in frontend; calls go through internal API.
- Uses existing `useAuth`, `api` client, and Tailwind variables from `globals.css`.
- Created 2026-09-13 for Phase 2 Task 1.
