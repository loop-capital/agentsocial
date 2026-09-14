# Video Content AI Team — Overview

**Status**: Phase 1 complete (6 specialist skills + Director orchestration)
**Location**: `/agents/video-team/`
**Next**: Phase 2 (scrape training data), Phase 3 (feedback loop)

---

## Team Structure

```
You (Human) → Director → 6 Specialists
                           ↓
      ┌──────────┬──────────┬──────────┬──────────┬──────────┐
      ↓          ↓          ↓          ↓          ↓          ↓
Scriptwriter  Prompt     Avatar     Render     Quality    Post-Production
              Engineer   Coach      Manager    Reviewer
```

---

## The Pipeline

### Full Workflow: "Friday Reel for Jessica, Balayage"

```
1. YOU → "Make a Friday Reel for Jessica, before/after balayage"

2. DIRECTOR → Breaks into tasks, spawns specialists

3. SCRIPTWRITER → Writes:
   - Hook: "Wait for the reveal at the end 😍"
   - Script body (30s, timestamped)
   - LTX visual description
   - Hashtags: #balayage #hairtransformation #pleijsalon

4. PARALLEL SPAWN:
   a. PROMPT ENGINEER → Converts to LTX prompt:
      [VISUAL] Close-up of a professional hairstylist with shoulder-length brown hair applying blonde balayage highlights. Warm salon lighting, shallow depth of field. Camera slowly pans to reveal the finished result...
      [SPEECH] Watch how the color lifts from a rich caramel to a bright honey blonde...
      [SOUND] Soft upbeat background music, salon ambient sounds...
      
   b. AVATAR COACH → Checks Jessica's IC-LoRA:
      - Status: trained ✅
      - Avatar ID: "pleij-jessica-001"
      - Reference images: [URLs]
      - Voice sample: [URL]

5. RENDER MANAGER → Submits to RunPod:
   - Model: ltx-avatar-id-lora
   - GPU: A100
   - Estimated cost: $0.18
   - Estimated time: 8 minutes
   - Returns job ID

6. POST-PRODUCTION → Processes completed video:
   - Color grade: warm-salon LUT
   - Text overlays: "Wait for the reveal" (2s), "Jessica, Senior Stylist" (lower left)
   - Transition: swipe-left for before→after
   - Music: upbeat-pop-04 at -14dB
   - Exports: reels_final.mp4, tiktok_final.mp4, thumbnail.jpg

7. QUALITY REVIEWER → Reviews:
   - Identity: ✅ Jessica looks like herself
   - Brand: ✅ Warm, professional, not pushy
   - Platform: ✅ 9:16, 30s, hook in first 1s
   - Score: 4.2/5 → APPROVED

8. DIRECTOR → Presents to you:
   "Done. Video ready for Friday. Score: 4.2/5. Cost: $0.18. Preview: [URL].
   Approved for scheduling?"

9. YOU → "Looks good, schedule it."
10. DIRECTOR → Schedules for Friday 11 AM EST, logs to content calendar.
```

---

## Files Created

| File | Lines | Description |
|------|-------|-------------|
| `director/SKILL.md` | 213 | Orchestration logic, decision rules, API reference |
| `scriptwriter/SKILL.md` | 279 | Briar PBA framework, platform templates, hook formulas |
| `prompt-engineer/SKILL.md` | 291 | LTX syntax, model selection, camera angles, lighting, negative prompts |
| `avatar-coach/SKILL.md` | 179 | Stylist profiles, IC-LoRA training, identity preservation |
| `render-manager/SKILL.md` | 180 | RunPod job lifecycle, cost tracking, failure handling |
| `quality-reviewer/SKILL.md` | ~160 | Brand standards, drift detection, scoring rubric, escalation |
| `post-production/SKILL.md` | ~200 | Color grading, text overlays, transitions, music, platform exports |
| `TEAM.md` (this file) | — | Team overview, pipeline, quick reference |

---

## Cost Model

| Component | Cost per Item | Monthly (PLEIJ) |
|-----------|--------------|-----------------|
| LTX video generation | $0.05-0.25 | $2.86-8.00 |
| IC-LoRA training (one-time) | $0.50-1.00 | $2.00-4.00 (4 stylists) |
| Post-production (Cloudinary) | $0.01-0.05 | $0.32-1.60 |
| **Total per month** | — | **$3.18-13.60** |

**vs muapi**: $1.50/video character video × 32 videos = $48/month
**Savings: $34-45/month** (70-94% reduction)

---

## Next Steps

### Phase 1: ✅ DONE
All skill files built and integrated with LTX provider adapter.

### Phase 2: Scrape Training Data (This Week)
1. Use Agent Reach to scrape top salon YouTube channels
2. Extract hook patterns, engagement metrics, video structures
3. Add structured data to each agent's SKILL.md
4. Build content extraction processor

### Phase 3: Feedback Loop (Ongoing)
1. Connect Plausible analytics to Director
2. Score each video by actual engagement
3. Feed scores back to Scriptwriter and Prompt Engineer
4. Retrain IC-LoRA when identity drift detected
5. Optimize GPU selection based on success rate

---

## How to Use

### Single Video
```
"Make an Instagram Reel for Jessica, before/after balayage transformation"
```

### Weekly Batch
```
"Generate this week's PLEIJ content: 3 Reels, 2 TikToks, 1 GBP video"
```

### Onboard New Stylist
```
"Add new stylist: Maria, Senior Colorist. Photos: [URLs], Voice: [URL]"
```

### Check Pipeline Status
```
"Status of the video team — what's in production?"
```

---

## API Integration

The team uses the Generation API built today:
- `POST /generate/video/ltx` — LTX video generation
- `POST /generate/avatar` — Avatar video with identity + voice
- `POST /generate/avatar/train` — Train IC-LoRA
- `GET /generate/avatar/:avatarId` — Check training status

Source files:
- `packages/api/src/services/generation-ltx.ts`
- `packages/api/src/services/pleij-avatars.ts`
- `packages/api/src/services/generation.ts`
- `packages/api/src/routes/generation.ts`
