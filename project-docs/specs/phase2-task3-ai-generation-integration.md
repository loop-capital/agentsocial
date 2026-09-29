# Phase 2 Task 3 — AI Generation Integration into Post Creation Flow

**Status:** Approved for implementation  
**Scope:** API routes + frontend buttons for image, video, and related-post generation  
**Target packages:** `packages/api`, `packages/frontend`  

## 1. Background

The platform already has a provider-adapter `GenerationService` in `packages/api/src/services/generation.ts` and a `/generate/*` route module in `packages/api/src/routes/generation.ts`. This task adds **post-creation-friendly wrappers** that:

- Generate an image from a caption, upload it to Cloudinary, return a public URL.
- Generate a video from a caption (+ optional image), poll until done, return the video URL.
- Generate related post variations for other platforms using AI text rewrite + platform hashtags.

## 2. API Changes

### 2.1 New routes module

File: `packages/api/src/routes/generate-post-assets.ts`

Prefix (registered in server): `/api/generate`

| Method | Path | Purpose |
|--------|------|---------|
| POST   | `/image-from-caption` | Generate image from caption text, store in Cloudinary, return URL |
| POST   | `/video-from-caption` | Generate video from caption + optional image, return `jobId` |
| GET    | `/video-from-caption/:jobId` | Poll video job status, return URL when complete |
| POST   | `/related-posts` | Given a post, return platform-tailored variations |

All routes use existing authentication/brand header conventions:
- `request.userId` from JWT
- `x-brand-id` header required

### 2.2 Cloudinary upload

- Add `cloudinary` package to `packages/api`.
- Configure from env vars:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
- Create `packages/api/src/services/cloudinary.ts` helper:
  - `uploadBase64Image(data: string, mimeType: string, publicId?: string): Promise<string>`
  - `uploadFromUrl(url: string, folder?: string): Promise<string>`
- If Cloudinary is unconfigured, return the raw muapi URL as fallback so local dev still works.

### 2.3 Image-from-caption endpoint

Body:
```json
{
  "caption": "string (required, max 2000)",
  "aspectRatio": "1:1 | 3:4 | 4:3 | 9:16 | 16:9 (optional, default 1:1)",
  "model": "string (optional, default nano-banana)"
}
```

Flow:
1. Validate caption.
2. Call `service.generateImage({ prompt: caption, model, aspectRatio, brandId, userId, provider: 'muapi' })`.
3. If first image is base64 data → upload to Cloudinary; if already a URL → re-upload to Cloudinary (so all assets live under one CDN).
4. Return `{ imageUrl: string, model, provider, cost }`.

### 2.4 Video-from-caption endpoints

Body:
```json
{
  "caption": "string (required, max 4000)",
  "imageUrl": "string | null (optional)",
  "aspectRatio": "16:9 | 9:16 | 1:1 | 4:5 (optional, default 9:16)",
  "model": "string (optional, default seedance-2.0)"
}
```

POST flow:
1. Validate caption.
2. Call `service.generateVideo({ prompt: caption, referenceImageUrl: imageUrl, model, aspectRatio, brandId, userId, provider: 'muapi' })`.
3. Return `{ jobId, status: 'processing', model, provider, cost }`.

GET `/video-from-caption/:jobId` flow:
1. Call `service.getVideoJobStatus(jobId, brandId, 'muapi')`.
2. If status is `complete` and video URL exists, return `{ videoUrl, status, model, provider, cost }`.
3. If status is `failed`, return `{ status, error, model, provider }`.
4. Otherwise return `{ jobId, status: 'processing' }`.

### 2.5 Related-posts endpoint

Body:
```json
{
  "postId": "string (required)",
  "targetPlatforms": ["twitter", "linkedin", "facebook", "instagram", "tiktok"]
}
```

Flow:
1. Fetch source post by `postId` and verify brand ownership.
2. For each target platform (max 5), call `service.generateText()` (reuse/generate a text helper in `GenerationService`) with a platform-specific system prompt that asks for JSON: `{ caption, hashtags }`.
3. Return array of related post objects:
```json
{
  "relatedPosts": [
    {
      "platform": "instagram",
      "caption": "...",
      "hashtags": ["#ai", "#marketing"],
      "suggestedImagePrompt": "...",
      "sourcePostId": "..."
    }
  ]
}
```

If no text helper exists in `GenerationService`, add a minimal `generateText` method using muapi with model `gemini-2.0-flash` (or any available text model) and JSON-mode prompt.

## 3. Frontend Changes

### 3.1 API client additions

File: `packages/frontend/src/lib/api.ts`

Add to `contentApi`:
- `generateImageFromCaption(data)` → POST `/generate/image-from-caption`
- `generateVideoFromCaption(data)` → POST `/generate/video-from-caption`
- `getVideoJobStatus(jobId)` → GET `/generate/video-from-caption/${jobId}`
- `generateRelatedPosts(data)` → POST `/generate/related-posts`

All calls must pass `x-brand-id` header.

### 3.2 Create post page updates

File: `packages/frontend/src/app/social/create/page.tsx`

Add UI:
1. **Generate Image** button in the Post Composer media section.
   - On click: call `contentApi.generateImageFromCaption({ caption: content || aiTopic, brandId })`.
   - Show spinner while loading.
   - On success: set `mediaPreview` to returned URL, set `mediaType` to `image`.
   - On error: show inline error.
2. **Generate Video** button in the Post Composer media section.
   - On click: call `contentApi.generateVideoFromCaption({ caption: content || aiTopic, imageUrl: mediaPreview || null, brandId })`.
   - Show spinner and "Video generation started..." message with jobId.
   - Poll `getVideoJobStatus(jobId)` every 5 seconds until `status === 'complete'` or `failed`.
   - On complete: set `mediaPreview` to video URL, set `mediaType` to `video`.
   - On failed: show error.
3. After a post is successfully created (draft/scheduled/published), show a **Generate Related Posts** button in the success banner.
   - On click: call `contentApi.generateRelatedPosts({ postId: returnedPostId, targetPlatforms: selectedPlatforms, brandId })`.
   - Show loading spinner.
   - On success: show a modal/panel listing related post variations with platform, caption, and hashtags; each variation has a "Create Draft" button that opens a new create-post URL pre-filled with that caption.
   - On error: show error.

State to add:
- `imageLoading`, `imageError`, `generatedImageUrl`
- `videoLoading`, `videoError`, `videoJobId`, `videoJobStatus`
- `relatedLoading`, `relatedError`, `relatedPosts`, `showRelatedPanel`

## 4. Environment Variables

Add to `.env.example`:
```
# Cloudinary (image/video asset CDN)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## 5. Verification

- `cd packages/api && npm run build` passes.
- `cd packages/frontend && npm run build` passes.
- Routes return expected shapes when called with valid auth/brand headers.
- Cloudinary fallback works when env vars are missing.

## 6. Out of Scope

- Persisting generated related posts to the database (frontend can pre-fill a new draft).
- Video editing or character video features.
- Real-time WebSocket job updates (polling is acceptable for this task).
