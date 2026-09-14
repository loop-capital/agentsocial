# AI Video Generation: Prompt Engineering & Technical Optimization Reference

> Compiled: 2026-09-02 | Focus: LTX Video, ID-LoRA, and cross-platform best practices
> Sources: Lightricks official docs, Skywork AI, Dream Pixel Forge, Crepal, ComfyUI community, HuggingFace, ID-LoRA paper, and multiple practitioner guides

---

## Table of Contents

1. [LTX Video Prompt Engineering](#1-ltx-video-prompt-engineering)
2. [ID-LoRA / IC-LoRA Identity Preservation](#2-id-lora--ic-lora-identity-preservation)
3. [Cross-Platform High-Quality Prompt Patterns](#3-cross-platform-high-quality-prompt-patterns)
4. [Negative Prompt Library](#4-negative-prompt-library)
5. [Common Artifacts & How to Avoid Them](#5-common-artifacts--how-to-avoid-them)
6. [Camera Movement Prompts](#6-camera-movement-prompts)
7. [Lighting Prompts](#7-lighting-prompts)
8. [Aspect Ratio & Resolution Best Practices](#8-aspect-ratio--resolution-best-practices)
9. [Audio/Speech Prompting for Talking Head Videos](#9-audiospeech-prompting-for-talking-head-videos)
10. [LoRA Fine-Tuning for Identity Preservation](#10-lora-fine-tuning-for-identity-preservation)

---

## 1. LTX Video Prompt Engineering

### 1.1 Core Prompt Structure (LTX-2 / 2.3 / 2.5)

LTX prompts are written as **prose, not tags**. No token syntax, no weight brackets, no quality-tag tail. LTX's official documentation specifies **six elements** in one flowing paragraph:

1. **Shot** — Establish shot scale and camera type. Use real cinematography terms. "A low-angle medium shot" is instruction; "a beautiful shot" is not.
2. **Scene** — Lighting condition, color palette, surface texture, atmosphere. One coherent light logic per shot; mixed sources confuse results.
3. **Action** — Natural sequence flowing beginning to end, in present tense.
4. **Character** — Age, hairstyle, clothing, distinguishing features. Express emotion through physical cues, not labels. Write "his jaw tightens and he looks away" rather than "he is sad."
5. **Camera movement** — Including when it happens. Describe how subjects look after the move to help the model complete the motion.
6. **Audio** — Ambient sound, music, speech. Spoken dialogue in quotation marks. Specify language and accent.

**Optimal prompt formula:**

```
[Scene anchor] : [Subject + Action] : [Camera + Lens] : [Visual Style] : [Motion/Time Cues] : [Guardrails]
```

**Compact example:**

> "Misty alpine lake at dawn: red canoe gliding: slow dolly-right, 50mm, f/2.8, medium-wide: soft contrast, Kodak 2383: natural motion blur, 50 fps feel: no flicker, no high-frequency patterns."

### 1.2 LTX Version Differences

| Version | Notes |
|---------|-------|
| **LTX-Video (0.9.x)** | Original open-weights. 200-word prompt cap. Keep prompts under that limit. |
| **LTX-2** | Released Jan 2026. Deprecated on API July 15, 2026. Requests now routed to LTX-2.3. |
| **LTX-2.3** | Most third-party tools/tutorials built on this. IC-LoRA support. |
| **LTX-2.5** | Current release (Aug 2026). 22B distilled transformer, Gemma 4 12B text encoder, native 4K HDR, native multishot, automatic duration prediction. |

Prompt grammar is shared across versions. A good LTX-2.3 prompt is a good LTX-2.5 prompt. Only multishot is version-specific (LTX-2.5 only).

### 1.3 Key Prompting Principles

- **Concrete nouns and verbs over vague adjectives.** "Slow dolly-in on a ceramic teapot as steam curls" beats "cozy minimalist scene" every time.
- **Lens + aperture stabilizes spatial detail.** Adding "50mm, f/2.8" reduces edge shimmer by ~18% in 4K tests.
- **Explicit camera paths reduce temporal jitter.** "Orbit 120° around subject" reduced jitter ~22%.
- **Limit texture complexity.** "No high-frequency patterns" cut moiré events by ~30% in architecture shots.
- **Short clauses render more consistently.** LTX tokenizes and respects discrete chunks. Format like a shot list, not a paragraph novel.
- **Longer prompts are fine if every sentence adds concrete visual or audio detail.** Sentences that add adjectives without information hurt quality.
- **Image-to-video: describe what happens, not what it looks like.** The source image already decided appearance. Re-describing the frame causes drift.

### 1.4 LTX-2.5 Multishot Prompts

Multishot requires a different approach from single-shot:

| Element | Single Shot | Multishot |
|---------|-------------|-----------|
| Camera | One continuous take | New framing after every cut |
| Transitions | Camera moves only | Name the edit: hard cut, match cut, dissolve |
| Continuity | Same space/subjects throughout | Re-identify subjects when they reappear |
| Audio | One continuous soundscape | State at each cut whether sound continues or changes |

**Every cut must do four things:**
1. Name the transition in plain language ("a hard cut transitions to")
2. Re-establish shot scale and framing
3. Keep the subject identifiable by reusing visual identifiers
4. State what happens to the audio across the cut

**LTX's own multishot example:**

> "A wide shot frames a rainy city intersection at dusk, neon signs reflecting on wet asphalt. A young woman in a yellow raincoat walks toward camera, gripping a folded newspaper, while cars hiss past behind her. Soft synth music and distant traffic fill the air. A hard cut transitions to a medium close-up of her face under the hood, raindrops catching the neon as she looks off-screen left; the synth score continues across the cut, traffic muffled. She whispers, 'He's late.' Another hard cut jumps to a low-angle shot of a man's scuffed boots stepping into a puddle at the curb; the music drops to a low drone. He lifts his head into frame, short dark hair, soaked jacket, and smiles toward her off-screen as a bus rumbles past."

Prefer **2-4 shots** per generation. More cuts need shorter, clearer beats per shot. Use chronology markers: "initially," "a moment later," "simultaneously."

### 1.5 ComfyUI-Specific LTX Parameters

- **Distilled LoRA** (~900 MB) is required for the two-stage pipeline
- **CFG scale:** 4 with distilled model (no classifier-free guidance needed for distilled)
- **Steps:** 8 recommended for distilled; 20 for first-pass sampling with non-distilled
- **Resolution buckets:** LTX uses bucket-based resolution. Common: 768×432, 768×512, 1024×576
- **First frame injection:** I2V injects source image at strength 0.7 (stage 1) then 1.0 (stage 2)
- **First frame / last frame template** (`video_ltx2_5_flf2v`): Single-stage, no 2x upscale, prompt describes the *journey* between frames

### 1.6 50 FPS Motion Keywords

For smooth 50 FPS output:

| Category | Effective Tokens |
|----------|-----------------|
| Motion intent | `steady dolly`, `tripod-locked`, `smooth gimbal`, `constant speed pan`, `subtle parallax`, `slow-motion at 50 fps feel` |
| Shutter/blur | `180° shutter equivalent`, `natural motion blur`, `no strobing`, `no judder` |
| Pathing | `orbital move around subject`, `push-in two meters`, `crane down 2m to eye level`, `truck left 1m` |
| Stabilizers | `minimal micro-jitter`, `film-like cadence`, `avoid micro-warp` |

**Adding "steady dolly" + "180° shutter" reduced perceived judder by ~15-20%. Specifying "push-in 2m" improved motion coherence by ~12%.**

### 1.7 Guardrails (Built into LTX Prompts)

Append these at the end of your LTX prompt:

```
no flicker, no high-frequency patterns, no text overlays
```

For architecture:
```
no moiré, no shimmer on repeating textures, no geometric distortion
```

For faces/people:
```
no face morphing, no extra fingers, no body drift
```

---

## 2. ID-LoRA / IC-LoRA Identity Preservation

### 2.1 What ID-LoRA Does

ID-LoRA (Identity-Driven In-Context LoRA) generates synchronized video AND audio in a single pass. Given:
- A reference image (single face photo)
- A reference audio clip (short voice sample)
- A text prompt

It produces video where the subject **looks like the reference** and **sounds like the reference**, in novel contexts.

Key paper result: ID-LoRA is preferred over Kling 2.6 Pro by **73% of annotators for voice similarity** and **65% for speaking style**.

### 2.2 ID-LoRA vs Standard LoRA vs IC-LoRA

| Feature | Standard LoRA | IC-LoRA | ID-LoRA |
|---------|--------------|---------|---------|
| Activation | Text trigger token | Reference image at inference | Reference image + audio at inference |
| What it learns | Style, concept, motion pattern | Identity mapping from reference to output | Identity + voice mapping |
| Training steps | 1000-2000 | 4000-6000 | 4000-6000 |
| Rank | 32 typical | 128 | 128 |
| Inference input | Text prompt only | Text + reference image | Text + reference image + audio |

### 2.3 ID-LoRA Prompt Format (Three-Tag System)

The ID-LoRA workflow splits prompts into three tagged sections:

```
[VISUAL]: A close-up of a person speaking, warm indoor lighting, slight smile, facing camera
[SPEECH]: Hello, welcome to our channel.
[SOUNDS]: Calm, measured speaking tone, soft room tone, no music
```

**Rules:**
- **[VISUAL]** describes scene and appearance. For identity-preserved generation, do NOT re-describe the person's physical features — the reference image carries identity. Describe action, framing, environment.
- **[SPEECH]** contains the exact words to be spoken, in quotation marks within the audio.
- **[SOUNDS]** describes speaking style, ambient sounds, music presence/absence.

### 2.4 IC-LoRA Prompting Best Practices (LTX-2.3 Identity)

**DO:**

```
"person speaking directly to camera, warm indoor lighting, natural expression"
"subject walking through a park, relaxed pace, late afternoon sunlight"
"presenter gesturing while explaining, clean white background, professional"
```

**AVOID:**

```
"young woman with brown curly hair and green eyes speaking..."
```

Describing physical traits in the prompt competes with the reference image signal. The model has two sources telling it what the subject looks like — they won't agree perfectly, causing drift or feature blending.

### 2.5 ID-LoRA Training Configuration

```yaml
model:
  checkpoint_path: /path/to/ltx-2.3-22b-dev.safetensors
  text_encoder_path: /path/to/gemma-3-12b-it-qat-q4_0-unquantized

dataset:
  dataset_file: dataset.json
  resolution_buckets:
    - "768x432x49"

training_strategy: audio_ref_only_ic  # IC-LoRA strategy

optimization:
  learning_rate: 1.0e-4
  batch_size: 1
  max_train_steps: 6000
  gradient_checkpointing: true

lora:
  rank: 128    # ID-LoRA uses rank 128 for identity fidelity
  alpha: 128

validation:
  validation_steps: 500
  reference_image: /path/to/validation_ref.jpg
  reference_audio: /path/to/validation_voice.wav
  validation_prompts:
    - "person speaking calmly, neutral background"
```

### 2.6 Dataset Requirements for Identity Training

**Minimum viable dataset:**
- **30-50 video clips** of the subject, each 3-10 seconds, consistent lighting, face clearly visible
- **Paired reference frames** for each clip (first frame or held portrait shot)
- **For voice identity:** 5-10 audio reference clips, 5-15 seconds each

**Caption format (JSON):**

```json
[
  {
    "video_path": "data/clip_001.mp4",
    "reference_image": "data/ref_001.jpg",
    "reference_audio": "data/voice_001.wav",
    "caption": "person speaking directly to camera, natural lighting, slight smile"
  }
]
```

**Critical:** Keep captions descriptive but generic. Don't over-specify physical features. The reference image carries identity; the caption describes scene and action. If captions say "brown-haired woman" but reference frames show someone else, the model gets confused.

### 2.7 LTX-Best-Face-ID LoRA (Community)

An alternative identity LoRA from Alissonerdx with two modes:

**Face ID Base (close-up reference):**
- Prefix prompts with `ref_t2v:`
- Describe action, setting, framing, camera in present-progressive
- Describing identity attributes (skin tone, hair, eyes, facial hair, glasses, face shape) **noticeably improves results**
- Reference image: **close-up / bust crop, frontal or near-frontal, single subject, centered, well-lit**
- Training crop size: ~460×406 (nearly square)
- Full-body shots or wide shots where face is small work **noticeably worse**

**Example (enhanced with identity attributes):**

```
ref_t2v: A light-skinned man with long dark-brown hair past his shoulders, narrow rectangular metal-frame glasses, light blue-gray eyes and light stubble is folding clothes in a laundry room, medium-wide shot. He places the shirt flat on the folding board, smooths the fabric with both hands, and reaches for the next item on the pile.
```

**Character-Sheet Mode (face + body reference):**
- 4-panel character sheet image: face close-up + front/side/back views on white background
- Exact resolution: **1536×1024** (fixed, not resized)
- Set `ref_resize_mode = native_resolution` (NOT match_target)
- Can mix base FaceID LoRA at ~0.2 strength alongside character-sheet LoRA for stronger identity + clothing/body consistency

**Building a character sheet prompt:**

> "Convert the person in the photo into a character reference sheet with four panels arranged left to right: a close-up of the face, then full-body front, side, and back views, on a white background."

### 2.8 Identity Drift Limitations

- **Identity holds well for 5-20 second clips** — maps to LTX 2.3's generation range
- **For longer sequences, drift accumulates** — the character may look subtly different at second 25 vs second 5
- **Practical fix:** Generate in segments and cut at natural edit points
- **Multi-subject:** IC-LoRA is trained on single-identity reference. Two-person scenes with two distinct references are not natively supported
- **Extreme pose/lighting changes:** Reduces identity fidelity. Stay reasonably close to training data conditions

---

## 3. Cross-Platform High-Quality Prompt Patterns

### 3.1 Universal Prompt Structure (Works on Runway, Pika, Kling, LTX, Veo)

```
[Shot type] + [Subject] + [Action] + [Setting/Environment] + [Lighting] + [Camera movement] + [Style/Mood] + [Technical specs]
```

**Example (assembled):**

> "A low-angle medium shot of a woman in her forties with gray-streaked hair tied back, wearing a worn canvas apron, standing at a steel workbench in a narrow ceramics studio. Late-afternoon light through a single dusty window on the left, warm on her hands, falling off into deep shadow behind her. She lifts a half-finished bowl, turns it once against the light, and sets it back down. Slow push-in to the bowl. Soft contrast, Kodak 2383 print look. Natural motion blur, 50 fps feel. Ambient sound: low kiln hum, distant radio, no music."

### 3.2 Platform-Specific Notes

| Platform | Strengths | Prompt Style | Key Notes |
|----------|-----------|-------------|-----------|
| **LTX-2/2.3/2.5** | Prose prompts, audio-video joint, multishot | Cinematographer paragraph | Write like a shot note. Lens + aperture spec helps. Audio belongs in the prompt. |
| **Runway Gen-4/4.5** | Best subject consistency, natural motion | Short descriptive sentences | Image reference + text. Keep under 1000 chars. "Camera" section accepted. |
| **Pika 2.1** | Quick iterations, creative effects | Simple descriptive prompts | Works well with scene + mood format. Modify parameters > long prompts. |
| **Kling AI** | Long duration, character lock feature | Detailed scene descriptions | Character Lock mode for face consistency. Motion brush for targeted movement. |
| **Veo 3/3.1** | Best overall visual quality, audio generation | Component-based (subject, context, action, style, camera, composition) | Separate each element clearly. Most tolerant of long prompts. |
| **Sora 2** | Complex scene understanding | Natural language storytelling | Describe scene progression naturally. Can handle complex multi-action scenes. |

### 3.3 What Produces High-Quality Results (Across All Platforms)

Based on analysis of 40,000+ generated videos (Vivideo data):

1. **Subject + action specificity** outperforms abstract descriptions by 2-3x
2. **One primary motion per shot** dramatically reduces artifacts
3. **Camera movement specified** → 40% more coherent output than unspecified
4. **Lighting direction stated** → more consistent renders than "atmospheric" or "moody"
5. **Style references** (film stocks, directors) → more cohesive look than "cinematic"
6. **Audio cues in prompt** (LTX-specific) → better video-audio sync

### 3.4 Prompt Patterns by Content Type

**Talking Head / Avatar Content:**
```
[Subject description] speaking to camera, [framing], [lighting], [background], 
[emotional tone], [camera movement]. Voice: [tone/accent]. Ambient: [sound description].
```

**Product Demo:**
```
[Product name] with [key feature], [camera angle], [lighting setup], 
[background type]. [Specific action or rotation]. Commercial-grade [color/contrast style].
```

**Cinematic Scene:**
```
[Shot type] of [subject] [action] in [setting]. [Lighting direction and quality].
[Camera movement, lens, aperture]. [Color grade, film stock reference]. 
[Time-of-day/atmosphere]. [Motion quality]. [Guardrails].
```

**Social Media Short-Form:**
```
[Subject] [single clear action], [tight framing], [punchy lighting], 
[fast or specific camera move], [contrast grade], [duration-appropriate].
```

---

## 4. Negative Prompt Library

### 4.1 The Surgical Negative Framework

**Do NOT use the "kitchen sink" approach** — overloading negative prompts degrades coherence. Instead:

1. **Baseline render** with positive prompt only
2. **Identify** the single most dominant artifact
3. **Add one surgical negative** targeting that artifact
4. **If motion is dampened**, remove the negative and refine positive motion adjectives instead
5. **Iterate** with 2-3 rerolls

### 4.2 Negative Prompt Libraries by Category

**General Video Quality:**
```
blurry, low resolution, distorted, watermark, text overlay, low quality, 
compression artifacts, pixelated, overexposed, underexposed
```

**Face & Body:**
```
extra fingers, mutated hands, missing fingers, extra limbs, deformed face, 
asymmetric eyes, face morphing, bad anatomy, disfigured, body drift, 
melting face, plastic skin, uncanny valley
```

**Motion & Temporal:**
```
frame skipping, ghosting, flickering, jitter, judder, strobing, 
temporal inconsistency, frame drop, motion blur excessive, background warping
```

**Architecture & Objects:**
```
morphing objects, melting furniture, bending architecture, unstable geometry, 
textured surface shimmer, moiré, geometric distortion, over-texturing
```

**Lighting & Color:**
```
blown highlights, crushed shadows, oversaturated, neon glow excessive, 
color shift, inconsistent lighting, blown out, HDR artifacts
```

**LTX-Specific Negatives (from community testing):**
```
no flicker, no high-frequency patterns, no text overlays, no moiré on repeating textures
```

**Wan 2.6/2.7 Negatives (from Artlist testing):**
```
no extra creatures, no excessive fireflies, no heavy fog layers, no background clutter, 
no additional props, no over-texturing, no exaggerated lighting effects
```

**E-Commerce / Product Negatives:**
```
blurry, low resolution, distorted text, extra fingers, morphing objects, 
cartoon style, watermark, bad anatomy, shaky camera, fake UI
```

### 4.3 Platform-Specific Negative Prompt Notes

| Platform | Negative Prompt Support | Notes |
|----------|------------------------|-------|
| LTX-2/2.3/2.5 | Supported (negative_prompt parameter) | Works well with surgical approach. Distilled model less sensitive to negatives. |
| Runway Gen-4 | Limited/none in UI | Use positive prompt refinement instead. |
| Kling AI | Supported | Effective for artifact reduction. Character Lock mode reduces need for identity negatives. |
| Pika 2.1 | Not exposed in standard UI | Adjust parameters instead. |
| Veo 3 | Supported | Be specific, not exhaustive. |

### 4.4 What NOT to Put in Negatives

- **"bad quality"** — too vague, creates noise in latent space
- **"ugly"** — subjective, inconsistent across training data
- **Long generic lists** — can reduce coherence by creating contradictions in the probability space
- **Motion terms that conflict with your positive prompt** — e.g., "fast" in negatives + "slow pan" in positives = stuck frame
- **Over-detailed negatives** — limit to 5-8 specific terms maximum

---

## 5. Common Artifacts & How to Avoid Them

### 5.1 Artifact Diagnosis Table

| What You See | Likely Cause | First Fix |
|-------------|-------------|-----------|
| Brightness/color pulses | Lighting changes between frames | Lock one lighting description, remove competing light effects |
| Hair/fabric/grass/wall shimmer | High-frequency texture instability | Clean/simplify source texture, add "no high-frequency patterns" |
| Face/hands/product melting | Structural/identity drift | Reduce subject motion, shorten shot duration |
| Camera stutter | Camera and subject motion compete | Lock the camera, test subject motion alone |
| Background lines bend/objects breathe | Clutter or too much scene change | Simplify background, request one environmental effect |
| Morphing between subjects | Identity not anchored | Use reference image (I2V), don't re-describe appearance in prompt |

### 5.2 Specific Fixes by Artifact Type

**Flicker (brightness/color pulsing):**
- Lock lighting to one source with direction: "single window light from camera left"
- Add to prompt: "consistent lighting throughout, no light changes"
- Negative: "flicker, lighting changes, brightness variation"

**Shimmer (texture instability on hair, fabric, walls):**
- Simplify textures in source image before generating
- Prompt: "smooth surfaces, minimal texture detail"
- Negative: "shimmer, texture flicker, high-frequency patterns"

**Morphing (face/body/product shape shift):**
- Use image-to-video with a clear reference frame
- Reduce motion in prompt: fewer actions, slower movement
- Shorten clip duration (prove the shot at 3-4 seconds first)
- IC-LoRA / ID-LoRA for face consistency

**Judder (stuttery camera motion):**
- Specify concrete camera path with distance: "push-in 2m" not just "push in"
- Add shutter language: "180° shutter equivalent, natural motion blur"
- Anchor foreground elements for parallax: "tall grass in foreground, stationary"

**Moiré (crawling patterns on architecture/textiles):**
- Add: "no moiré, no high-frequency patterns, soften distant repeating textures"
- Avoid detailed grid patterns in source images
- Use wider aperture prompts: "50mm f/2.8" to reduce sharp detail in background

### 5.3 The Reduce Complexity Principle

**The single most important rule for artifact reduction:**

> Reduce complexity before you increase quality.

- Cleaner source image
- Fewer moving parts
- Simpler prompt
- Shorter shot
- Calmer camera movement

This helps more than trying to fix artifacts after generation.

### 5.4 Safe vs Risky Motion

| Safe (Beginner-Friendly) | Risky (Artifact-Prone) |
|--------------------------|----------------------|
| Breathing slowly, blinking naturally, turning slightly | Full spins, rapid camera orbits, crash zooms |
| Hair moving in the breeze, steam rising | Dancing + environment change + heavy particles |
| Gentle push-in, slow dolly left, subtle handheld | Large body movement from a still image |
| Static wide shot with environmental motion | Multiple simultaneous actions |
| Slow product turntable rotation | Fast camera arcs with subject movement |

### 5.5 Consistency-Friendly Prompt Formula

```
Subject + small motion + simple camera move + one environment detail
```

**Examples:**
- "A woman in window light, blinking softly, slow push in, faint dust drifting in the air"
- "A modern living room, sunlight shifting gently across the floor, static wide shot, curtains moving slightly in the breeze"
- "A luxury watch, rotating slowly, macro close-up, soft reflections moving across the metal"

---

## 6. Camera Movement Prompts

### 6.1 Core Camera Movements with Copy-Ready Prompts

| Technique | Prompt Phrase | Primary Effect | LTX-Specific Notes |
|-----------|---------------|----------------|--------------------|
| Pan | `slow pan from left to right` | Horizontal reveal | Add speed: `moderate pan right`, `quick pan left` |
| Tilt | `tilt up from the base to the top` | Vertical reveal | Pair with subject: `tilt up from boots to face` |
| Zoom in | `slow optical zoom toward the detail` | Visual emphasis | Dolly-in is preferred for parallax |
| Zoom out | `zoom out to reveal the environment` | Context and scale | Better as dolly-out for perspective |
| Tracking | `tracking shot moving with the subject` | Immersion in motion | Foreground blurs at different rate than background |
| Dolly in | `gentle physical push toward the subject` | Intimacy and tension | Physical distance = natural parallax |
| Dolly out | `slow physical pullback` | Isolation and revelation | Better than zoom-out for 3D feel |
| Arc/Orbit | `180-degree clockwise arc around the subject` | 3D spatial reveal | Specify degrees and direction |
| Crane | `crane up 3m then settle at eye level` | Scale and grandeur | Specify end position |
| Steadicam | `smooth steadicam following the subject` | Documentary feel | Better than "handheld" for stability |
| Tripod-locked | `tripod-locked, static shot, environmental motion only` | Stability and control | Use for product shots and landscapes |
| Rack focus | `controlled rack focus from foreground to background` | Selective attention | Works well with 100mm or telephoto |
| Low angle | `low-angle shot looking up at the subject` | Power and dominance | Pair with wide lens |
| Overhead | `top-down overhead, 50mm macro, tripod-locked` | Product/tabletop | Good for flat-lay and food |

### 6.2 Multi-Step Camera Sequences (LTX-2.5 Multishot)

For multi-beat camera work, use timing language:

> "The camera starts static on the subject's boots, then tilts up slowly to their face, then dollies in as the chorus hits."

Words like "starts," "then," and "as" act as edit points inside a single prompt.

### 6.3 Camera + Lens Combos That Work

| Combo | Prompt Fragment | Best For |
|-------|-----------------|----------|
| 35mm f/2.0 + dolly-in | `slow dolly-in, 35mm, f/2.0, medium close-up` | Intimate character moments |
| 85mm f/1.8 + orbit | `orbit 120° around subject, 85mm, shallow depth` | Product reveals, hero shots |
| 24mm + crane | `crane up 3m then settle at eye level, 24mm` | Establishing shots, architecture |
| 50mm f/2.8 + tripod | `tripod-locked, parallax from foreground reeds, 50mm` | Nature, stability |
| 100mm macro + rack focus | `controlled rack focus foreground→logo, 100mm` | Product detail |
| 40mm anamorphic + push-in | `push-in 2m, anamorphic 40mm, oval bokeh` | Cinematic narrative |
| 200mm + tripod-locked | `long lens compression 200mm, tripod-locked, distant wildlife` | Nature doc, compression |

### 6.4 What to Avoid in Camera Prompts

- **"Cinematic camera movement"** — meaningless, no specific instruction
- **"Dynamic"** — the model interprets this as fast/random, not controlled
- **Multiple complex moves in one shot** — "dolly in while orbiting while zooming" = instability
- **Conflicting motion + negative** — "slow pan" + "no fast movement" can cancel each other

---

## 7. Lighting Prompts

### 7.1 Source-Specific Lighting (More Effective Than Vague Terms)

Vague terms like "dramatic," "moody," or "atmospheric" underperform. Name the **source + direction + interaction**:

| Lighting Look | Effective Prompt | Avoid |
|--------------|-----------------|-------|
| Golden hour | `Warm 3000K light hitting from a low horizon angle, long soft-edged shadows` | `beautiful sunset lighting` |
| Film noir | `Hard side lighting with blinds pattern, extreme contrast, deep shadows` | `dark and moody` |
| Neon / cyberpunk | `Neon signage casting colored pools on wet surfaces, rim lighting from signs` | `cool neon vibe` |
| Studio soft | `Key light 45° softbox feel, fill from camera right at half intensity` | `professional lighting` |
| Rembrandt | `Strong 45° key light from above-left, triangle of light on far cheek, deep shadows` | `classic portrait lighting` |
| Overcast/documentary | `Flat, diffused overcast daylight, minimal shadows, high CRI` | `natural light` |
| Rim/edge | `Rim light separation from behind, dark front, edge glow on shoulders and hair` | `backlit` |
| Practical | `Motivated practicals, desk lamp casting warm pool, screen glow from monitor` | `interesting lighting` |
| Blue hour | `Blue hour, cool ambient light from the sky, warm sodium streetlights below` | `evening lighting` |
| Candle/fire | `Warm flickering candlelight from camera left, deep shadow falloff, orange cast` | `warm cozy lighting` |

### 7.2 LTX-Specific Lighting Advice

From LTX's official guide: **one coherent light logic per shot works best.** Mixed light sources confuse the result.

Good: "Late-afternoon light comes through a single dusty window on the left, warm on her hands and falling off into deep shadow behind her."

Bad: "Dramatic lighting with colorful neon and warm candlelight and soft window light."

### 7.3 Lighting + Camera Synergy Prompts

**Moody narrative:**
```
low-key lighting, tungsten warmth, halation, 35mm f/2.0, slow dolly-in, soft contrast, film grain fine
```

**Tech commercial:**
```
hard rim lights on matte black, glossy highlights controlled, 50mm hero push-in 1m, true-to-life color, no flicker, 50 fps feel
```

**Nature doc:**
```
long lens compression 200mm, tripod-locked, distant wildlife, natural color science, gentle breeze movement, no sudden camera moves
```

**Luxury beauty:**
```
macro shimmer, soft gradation highlights, 100mm macro, cross-light sweep, skin-tone accurate, minimal micro-jitter
```

**Social snappy:**
```
bright key light, punchy color, 35mm, snap zoom 10% then settle, clean whites, no text overlays
```

---

## 8. Aspect Ratio & Resolution Best Practices

### 8.1 Platform-Specific Recommendations

| Platform | Aspect Ratio | Resolution | Notes |
|----------|-------------|------------|-------|
| **YouTube (standard)** | 16:9 | 1920×1080 or 3840×2160 | Standard landscape. LTX-2.5 native 4K. |
| **YouTube Shorts** | 9:16 | 1080×1920 | Vertical, full-screen mobile |
| **TikTok** | 9:16 | 1080×1920 | Optimal. 1080×1920 minimum. |
| **Instagram Reels** | 9:16 | 1080×1920 | Full-screen vertical. 95% of mobile consumption. |
| **Instagram Feed Video** | 1:1 or 4:5 | 1080×1080 or 1080×1350 | Square or portrait. |
| **Instagram Stories** | 9:16 | 1080×1920 | Vertical full-screen. |
| **X/Twitter** | 16:9 | 1920×1080 | Landscape preferred. |
| **LinkedIn** | 16:9 or 1:1 | 1920×1080 or 1080×1080 | Professional content, landscape or square. |
| **Facebook Feed** | 16:9 or 1:1 | 1920×1080 or 1080×1080 | Landscape or square. |
| **Facebook Reels/Stories** | 9:16 | 1080×1920 | Vertical. |
| **Cinema/Short Film** | 2.39:1 or 2.35:1 | Anamorphic widescreen | Use "anamorphic squeeze" in LTX prompts. |

### 8.2 LTX-Specific Resolution Buckets

LTX uses resolution buckets. Common values:

| Bucket | Aspect Ratio | Use Case |
|--------|-------------|----------|
| 768×432 | 16:9 | Standard landscape generation |
| 768×512 | 3:2 | Slightly taller landscape |
| 768×768 | 1:1 | Square (Instagram feed) |
| 432×768 | 9:16 | Vertical (TikTok, Reels, Shorts) |
| 512×768 | 2:3 | Portrait |
| 1024×576 | 16:9 | Higher quality landscape |
| 576×1024 | 9:16 | Higher quality vertical |

**LTX-2.5 native 4K HDR:** 3840×2160 output. Use "4K, HDR" in style descriptors.

**For IC-LoRA/ID-LoRA training:** Use 768×432×49 resolution bucket.

### 8.3 Aspect Ratio Prompting Tips

Always include the aspect ratio intention in the prompt:
- **9:16 vertical:** "vertical framing, portrait orientation, subject fills frame top to bottom"
- **16:9 landscape:** "wide establishing shot, landscape framing, horizontal composition"
- **1:1 square:** "centered composition, square crop, balanced framing"

### 8.4 Quality vs. Duration Tradeoff

| Resolution | Max Stable Duration | Notes |
|-----------|---------------------|-------|
| 768×432 | 10-20 seconds | LTX-2.3 comfortable range |
| 1024×576 | 5-10 seconds | Higher quality, shorter stable window |
| 4K (LTX-2.5) | 5-20 seconds | Native 4K in LTX-2.5 |
| Any | >20 seconds | Identity drift accumulates. Generate in segments. |

---

## 9. Audio/Speech Prompting for Talking Head Videos

### 9.1 LTX-2.5 Audio-Video Joint Generation

LTX-2.5 generates audio in the same pass as video. Audio cues belong IN the prompt:

> "Ambient sound: the low hum of a kiln, a distant radio, no music."

**Audio prompt elements:**
- **Ambient/environmental:** "rain against the window, distant traffic, soft hum of air conditioning"
- **Music:** "subtle piano score," "no music" (explicitly state absence to prevent model from inventing one)
- **Speech:** Put dialogue in quotation marks. Specify language and accent.
- **Speaking style:** "whispered," "calm and measured," "excited, fast-paced"

### 9.2 ID-LoRA Speech Prompting

The three-tag system for identity-preserving talking heads:

```
[VISUAL]: A close-up of a person speaking to camera, warm indoor lighting, slight smile, facing camera, neutral background
[SPEECH]: Welcome to our channel. Today we're going to talk about something really exciting.
[SOUNDS]: Calm, measured speaking tone, soft room tone, no music
```

**Key rules for speech prompts:**
- **[SPEECH]** contains the exact words — the model lip-syncs to these
- **[SOUNDS]** controls speaking style, not content — "calm, measured tone" or "energetic, fast-paced"
- Specify "no music" if you don't want a background score
- Specify accent if needed: "American English accent," "British RP accent"
- The reference audio clip handles voice identity; the prompt handles tone and environment

### 9.3 Talking Head Best Practices

**Prompt structure:**

```
[Shot type] of [person/role] speaking to camera, [framing], [lighting], 
[background], [emotional tone]. [Camera movement]. Voice: [tone/accent]. 
Ambient: [sound description].
```

**Example:**

> "A medium close-up of a woman speaking directly to camera, chest-up framing, soft key light from camera left, warm indoor setting, bookshelf behind her. Slight nod and natural expression. Camera slowly pushes in. Voice: calm, confident American accent. Ambient: soft room tone, distant clock ticking, no music."

**What to avoid in talking head prompts:**
- ❌ "Person talking enthusiastically about something" — too vague
- ❌ Describing the person's appearance when using IC-LoRA — the reference image handles that
- ❌ Multiple actions alongside speaking — "gesturing wildly while pacing and speaking" = instability
- ❌ "Lip-sync" as a prompt term — the model handles this automatically; specifying it can cause over-articulation

**What works:**
- ✅ "Person speaking directly to camera, natural expression, slight nod"
- ✅ "Mouth partially open during speech with only the front teeth partially visible, lips moving naturally"
- ✅ Specify one primary motion: speaking. Secondary: subtle nod, slight head turn.

### 9.4 ID-LoRA Reference Audio Guidelines

- **5-10 audio clips** of the subject speaking, 5-15 seconds each
- Clean audio without background music or heavy noise
- Various speaking tones but same person
- The reference audio clip at inference can be 3-10 seconds
- The text prompt can describe speaking style that differs from the reference: "speaking excitedly" works even if reference audio is calm — the model can modulate style via text conditioning while preserving voice identity

### 9.5 LTX-2.3 AV-LoRA (Talking Head LoRA by elix3r)

Community LoRA for talking head generation without ID-LoRA:

**Prompt format:**

```
[scene description]. Mouth partially open during speech with only the front teeth partially visible, 
lips moving naturally without fully exposing all teeth.
```

Works best with:
- Frontal or near-frontal face references
- Simple backgrounds
- Single subject
- Natural lip movement descriptors in the prompt

---

## 10. LoRA Fine-Tuning for Identity Preservation

### 10.1 Dataset Best Practices

**Dataset size (community consensus from ComfyUI/Reddit practitioners):**
- **Minimum viable:** 15-30 images of the subject
- **Sweet spot:** 20-50 images
- **Diminishing returns:** >100 images unless carefully curated
- **Real photos > AI-generated** for likeness quality

**Image composition for face LoRAs:**

| Shot Type | Proportion | Notes |
|-----------|-----------|-------|
| Medium shots (waist-up) | 50%+ | Most versatile for different contexts |
| Close-up shots (face) | 15-20% | Essential for facial detail |
| Full body shots | 15% | For body/appearance consistency |
| Varied angles | All | Frontal, 3/4, profile, slight up/down angles |

**Image quality requirements:**
- Sharp focus on face
- Varied lighting conditions
- Varied backgrounds (not all studio)
- Varied expressions
- Consistent subject identity (same person throughout)
- Minimum ~1 megapixel resolution
- No watermarks, no heavy filters

### 10.2 Caption Strategy

**For identity LoRAs (community finding):**
- Simple one-word captions (trigger name) can work well for FLUX/WAN models
- For LTX-based LoRAs: use descriptive captions focused on scene and action, NOT physical appearance
- IC-LoRA captions: describe scene and action only; identity is carried by reference input

**Caption format for LoRA training:**

```
[trigger_word] [simple scene description]
```

Example: `ohwx person walking through a park, casual clothing, daylight`

**For IC-LoRA (LTX-2.3):**

```json
{
  "video_path": "data/clip_001.mp4",
  "reference_image": "data/ref_001.jpg",
  "caption": "person speaking directly to camera, natural lighting, slight smile"
}
```

**DO NOT over-describe physical features in captions when using IC-LoRA.** The reference image carries identity. Captions describe scene and action only.

### 10.3 Training Parameters

**Standard LoRA (face/character):**

| Parameter | Recommended | Notes |
|-----------|-------------|-------|
| Rank (dim) | 16-32 for style, 32-64 for character, 128 for identity | Higher rank = more identity capacity but more VRAM |
| Alpha | Equal to rank (common) or rank/2 | Alpha = rank is standard for identity |
| Learning rate | 1e-4 to 5e-5 | Lower for larger datasets |
| Steps | 1000-2000 (standard), 4000-6000 (identity) | Monitor for overfitting |
| Batch size | 1 (with gradient checkpointing on 24GB) | H100 allows higher |
| Optimizer | AdamW8bit or Prodigy | Prodigy auto-tunes LR |

**IC-LoRA / ID-LoRA (LTX-2.3 identity):**

| Parameter | Value | Notes |
|-----------|-------|-------|
| Rank | 128 | Required for identity fidelity |
| Alpha | 128 | Match rank for identity |
| Learning rate | 1e-4 | Standard |
| Training strategy | `audio_ref_only_ic` | For ID-LoRA; or `ic_lora` for visual-only |
| Max train steps | 5000-6000 | Identity needs more steps |
| Gradient checkpointing | true | Required for 24GB GPUs |
| Resolution bucket | 768×432×49 | LTX standard |

### 10.4 Iterative LoRA Training (Bootstrapping)

When you only have a few photos:

1. **Initial LoRA:** Train on limited images (5-10) — produce a "good enough" LoRA
2. **Generate varied images:** Use the initial LoRA to produce 20-50 varied images of the subject
3. **Curate:** Select the best generations (correct likeness, varied poses/angles/expressions)
4. **Retrain:** Train a better LoRA on the curated expanded dataset
5. **Repeat:** Iterate until satisfied

**Key insight from practitioners:** "Real pictures by far give better likeness. But I have many LoRAs made from 25 AI pictures generated from 1 real picture by using qwen-image-edit or flux2 klein 9b."

### 10.5 Common Training Mistakes

1. **Over-captioning physical features** — The LoRA should learn identity from images, not captions. Captions that describe what the person looks like compete with visual learning.
2. **Too many similar images** — 50 nearly identical selfies teach the LoRA that there's only one pose. Vary angles, expressions, lighting, and backgrounds.
3. **Skipping curation** — Bad training images (blurry, wrong person, heavy filters) produce bad LoRAs. Spend 80% of time on dataset curation, 20% on training.
4. **Over-training** — Monitor validation. If the LoRA starts producing artifacts or can't generalize to new prompts, you've gone too far.
5. **Wrong resolution** — LTX-LoRAs need to be trained at the correct resolution bucket (768×432 for standard, 1536×1024 for character-sheet).
6. **Not using gradient checkpointing** — On consumer GPUs (24GB), this is essential for identity LoRA training.

### 10.6 Mixing LoRAs

**LTX-Best-Face-ID community finding:**

> Load the base `Best_FaceID_v1.0_LoRA.safetensors` alongside the character-sheet LoRA at a low strength (~0.2 or more) — mixing in some of the base close-up LoRA strengthens identity while the character-sheet LoRA keeps handling clothing/body.

**Style + Identity mixing:**
- Train a separate style LoRA (e.g., "watercolor," "toon shading")
- Mix identity LoRA + style LoRA at inference time
- Keep identity LoRA at full strength, style LoRA at 0.3-0.7

---

## Quick-Reference: Prompt Templates

### LTX Standard Video Prompt

```
[Shot type] of [subject] [action] in [setting]. [Lighting direction and quality]. 
[Camera movement, lens, aperture]. [Color grade, film stock]. [Motion quality]. 
[Audio description]. [Guardrails].
```

### ID-LoRA Talking Head Prompt

```
[VISUAL]: A [shot type] of person speaking to camera, [framing], [lighting], [background], [expression]
[SPEECH]: [Exact words to be spoken]
[SOUNDS]: [Speaking tone], [ambient description], [music presence/absence]
```

### IC-LoRA Identity Video Prompt

```
ref_t2v: [Identity attributes: skin tone, hair, eyes, facial features] is [action], 
[framing], [lighting], [environment]. [Camera movement].
```

### Product/Commercial Prompt

```
[Background type]: [product] with [key feature], [camera angle and movement], 
[lighting setup], [color/contrast style]. 50 fps feel, minimal micro-jitter. 
No fake UI, no flicker.
```

### Negative Prompt (Surgical)

```
[Single observed artifact: e.g., "jitter" or "face morphing" or "shimmer"]
```

Add one at a time. Remove if it dampens intended motion.

### Full Negative Library (Use Sparingly)

```
blurry, low resolution, distorted, watermark, text overlay, compression artifacts,
extra fingers, mutated hands, face morphing, body drift, frame skipping, ghosting,
flickering, jitter, judder, morphing objects, melting, oversaturated, plastic skin
```

---

## Sources

- Lightricks official prompting guide (docs.ltx.io)
- Skywork AI: LTX-2 Prompts Guide
- Dream Pixel Forge: LTX-2.5 Prompt Guide
- Crepal: IC-LoRA in LTX 2.3
- ComfyUI examples (comfyanonymous)
- ID-LoRA paper (arxiv 2603.10256v1)
- ID-LoRA project page (id-lora.github.io)
- Alissonerdx/LTX-Best-Face-ID (HuggingFace)
- Hailuo AI: Negative Prompts for Cinematic Video
- Artlist: Negative Prompts for Kling, Veo, and Wan
- QuestStudio: Reduce Flicker and Melting Artifacts
- Envato: Cinematic Lighting for AI Videos
- Luma Labs: Camera Movement Prompts
- Kling AI: Camera Control Guide
- Vivideo: AI Video Prompt Analysis (40,000+ videos)
- ComfyUI community (Reddit r/comfyui)
- Apatero: ComfyUI LoRA Training Guide 2026
- aiofm.info: LoRA Training Complete Methodology