# Adobe Integration — UI/UX Mockups & Creative Tools Design
## AgentSocial Creative Studio Interface Design

**Date:** 2026-05-03  
**Status:** Design Document  
**Tools:** Firefly Generator, Stock Browser, Photoshop Quick Actions, Express Editor

---

## 1. Design Philosophy

### 1.1 Principles
- **Embedded Experience:** Adobe tools live inside AgentSocial, not as pop-ups
- **Context-Aware:** Tools appear when relevant (e.g., stock search when writing a post)
- **Progressive Disclosure:** Simple by default, powerful when needed
- **Brand Safe:** All generated content is on-brand and compliant
- **Fast Feedback:** Async operations show progress, not spinners

### 1.2 Design Language
- Dark mode creative canvas with light mode panels
- Adobe-inspired color palette (blue accents, warm neutrals)
- Card-based asset organization
- Real-time collaboration indicators
- Toast notifications for async operations

---

## 2. Screen Designs

### 2.1 Creative Studio Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔙 AgentSocial                    Creative Studio          [🔔] [👤 Profile] │
├──────────────────┬──────────────────────────────────────────────────────────┤
│                  │                                                          │
│  🎨 CREATE       │   ┌─────────────────────────────────────────────────┐  │
│  ─────────────── │   │  🖼️  Recent Creations                            │  │
│  ✨ AI Generate   │   │                                                   │  │
│  🔍 Stock Search │   │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │  │
│  🎬 Quick Edit   │   │  │ 🏔️   │ │ 🌆   │ │ 🎨   │ │ 📊   │ │ ➕   │   │  │
│  📐 Templates    │   │  │Mount.│ │City  │ │Art   │ │Chart │ │New   │   │  │
│  ─────────────── │   │  │2h ago│ │5h ago│ │1d ago│ │2d ago│ │      │   │  │
│  📁 ASSETS       │   │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘   │  │
│  ─────────────── │   │                                                   │  │
│  🖼️  All Assets  │   └─────────────────────────────────────────────────┘  │
│  ⭐ Favorites    │                                                          │
│  📂 Collections │   ┌─────────────────────────────────────────────────┐  │
│  📥 Licensed     │   │  📈  Usage This Month                             │  │
│  🗑️  Trash       │   │                                                   │  │
│                  │   │  Credits Used: 1,240 / 5,000      [████░░░░░░]   │  │
│  ─────────────── │   │  Storage Used: 2.4 GB / 10 GB     [██░░░░░░░░]   │  │
│  ⚙️  Settings    │   │  API Calls: 847 this month                        │  │
│                  │   │                                                   │  │
│                  │   │  [View Detailed Usage]                            │  │
│                  │   └─────────────────────────────────────────────────┘  │
│                  │                                                          │
│                  │   ┌─────────────────────────────────────────────────┐  │
│                  │   │  🚀  Quick Actions                                │  │
│                  │   │                                                   │  │
│                  │   │  [🎨 Generate Image]  [🔍 Search Stock]         │  │
│                  │   │  [✂️ Remove Background] [📝 Add Text]           │  │
│                  │   │  [🎞️ Generate Video]  [📐 Resize for Social]    │  │
│                  │   │                                                   │  │
│                  │   └─────────────────────────────────────────────────┘  │
│                  │                                                          │
└──────────────────┴──────────────────────────────────────────────────────────┘
```

---

### 2.2 Firefly AI Image Generator

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔙 Back to Studio              ✨ AI Image Generator          [💾 Save] [✕] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────┐  ┌──────────────────────────────┐ │
│  │                                     │  │  🎨 Style Presets              │ │
│  │                                     │  │                                │ │
│  │    [Generated Image Preview]        │  │  [🎨 Artistic] [📸 Photo]      │ │
│  │                                     │  │  [✏️ Drawing]   [🎭 Concept]   │ │
│  │         2688 × 1536                 │  │  [🏢 Business]  [🎬 Cinematic] │ │
│  │                                     │  │                                │ │
│  │    [🔄 Regenerate] [⬇️ Download]   │  │  Selected: 🎨 Artistic          │ │
│  │    [📐 Edit]        [📤 Share]      │  │                                │ │
│  │                                     │  │  🎯 Fine-tune:                 │ │
│  └─────────────────────────────────────┘  │  [Light] [Medium] [Heavy]      │ │
│                                             │                                │ │
│  ┌─────────────────────────────────────┐  │  🌐 Locale: [English ▼]         │ │
│  │  📝 Prompt                          │  │                                │ │
│  │  ─────────────────────────────────  │  │  📐 Aspect Ratio:              │ │
│  │  A vibrant social media graphic     │  │  [1:1 □] [4:5 ▭] [16:9 ▯]     │ │
│  │  showing a mountain landscape at    │  │  [9:16 ▭] [3:2 ▯] [Custom]     │ │
│  │  sunrise, with warm orange and      │  │                                │ │
│  │  pink tones, minimalist style       │  │  🎚️ Number of variations:      │ │
│  │  ─────────────────────────────────  │  │  [1] [2] [4] [8]              │ │
│  │                                     │  │                                │ │
│  │  [🎤 Voice Input] [💡 Suggest]      │  └──────────────────────────────┘ │
│  └─────────────────────────────────────┘                                     │
│                                                                              │
│  ┌─────────────────────────────────────┐                                     │
│  │  🚫 Negative Prompt                   │     ┌─────────────────────────┐     │
│  │  blurry, low quality, watermark     │     │  💡 Prompt Suggestions   │     │
│  └─────────────────────────────────────┘     │                         │     │
│                                              │  "A modern office with    │     │
│  ┌─────────────────────────────────────┐     │   plants and natural     │     │
│  │  🖼️ Reference Image (Optional)      │     │   light"                 │     │
│  │  [📤 Upload] or [🎨 My Assets ▼]   │     │                         │     │
│  │                                     │     │  "Minimalist tech        │     │
│  │  Strength: [━━●────] 40%            │     │   product photo on       │     │
│  └─────────────────────────────────────┘     │   gradient background"   │     │
│                                              │                         │     │
│  [✨ Generate Image]  [⚙️ Advanced Options]   └─────────────────────────┘     │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  📊 Generation History                                                  │ │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │ │
│  │  │ 🏔️   │ │ 🌅   │ │ ⛰️   │ │ 🌄   │ │ 🏞️   │ │ ➕   │              │ │
│  │  │Gen 1 │ │Gen 2 │ │Gen 3 │ │Gen 4 │ │Gen 5 │ │More │              │ │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘              │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.3 Stock Asset Browser

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔙 Back to Studio              🔍 Adobe Stock Browser        [💾] [✕]       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  🔍 Search Adobe Stock...                    [🔍] [🎤] [📷 Image Search] │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  Filters:  [All Types ▼] [Any Orientation ▼] [Any License ▼] [More ▼]      │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Sort by: [Relevance ▼]          12,847 results found                  │ │
│  │                                                                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │ │
│  │  │              │  │              │  │              │  │            │ │ │
│  │  │  [🏔️ Image]  │  │  [🌆 Image]   │  │  [🌊 Image]  │  │ [🌳 Image] │ │ │
│  │  │              │  │              │  │              │  │            │ │ │
│  │  │ Mountain     │  │ City Skyline │  │ Ocean Waves  │  │ Forest     │ │ │
│  │  │ Landscape    │  │ at Dusk      │  │ at Sunset    │  │ Path       │ │ │
│  │  │              │  │              │  │              │  │            │ │ │
│  │  │ ⭐ 4.9       │  │ ⭐ 4.8       │  │ ⭐ 4.7       │  │ ⭐ 4.9     │ │ │
│  │  │ 📷 John Doe  │  │ 📷 Jane Smith│  │ 📷 Alex Lee  │  │ 📷 Sam Wu  │ │ │
│  │  │              │  │              │  │              │  │            │ │ │
│  │  │ [👁️ Preview] │  │ [👁️ Preview] │  │ [👁️ Preview] │  │ [👁️ Prev]  │ │ │
│  │  │ [🛒 License] │  │ [🛒 License] │  │ [🛒 License] │  │ [🛒 Lic]   │ │ │
│  │  │ [❤️ Save]    │  │ [❤️ Save]    │  │ [❤️ Save]    │  │ [❤️ Save]  │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │ │
│  │                                                                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │ │
│  │  │  [🏢 Image]  │  │  [🎨 Image]   │  │  [🎭 Image]  │  │ [🎪 Image] │ │ │
│  │  │ Modern Office│  │ Abstract Art │  │ Portrait     │  │ Concert    │ │ │
│  │  │ Workspace    │  │ Background   │  │ Photography  │  │ Crowd      │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │ │
│  │                                                                        │ │
│  │  [← Previous]  Page 1 of 402  [Next →]                                │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  🛒 License Cart  │  3 items  │  [💳 Checkout]  │  [🗑️ Clear]           │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.4 Asset Preview & License Modal

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ [✕]                                                                    │ │
│  │                                                                        │ │
│  │  ┌─────────────────────────────┐  ┌─────────────────────────────────┐   │ │
│  │  │                             │  │  🏔️ Mountain Landscape          │   │ │
│  │  │                             │  │                                 │   │ │
│  │  │    [Large Preview Image]     │  │  📷 by John Doe                 │   │ │
│  │  │                             │  │  📅 Created: Jan 15, 2024       │   │ │
│  │  │    6000 × 4000 px           │  │  📐 6000 × 4000 px              │   │ │
│  │  │    24.5 MB                  │  │  🎨 JPEG, sRGB                  │   │ │
│  │  │                             │  │                                 │   │ │
│  │  │    [🔍 Zoom] [⬇️ Preview]   │  │  🏷️ Tags:                       │   │ │
│  │  │                             │  │  [mountain] [landscape] [nature]  │   │ │
│  │  └─────────────────────────────┘  │  [outdoor] [scenic]             │   │ │
│  │                                    │                                 │   │ │
│  │  🖼️ Similar Images:               │  📊 Category: Nature            │   │ │
│  │  ┌─────┐┌─────┐┌─────┐┌─────┐   │  ⭐ Rating: 4.9/5.0             │   │ │
│  │  │ 🏔️ ││ 🌄 ││ ⛰️ ││ 🏞️ │   │  👁️ 1.2M views                │   │ │
│  │  └─────┘└─────┘└─────┘└─────┘   │                                 │   │ │
│  │                                    │  💰 Licensing Options:          │   │ │
│  │                                    │                                 │   │ │
│  │                                    │  ○ Standard License    1 credit │   │ │
│  │                                    │    Web, social, digital use     │   │ │
│  │                                    │    Up to 500K copies            │   │ │
│  │                                    │                                 │   │ │
│  │                                    │  ○ Extended License    8 credits│   │ │
│  │                                    │    Unlimited reproduction       │   │ │
│  │                                    │    Merchandise rights           │   │ │
│  │                                    │                                 │   │ │
│  │                                    │  Your Credits: 1,240 available │   │ │
│  │                                    │                                 │   │ │
│  │                                    │  [🛒 License Now] [❤️ Save]    │   │ │
│  │                                    │                                 │   │ │
│  │                                    │  [📋 Add to License Cart]       │   │ │
│  │                                    │                                 │   │ │
│  │                                    └─────────────────────────────────┘   │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.5 Photoshop Quick Actions Panel

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔙 Back to Studio              🎬 Quick Edit Actions         [💾] [✕]       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────┐  ┌──────────────────────────────┐ │
│  │                                     │  │  🎚️ Adjustments               │ │
│  │    [Image Preview with Canvas]      │  │                                │ │
│  │                                     │  │  Brightness: [━━━●──] 60%    │ │
│  │    Drag image here or               │  │  Contrast:   [━━●───] 40%    │ │
│  │    select from assets               │  │  Saturation: [━━━●──] 55%    │ │
│  │                                     │  │  Sharpness:  [━━●───] 35%    │ │
│  │    [🖼️ Select from My Assets]      │  │                                │ │
│  │                                     │  │  [🤖 Auto-Enhance]            │ │
│  └─────────────────────────────────────┘  │                                │ │
│                                            │  🎯 Quick Actions:             │ │
│  🔄 Original ────────────────── ● ─── Edited │                                │ │
│                                            │  [✂️ Remove Background]       │ │
│  ┌─────────────────────────────────────┐  │  [🔍 Smart Crop]              │ │
│  │  Before          │         After    │  │  [📝 Add Text Layer]          │ │
│  │  ┌──────────┐    │    ┌──────────┐ │  │  [🎨 Color Grading]           │ │
│  │  │          │    │    │          │ │  │  [📐 Resize]                  │ │
│  │  │ Original │    │    │  Edited  │ │  │  [🔄 Replace Object]          │ │
│  │  │          │    │    │          │ │  │                                │ │
│  │  └──────────┘    │    └──────────┘ │  │  [📤 Download] [💾 Save]      │ │
│  └─────────────────────────────────────┘  └──────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  🎞️ Batch Processing (Optional)                                       │ │
│  │  Apply this edit to multiple images: [📁 Select Images...]            │ │
│  │  Estimated cost: 15 credits  │  [🚀 Process Batch]                       │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.6 Express Template Editor (Embedded)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔙 Back to Studio              📐 Social Media Creator       [💾] [✕]       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Platform Presets:  [Instagram Post ▼] [Instagram Story] [Twitter] [FB]   │
│                                                                              │
│  Template Category: [All ▼] [Business] [Lifestyle] [Event] [Quote] [Promo]   │
│                                                                              │
│  ┌─────────────────────────────────────┐  ┌──────────────────────────────┐ │
│  │                                     │  │  📝 Content                   │ │
│  │    ┌─────────────────────────┐    │  │                                │ │
│  │    │                         │    │  │  Headline:                     │ │
│  │    │   [Template Preview]    │    │  │  ┌────────────────────────┐  │ │
│  │    │                         │    │  │  │ Summer Sale Starts Now!│  │ │
│  │    │   "Summer Sale"         │    │  │  └────────────────────────┘  │ │
│  │    │   Template              │    │  │                                │ │
│  │    │                         │    │  │  Subheadline:                  │ │
│  │    │   1080 × 1080 px       │    │  │  ┌────────────────────────┐  │ │
│  │    │                         │    │  │  │ Up to 50% off everything│  │ │
│  │    └─────────────────────────┘    │  │  └────────────────────────┘  │ │
│  │                                     │  │                                │ │
│  │    [🔄 Regenerate] [🎨 Edit]      │  │  CTA Button:                   │ │
│  │                                     │  │  ┌────────────────────────┐  │ │
│  │    Colors: [🔴] [🟡] [🔵] [➕]    │  │  │   Shop Now →           │  │ │
│  │                                     │  │  └────────────────────────┘  │ │
│  └─────────────────────────────────────┘  │                                │ │
│                                            │  🖼️ Background:              │ │
│  🎨 Customize:                             │  [🎨 AI Generate] [📁 Upload] │ │
│  [🖋️ Font] [🎨 Colors] [📐 Layout]       │  [🔍 Stock Search] [🎨 Solid]  │ │
│                                            │                                │ │
│  [✨ Generate with AI]  [📤 Export]       │  📊 Stats Preview:             │ │
│                                            │  Engagement: 8.2% ↑           │ │
│                                            │  Best time: Tue 2PM           │ │
│                                            └──────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.7 Asset Detail View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔙 Back to Assets              🖼️ Asset Details            [✏️] [🗑️] [✕] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────┐  ┌──────────────────────────────┐ │
│  │                                     │  │  📝 Metadata                  │ │
│  │    [Large Image Preview]            │  │                                │ │
│  │                                     │  │  Name: Mountain Landscape    │ │
│  │    2688 × 1536 px                   │  │  Source: Adobe Firefly        │ │
│  │    Generated 2 hours ago            │  │  Type: Image (JPEG)           │ │
│  │                                     │  │  Size: 2.4 MB                 │ │
│  │    [🔍 Zoom] [↔️ Fullscreen]       │  │  Dimensions: 2688 × 1536      │ │
│  │                                     │  │  Color Profile: sRGB          │ │
│  │                                     │  │                                │ │
│  │    ⚠️ Content Flag: Reviewed        │  │  🎨 Generation Details:        │ │
│  │    ✓ Safe for all platforms        │  │  Model: Firefly Image 5        │ │
│  └─────────────────────────────────────┘  │  Prompt: "A vibrant social..." │ │
│                                            │  Style: Artistic              │ │
│  ┌─────────────────────────────────────┐  │  Seed: 123456                 │ │
│  │  🎨 Prompt                          │  │  Credits: 10                   │ │
│  │  ─────────────────────────────────  │  │                                │ │
│  │  A vibrant social media graphic     │  │  🏷️ Tags:                      │ │
│  │  showing a mountain landscape...    │  │  [landscape] [nature] [social]│ │
│  └─────────────────────────────────────┘  │  [orange] [sunrise] [minimal]  │ │
│                                            │                                │ │
│  ┌─────────────────────────────────────┐  │  📊 Usage:                      │ │
│  │  📈 Analytics                       │  │  Used in 3 posts              │ │
│  │  ─────────────────────────────────  │  │  Last used: 1 hour ago          │ │
│  │  Impressions: 12,847                │  │                                │ │
│  │  Engagement: 8.2%                   │  │  📁 Collections:               │ │
│  │  Saves: 342                         │  │  [Summer Campaign] [Nature]   │ │
│  │  Shares: 156                        │  │  [+ Add to Collection]          │ │
│  └─────────────────────────────────────┘  │                                │ │
│                                            │  [⬇️ Download] [🔗 Share]   │ │
│  [✏️ Edit in Photoshop] [🎨 Regenerate]  │  [📋 Copy URL] [🏷️ Edit Tags] │ │
│                                            └──────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.8 Settings & Configuration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔙 Back to Studio              ⚙️ Adobe Integration Settings                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  🔐 API Credentials                                                    │ │
│  │  ───────────────────────────────────────────────────────────────────   │ │
│  │                                                                        │ │
│  │  Client ID:     ••••••••••••••••1234    [👁️ Reveal] [🔄 Regenerate] │ │
│  │  Client Secret: ••••••••••••••••abcd    [👁️ Reveal] [🔄 Regenerate] │ │
│  │                                                                        │ │
│  │  Scopes: firefly_api, ff_apis, stock, openid, AdobeID               │ │
│  │                                                                        │ │
│  │  Status: ✅ Connected (Last verified: 2 min ago)                      │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  💳 Billing & Credits                                                  │ │
│  │  ───────────────────────────────────────────────────────────────────   │ │
│  │                                                                        │ │
│  │  Plan: Enterprise (ETLA)                                              │ │
│  │  Monthly Limit: 50,000 credits                                       │ │
│  │  Used This Month: 1,240 credits (2.5%)                               │ │
│  │                                                                        │ │
│  │  [💳 Manage Billing] [📈 Usage Report] [⚠️ Set Alerts]               │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  🛡️ Content Safety                                                     │ │
│  │  ───────────────────────────────────────────────────────────────────   │ │
│  │                                                                        │ │
│  │  ☑️ Enable content moderation for all generated images                  │ │
│  │  ☑️ Require approval for sensitive content                            │ │
│  │  ☐ Auto-retry on content moderation failure (max 3)                   │ │
│  │                                                                        │ │
│  │  Blocked Keywords: [mature] [violent] [hate] [custom...]              │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  🚀 Performance                                                        │ │
│  │  ───────────────────────────────────────────────────────────────────   │ │
│  │                                                                        │ │
│  │  Default Quality: [High ▼] (Standard/High/Ultra)                      │ │
│  │  Async Timeout: 60 seconds                                           │ │
│  │  Max Concurrent Jobs: 5                                              │ │
│  │  Auto-save to Library: ☑️ Yes                                          │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│                                    [💾 Save Changes] [↩️ Reset to Defaults] │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Specifications

### 3.1 Shared Components

| Component | Purpose | Props |
|-----------|---------|-------|
| `AssetCard` | Display asset thumbnail with actions | `asset`, `onPreview`, `onLicense`, `onSave` |
| `AssetGrid` | Responsive grid of AssetCards | `assets`, `columns`, `onAssetClick` |
| `PromptInput` | Rich text input with suggestions | `value`, `onChange`, `suggestions`, `onVoiceInput` |
| `StyleSelector` | Visual style preset picker | `styles`, `selected`, `onSelect` |
| `LicenseBadge` | Show license status and type | `status`, `type`, `credits` |
| `CreditDisplay` | Show remaining credits | `balance`, `limit`, `usage` |
| `AsyncJobTracker` | Track background job progress | `jobs`, `onRetry`, `onCancel` |
| `PlatformSelector` | Social media platform picker | `platforms`, `selected`, `onSelect` |
| `DimensionPicker` | Aspect ratio / size selector | `ratios`, `selected`, `onSelect` |
| `TagInput` | Add/remove tags with autocomplete | `tags`, `suggestions`, `onChange` |

### 3.2 State Management

```typescript
interface CreativeStudioState {
  // UI State
  activeTool: 'generate' | 'stock' | 'edit' | 'templates';
  sidebarCollapsed: boolean;
  
  // Asset State
  assets: AdobeAsset[];
  selectedAssetId: string | null;
  collections: AssetCollection[];
  
  // Generation State
  generationJobs: GenerationJob[];
  currentPrompt: string;
  selectedStyle: string;
  selectedRatio: AspectRatio;
  
  // Stock State
  stockQuery: string;
  stockFilters: StockFilters;
  stockResults: StockAsset[];
  licenseCart: StockAsset[];
  
  // Settings
  creditsBalance: number;
  creditsLimit: number;
  contentSafetyEnabled: boolean;
}
```

---

## 4. Interaction Flows

### 4.1 Generate Image Flow
```
User clicks "AI Generate"
  → Opens Firefly Generator panel
  → User enters prompt
  → User selects style + ratio
  → Clicks "Generate"
  → Frontend sends request to /api/adobe/firefly/generate
  → Backend queues job in generation_jobs
  → Returns job_id
  → Frontend polls /api/adobe/jobs/{job_id}/status
  → Job completes
  → Asset saved to adobe_assets
  → User sees preview
  → User can: Download, Edit, Save, Share
```

### 4.2 Stock Search & License Flow
```
User clicks "Stock Search"
  → Opens Stock Browser
  → User enters query
  → Frontend calls /api/adobe/stock/search
  → Backend calls Adobe Stock API
  → Results displayed in AssetGrid
  → User clicks asset → Preview Modal
  → User selects license type
  → Clicks "License Now"
  → Backend calls /api/adobe/stock/license
  → Credits deducted from organization
  → License recorded in asset_licenses
  → Asset downloaded and stored
  → Asset added to user's library
```

### 4.3 Quick Edit Flow
```
User selects asset → "Quick Edit"
  → Opens Photoshop Quick Actions panel
  → User selects action (e.g., Remove Background)
  → Frontend sends to /api/adobe/photoshop/remove-bg
  → Backend processes via Photoshop API
  → New asset created in adobe_assets
  → Linked to original via metadata
  → User sees before/after comparison
  → User can download or save
```

---

## 5. Responsive Design

### 5.1 Breakpoints
| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Mobile | < 768px | Single column, stacked panels |
| Tablet | 768-1024px | Two column, sidebar collapsible |
| Desktop | 1024-1440px | Three column, full sidebar |
| Wide | > 1440px | Four column, persistent sidebar |

### 5.2 Mobile Adaptations
- Bottom sheet for tool panels
- Swipe gestures for asset browsing
- Voice input for prompts
- Simplified quick actions
- Touch-optimized controls

---

## 6. Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation for all tools
- Screen reader support for asset descriptions
- High contrast mode
- Focus indicators on all interactive elements
- Alt text generation for AI images
- Color-safe palettes for color blindness

---

## 7. Animation & Micro-interactions

| Interaction | Animation |
|------------|-----------|
| Asset hover | Scale 1.02, shadow elevation |
| Generation start | Shimmer loading on preview area |
| Job complete | Confetti burst on preview |
| License success | Green checkmark with pulse |
| Error | Shake animation with red border |
| Drag & drop | Ghost preview, snap to grid |
| Filter change | Fade transition on results |
| Panel collapse | Slide with opacity |

---

*Design Document Version: 1.0*  
*Last Updated: 2026-05-03*
