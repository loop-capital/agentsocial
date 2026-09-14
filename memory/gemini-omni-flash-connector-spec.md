# AgentSocial — Gemini Omni Flash Connector Specification

**Status:** 🟡 API Pending ("coming weeks" — May 24, 2026)
**Priority:** Phase 2 (after GBP + Ads API)
**Tier:** Pro+ (video generation), Elite (ad creative)

---

## Overview

Gemini Omni Flash is Google's multimodal AI model for video generation and editing, accessible via developer/enterprise APIs. This connector integrates Omni Flash into AgentSocial's content pipeline, enabling programmatic video creation for social media posts.

Unlike social platform connectors (which publish content), Omni Flash is a **content generation connector** — it creates assets that flow *into* our publishing pipeline.

---

## Architecture Position

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     AgentSocial Content Pipeline                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────┐    ┌──────────────┐    ┌──────────────┐               │
│   │  Content Brief  │───▶│  Generation  │───▶│  Publishing   │               │
│   │  (user input)   │    │  Connectors  │    │  Connectors   │               │
│   └─────────────────┘    └──────┬───────┘    └──────────────┘               │
│                                 │                                            │
│                    ┌────────────┼────────────┐                              │
│                    ▼            ▼            ▼                              │
│            ┌────────────┐ ┌──────────┐ ┌──────────────┐                    │
│            │ Omni Flash │ │  Clipify │ │ AI Text Gen   │                    │
│            │ (video)    │ │ (reframe)│ │ (captions)    │                    │
│            └────────────┘ └──────────┘ └──────────────┘                    │
│                    │                                                      │
│                    ▼                                                      │
│            ┌────────────┐                                                │
│            │ Media Store │───▶ FB, IG, TT, YT, X, LinkedIn                │
│            └────────────┘                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Connector Interface

### Content Generation Connector (New Type)

Omni Flash doesn't publish to social platforms — it generates media. We need a new connector type:

```typescript
interface ContentGenerationConnector {
  readonly name: GeneratorName;
  readonly version: string;
  readonly capabilities: GeneratorCapabilities;
  
  // ========== AUTHENTICATION ==========
  
  /**
   * Authenticate with Google AI/Vertex AI
   */
  authenticate(credentials: GoogleAICredentials): Promise<AuthResult>;
  
  // ========== VIDEO GENERATION ==========
  
  /**
   * Generate video from text prompt
   */
  generateVideo(prompt: VideoPrompt, options: GenerationOptions): Promise<GenerationJob>;
  
  /**
   * Generate video from image reference
   */
  generateFromImage(image: ImageReference, prompt: VideoPrompt, options: GenerationOptions): Promise<GenerationJob>;
  
  /**
   * Edit existing video with natural language instructions
   */
  editVideo(video: VideoReference, edit: VideoEditPrompt, options: GenerationOptions): Promise<GenerationJob>;
  
  // ========== JOB MANAGEMENT ==========
  
  /**
   * Get generation job status
   */
  getJobStatus(jobId: string): Promise<GenerationJobStatus>;
  
  /**
   * Wait for job completion (polling or webhook)
   */
  waitForCompletion(jobId: string, timeoutMs?: number): Promise<GenerationResult>;
  
  /**
   * Cancel a running job
   */
  cancelJob(jobId: string): Promise<void>;
  
  // ========== OUTPUT ==========
  
  /**
   * Download generated video
   */
  downloadResult(jobId: string, format: OutputFormat): Promise<MediaFile>;
  
  /**
   * Get signed URL for direct access
   */
  getResultUrl(jobId: string, expiresIn?: number): Promise<string>;
}

// Supporting types
interface GeneratorCapabilities {
  supportsTextToVideo: boolean;
  supportsImageToVideo: boolean;
  supportsVideoEditing: boolean;
  supportsAudioGeneration: boolean;      // Native audio in generated video
  supportsConversationMode: boolean;      // Iterative editing via chat
  maxDuration: number;                    // seconds
  supportedResolutions: string[];         // e.g., ['720p', '1080p', '4K']
  supportedAspectRatios: string[];        // e.g., ['16:9', '9:16', '1:1', '4:5']
  maxPromptLength: number;
  outputFormats: string[];               // e.g., ['mp4', 'webm']
  estimatedGenerationTime: number;       // seconds per minute of output
}

interface VideoPrompt {
  text: string;
  style?: VideoStyle;          // cinematic, documentary, social, etc.
  mood?: string;               // upbeat, professional, cozy, etc.
  subject?: string;            // focus subject description
  background?: string;         // background/setting description
  voiceover?: boolean;         // include AI narration
  music?: boolean;             // include background music
}

interface VideoStyle {
  name: string;                // 'cinematic' | 'social-short' | 'tutorial' | 'promotional'
  colorGrade?: string;         // warm, cool, vibrant, muted
  pacing?: string;             // fast, medium, slow
  transitions?: string;        // cut, dissolve, wipe, dynamic
}

interface VideoEditPrompt {
  instruction: string;         // "Change the background to a modern salon"
  targetSegment?: TimeRange;   // Apply to specific segment only
  preserveElements?: string[]; // Elements to keep unchanged
}

interface TimeRange {
  startMs: number;
  endMs: number;
}

interface GenerationOptions {
  duration?: number;           // Target duration in seconds
  resolution?: string;         // '720p' | '1080p' | '4K'
  aspectRatio?: string;        // '16:9' | '9:16' | '1:1' | '4:5'
  withAudio?: boolean;         // Generate with native audio (Veo 3.1 feature)
  seed?: number;                // For reproducibility
  model?: string;              // 'omni-flash' | 'omni' | 'veo-3.1'
  negativePrompt?: string;     // Things to avoid
}

interface GenerationJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  estimatedCompletionAt?: Date;
  progress?: number;           // 0-100
}

interface GenerationResult {
  jobId: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;            // actual duration in seconds
  resolution: string;
  aspectRatio: string;
  fileSize: number;
  metadata: {
    model: string;
    promptUsed: string;
    generationTimeMs: number;
  };
}

interface GoogleAICredentials {
  type: 'api_key' | 'service_account' | 'oauth';
  apiKey?: string;
  serviceAccountJson?: string;
  accessToken?: string;
  projectId?: string;           // Google Cloud project for Vertex AI
  region?: string;              // us-central1, europe-west1, etc.
}

interface OutputFormat {
  container: 'mp4' | 'webm';
  codec: 'h264' | 'h265' | 'vp9';
  quality: 'low' | 'medium' | 'high';
}
```

---

## Platform-Specific Details

### Google AI Studio API (Free Tier / Prototyping)

```typescript
const googleAIStudioConfig = {
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  authType: 'api_key',
  // Expected endpoint (subject to change at launch):
  // POST /models/gemini-omni-flash:generateVideo
  // GET  /models/gemini-omni-flash:operations/{id}
  
  rateLimits: {
    free: {
      requestsPerMinute: 2,
      requestsPerDay: 50,
      concurrentJobs: 1
    }
  }
};
```

### Vertex AI API (Enterprise / Production)

```typescript
const vertexAIConfig = {
  baseUrl: 'https://{region}-aiplatform.googleapis.com/v1',
  authType: 'service_account',
  // Expected endpoint:
  // POST /projects/{project}/locations/{region}/publishers/google/models/gemini-omni-flash:predict
  // POST /projects/{project}/locations/{region}/publishers/google/models/gemini-omni-flash:streamPredict
  
  rateLimits: {
    enterprise: {
      requestsPerMinute: 60,
      concurrentJobs: 10,
      maxDurationSeconds: 120  // 2 min video max
    }
  },
  
  pricing: {
    // Estimated based on Google's current pricing patterns:
    // $0.03-0.05 per second of generated video
    // 15-second reel: ~$0.45-0.75
    // 60-second ad: ~$1.80-3.00
    perSecondEstimate: 0.04
  }
};
```

---

## AgentSocial Integration

### Content Brief → Video Pipeline

```typescript
class OmniFlashConnector implements ContentGenerationConnector {
  readonly name = 'gemini-omni-flash';
  readonly version = '1.0';
  readonly capabilities = {
    supportsTextToVideo: true,
    supportsImageToVideo: true,
    supportsVideoEditing: true,
    supportsAudioGeneration: true,    // Veo 3.1 native audio
    supportsConversationMode: true,   // Iterative editing
    maxDuration: 120,                  // 2 minutes
    supportedResolutions: ['720p', '1080p', '4K'],
    supportedAspectRatios: ['16:9', '9:16', '1:1', '4:5'],
    maxPromptLength: 8000,
    outputFormats: ['mp4'],
    estimatedGenerationTime: 30       // ~30s per minute of video
  };

  private auth: GoogleAICredentials;
  private httpClient: AxiosInstance;

  async generateVideo(prompt: VideoPrompt, options: GenerationOptions): Promise<GenerationJob> {
    const payload = this.buildPayload(prompt, options);
    
    const response = await this.httpClient.post(
      '/models/gemini-omni-flash:generateVideo',
      payload,
      { headers: this.getAuthHeaders() }
    );
    
    return {
      id: response.data.operationId,
      status: 'processing',
      createdAt: new Date(),
      estimatedCompletionAt: new Date(Date.now() + this.estimateTime(options))
    };
  }

  async generateFromImage(
    image: ImageReference, 
    prompt: VideoPrompt, 
    options: GenerationOptions
  ): Promise<GenerationJob> {
    const payload = {
      ...this.buildPayload(prompt, options),
      referenceImage: {
        source: image.type,       // 'url' | 'base64' | 'gcs'
        data: image.url || image.base64
      }
    };
    
    const response = await this.httpClient.post(
      '/models/gemini-omni-flash:generateVideo',
      payload,
      { headers: this.getAuthHeaders() }
    );
    
    return {
      id: response.data.operationId,
      status: 'processing',
      createdAt: new Date()
    };
  }

  async editVideo(
    video: VideoReference, 
    edit: VideoEditPrompt, 
    options: GenerationOptions
  ): Promise<GenerationJob> {
    const payload = {
      editInstruction: edit.instruction,
      sourceVideo: {
        source: video.type,       // 'url' | 'gcs' | 'generated'
        data: video.url || video.jobId
      },
      ...(edit.targetSegment && { timeRange: edit.targetSegment }),
      ...(edit.preserveElements && { preserve: edit.preserveElements }),
      ...options
    };
    
    const response = await this.httpClient.post(
      '/models/gemini-omni-flash:editVideo',
      payload,
      { headers: this.getAuthHeaders() }
    );
    
    return {
      id: response.data.operationId,
      status: 'processing',
      createdAt: new Date()
    };
  }

  async waitForCompletion(jobId: string, timeoutMs = 300000): Promise<GenerationResult> {
    const start = Date.now();
    
    while (Date.now() - start < timeoutMs) {
      const status = await this.getJobStatus(jobId);
      
      if (status.status === 'completed') {
        return this.getGenerationResult(jobId);
      }
      
      if (status.status === 'failed') {
        throw new Error(`Generation failed: ${status.error}`);
      }
      
      // Poll every 5 seconds
      await sleep(5000);
    }
    
    throw new Error('Generation timed out');
  }

  private buildPayload(prompt: VideoPrompt, options: GenerationOptions) {
    return {
      prompt: prompt.text,
      style: prompt.style?.name,
      mood: prompt.mood,
      subject: prompt.subject,
      background: prompt.background,
      voiceover: prompt.voiceover,
      music: prompt.music,
      duration: options.duration,
      resolution: options.resolution || '1080p',
      aspectRatio: options.aspectRatio || '9:16',
      withAudio: options.withAudio ?? true,
      seed: options.seed,
      negativePrompt: options.negativePrompt
    };
  }

  private estimateTime(options: GenerationOptions): number {
    const duration = options.duration || 15;
    return duration * 30000; // ~30s per second of output
  }
}
```

---

## Salon Content Templates

Pre-built video generation templates for salon clients:

```typescript
interface SalonVideoTemplate {
  id: string;
  name: string;
  description: string;
  defaultPrompt: VideoPrompt;
  defaultOptions: GenerationOptions;
  estimatedCost: number;          // USD
  platforms: PlatformName[];     // Where to publish
}

const salonTemplates: SalonVideoTemplate[] = [
  {
    id: 'salon-promo-15',
    name: '15s Salon Promo',
    description: 'Short promotional reel showcasing salon services',
    defaultPrompt: {
      text: 'A modern salon with warm lighting, stylist working on client hair transformation, upbeat atmosphere',
      style: { name: 'social-short', pacing: 'fast', transitions: 'dynamic' },
      mood: 'upbeat',
      music: true
    },
    defaultOptions: {
      duration: 15,
      aspectRatio: '9:16',      // Vertical for Reels/TikTok
      resolution: '1080p',
      withAudio: true,
      model: 'omni-flash'
    },
    estimatedCost: 0.60,
    platforms: ['instagram', 'tiktok', 'youtube', 'facebook']
  },
  {
    id: 'salon-before-after',
    name: 'Before & After',
    description: 'Transformation showcase from before photo to styled result',
    defaultPrompt: {
      text: 'Hair transformation sequence showing before and after results',
      style: { name: 'cinematic', colorGrade: 'warm', pacing: 'medium' },
      mood: 'professional',
      music: true
    },
    defaultOptions: {
      duration: 20,
      aspectRatio: '9:16',
      resolution: '1080p',
      withAudio: true,
      model: 'omni-flash'
    },
    estimatedCost: 0.80,
    platforms: ['instagram', 'tiktok', 'facebook']
  },
  {
    id: 'salon-seasonal',
    name: 'Seasonal Offer',
    description: 'Seasonal promotion with text overlays and pricing',
    defaultPrompt: {
      text: 'Seasonal salon promotion with text overlay showing special offer',
      style: { name: 'promotional', colorGrade: 'vibrant', pacing: 'fast' },
      mood: 'exciting',
      voiceover: true,
      music: true
    },
    defaultOptions: {
      duration: 30,
      aspectRatio: '9:16',
      resolution: '1080p',
      withAudio: true,
      model: 'omni-flash'
    },
    estimatedCost: 1.20,
    platforms: ['instagram', 'facebook', 'youtube']
  },
  {
    id: 'salon-ad-60',
    name: '60s Google/Meta Ad',
    description: 'Professional video ad for paid campaigns',
    defaultPrompt: {
      text: 'Professional salon advertisement showcasing services, ambiance, and booking call-to-action',
      style: { name: 'cinematic', colorGrade: 'warm', pacing: 'medium', transitions: 'dissolve' },
      mood: 'professional',
      voiceover: true,
      music: true
    },
    defaultOptions: {
      duration: 60,
      aspectRatio: '16:9',       // Landscape for ads
      resolution: '1080p',
      withAudio: true,
      model: 'omni-flash'
    },
    estimatedCost: 2.40,
    platforms: ['youtube', 'facebook']  // Ad placements
  }
];
```

---

## API Endpoints (AgentSocial Backend)

```typescript
// POST /api/v1/generation/video
// Generate video from content brief
router.post('/generation/video', authenticate, async (req, res) => {
  const { brandId, prompt, options, templateId } = req.body;
  
  // Resolve template if specified
  const resolvedPrompt = templateId 
    ? { ...salonTemplates.find(t => t.id === templateId)!.defaultPrompt, ...prompt }
    : prompt;
  
  const resolvedOptions = templateId
    ? { ...salonTemplates.find(t => t.id === templateId)!.defaultOptions, ...options }
    : options;
  
  // Check brand's generation quota
  const quota = await checkGenerationQuota(brandId);
  if (!quota.allowed) {
    return res.status(429).json({ error: 'Generation quota exceeded' });
  }
  
  // Submit generation job
  const job = await omniFlash.generateVideo(resolvedPrompt, resolvedOptions);
  
  // Store job in DB
  await db.generationJobs.create({
    id: job.id,
    brand_id: brandId,
    type: 'video',
    prompt: resolvedPrompt,
    options: resolvedOptions,
    status: 'processing',
    created_at: new Date()
  });
  
  res.json({ jobId: job.id, estimatedCompletionAt: job.estimatedCompletionAt });
});

// GET /api/v1/generation/video/:jobId
// Check generation status
router.get('/generation/video/:jobId', authenticate, async (req, res) => {
  const job = await db.generationJobs.findById(req.params.jobId);
  const status = await omniFlash.getJobStatus(job.id);
  
  if (status.status === 'completed') {
    const result = await omniFlash.downloadResult(job.id, {
      container: 'mp4',
      codec: 'h264',
      quality: 'high'
    });
    
    // Store in media library
    const media = await db.media.create({
      brand_id: job.brand_id,
      type: 'video',
      url: result.videoUrl,
      thumbnail_url: result.thumbnailUrl,
      duration: result.duration,
      metadata: result.metadata
    });
    
    res.json({ status: 'completed', media });
  } else {
    res.json({ status: status.status, progress: status.progress });
  }
});

// POST /api/v1/generation/video/:jobId/edit
// Edit a generated video
router.post('/generation/video/:jobId/edit', authenticate, async (req, res) => {
  const { instruction, targetSegment, preserveElements } = req.body;
  
  const editJob = await omniFlash.editVideo(
    { type: 'generated', jobId: req.params.jobId },
    { instruction, targetSegment, preserveElements },
    {}
  );
  
  res.json({ jobId: editJob.id });
});

// POST /api/v1/generation/video/:jobId/publish
// Publish generated video to social platforms
router.post('/generation/video/:jobId/publish', authenticate, async (req, res) => {
  const { platforms, caption, scheduledAt } = req.body;
  const job = await db.generationJobs.findById(req.params.jobId);
  const media = await db.media.findByJobId(job.id);
  
  const results = await publishToPlatforms({
    brandId: job.brand_id,
    mediaUrl: media.url,
    caption,
    platforms,
    scheduledAt
  });
  
  res.json({ published: results });
});
```

---

## Database Schema

```sql
-- Generation jobs table
CREATE TABLE generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id),
  type VARCHAR(20) NOT NULL DEFAULT 'video',     -- video, image
  provider VARCHAR(50) NOT NULL DEFAULT 'gemini-omni-flash',
  model VARCHAR(50) NOT NULL DEFAULT 'omni-flash',
  
  -- Input
  prompt JSONB NOT NULL,
  options JSONB,
  template_id VARCHAR(50),
  source_media_id UUID REFERENCES media(id),    -- For image-to-video or video edits
  parent_job_id UUID REFERENCES generation_jobs(id), -- For edit chains
  
  -- Output
  output_media_id UUID REFERENCES media(id),
  result_url TEXT,
  thumbnail_url TEXT,
  duration_seconds FLOAT,
  resolution VARCHAR(10),
  aspect_ratio VARCHAR(10),
  file_size_bytes BIGINT,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'queued',  -- queued, processing, completed, failed, cancelled
  provider_job_id VARCHAR(255),                  -- Google operation ID
  progress INTEGER DEFAULT 0,
  error TEXT,
  
  -- Cost tracking
  estimated_cost_usd DECIMAL(10, 4),
  actual_cost_usd DECIMAL(10, 4),
  
  -- Metadata
  generation_time_ms INTEGER,
  tokens_used JSONB,                            -- Input/output tokens if applicable
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_generation_jobs_brand ON generation_jobs(brand_id);
CREATE INDEX idx_generation_jobs_status ON generation_jobs(status) WHERE status IN ('queued', 'processing');

-- Generation quotas (per brand per billing period)
CREATE TABLE generation_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  video_seconds_used FLOAT DEFAULT 0,
  video_seconds_limit FLOAT NOT NULL,           -- Based on tier
  video_generations_count INTEGER DEFAULT 0,
  video_generations_limit INTEGER NOT NULL,
  
  estimated_cost_usd DECIMAL(10, 2) DEFAULT 0,
  cost_limit_usd DECIMAL(10, 2) NOT NULL,       -- Monthly cap
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(brand_id, period_start)
);
```

---

## Tier Quotas

| Tier | Video Sec/Mo | Generations/Mo | Cost Cap | Max Duration |
|------|-------------|-----------------|----------|-------------|
| Core | 60s | 4 | $5 | 15s |
| Pro | 300s | 20 | $25 | 30s |
| Elite | Unlimited | Unlimited | $100+ | 120s |
| DFY | Unlimited | Unlimited | No cap | 120s |

**Pricing math:**
- Average 15s reel = $0.60 generation cost
- Pro tier: 20 reels/mo = ~$12 cost, charge $199/mo = healthy margin
- Elite: client-facing ad creative = $2-5/gen, charge $499/mo

---

## Webhook Integration

```typescript
// Google AI long-running operations can notify via Pub/Sub
// Configure webhook endpoint for async completion

router.post('/webhooks/gemini-omni', async (req, res) => {
  // Verify webhook signature
  const isValid = verifyGoogleWebhook(req.headers, req.body);
  if (!isValid) return res.status(401).send('Invalid signature');
  
  const { operationId, status, result } = req.body;
  
  // Update job status
  await db.generationJobs.update({
    provider_job_id: operationId,
    status: status === 'DONE' ? 'completed' : status.toLowerCase(),
    result_url: result?.videoUrl,
    completed_at: status === 'DONE' ? new Date() : undefined
  });
  
  // If completed, process result
  if (status === 'DONE') {
    await processCompletedGeneration(operationId, result);
  }
  
  res.status(200).send('OK');
});
```

---

## Error Handling

```typescript
enum OmniFlashErrorCode {
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  CONTENT_POLICY_VIOLATION = 'CONTENT_POLICY_VIOLATION',
  GENERATION_FAILED = 'GENERATION_FAILED',
  TIMEOUT = 'TIMEOUT',
  INVALID_PROMPT = 'INVALID_PROMPT',
  MODEL_OVERLOADED = 'MODEL_OVERLOADED',
  UNSUPPORTED_EDIT = 'UNSUPPORTED_EDIT'
}

// Retry strategy specific to generation jobs
const omniRetryConfig = {
  maxRetries: 2,
  retryableErrors: [
    OmniFlashErrorCode.MODEL_OVERLOADED,
    OmniFlashErrorCode.TIMEOUT
  ],
  backoffMs: 10000,   // 10s base (generation is slow, no rapid retry)
  maxBackoffMs: 60000 // 60s max
};
```

---

## Implementation Checklist

### Pre-API Launch (Now)
- [x] Write connector specification
- [ ] Add generation_jobs + generation_quotas DB tables
- [ ] Build OmniFlashConnector class (stub methods, ready to fill)
- [ ] Build 4 salon video templates
- [ ] Build /api/v1/generation/* endpoints (with stub connector)
- [ ] Build frontend "AI Video" creation UI
- [ ] Set up Google Cloud project for Vertex AI
- [ ] Request API early access / waitlist

### API Launch Day
- [ ] Fill in real API endpoints and auth
- [ ] Run integration tests
- [ ] Enable for Pro+ tiers
- [ ] Monitor first 100 generations for quality/cost

### Post-Launch
- [ ] Add conversation mode (iterative editing)
- [ ] Add image-to-video for before/after templates
- [ ] Integrate with Clipify (Omni generates, Clipify reframes)
- [ ] Build ad creative pipeline (Omni → captions → publish → ads)
- [ ] Add generation analytics (which videos perform best)

---

## Relationship to Existing Systems

| System | Integration |
|--------|------------|
| **Clipify** | Omni generates raw video → Clipify reframes + burns captions for short-form |
| **AI Content Engine** | Content brief from AI → Omni generates video → published with AI captions |
| **SiteFlow** | Omni generates hero videos for website builder |
| **Review Sentry** | Omni generates review response videos (thank-you reels) |
| **Google Ads API** | Omni generates ad creative → published as video ads |
| **Composio** | NOT used for Omni — direct Google AI API integration |

---

## Cost Projections

### Per-Generation Estimates
| Output | Duration | Est. Cost | Tier |
|--------|----------|-----------|------|
| 15s Reel | 15s | $0.60 | All |
| 30s Story | 30s | $1.20 | Pro+ |
| 60s Ad | 60s | $2.40 | Elite |
| 2min Tutorial | 120s | $4.80 | Elite |

### Monthly Platform Cost (20 salons)
| Scenario | Generations/Mo | Cost/Mo |
|----------|---------------|---------|
| Light (4 reels each) | 80 | $48 |
| Medium (8 reels + 2 ads) | 200 | $240 |
| Heavy (15 reels + 5 ads) | 400 | $600 |

**At 20 salons on Pro ($199/mo each = $3,980 revenue), $240 video cost = 6% COGS. Excellent margin.**