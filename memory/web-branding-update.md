# TaskLinkr Web Branding Update

**Date:** 2026-04-01
**Status:** Complete

## Summary

Updated TaskLinkr landing page with new brand assets and dark/light mode compatibility.

## Changes Made

### 1. Brand Assets Integration

Copied brand assets to `public/branding/`:
- `logo.webp` - Main TaskLinkr logo (light mode)
- `logo-dark.png` - Dark variant TaskLinkr logo
- `logo-jobs.webp` - TaskLinkrJobs logo for future /jobs page
- `icon-avatar.jpg` - Source for favicon generation

### 2. Favicon Generation

Generated favicon set using Sharp:
- `favicon-16x16.png`
- `favicon-32x32.png`
- `favicon.ico`
- `apple-touch-icon.png` (180x180)
- `android-chrome-192x192.png`
- `android-chrome-512x512.png`

Script: `scripts/generate-favicons.js`

### 3. Header Component (New)

Created `components/header.tsx`:
- Sticky header with backdrop blur
- Logo with dark/light mode switching
- Navigation links (Agents, Early Access)
- Responsive design

### 4. Footer Update

Updated `components/footer.tsx`:
- Replaced text "TaskLinkr" with actual logo images
- Dark mode shows light logo, light mode shows dark logo
- Better visual hierarchy

### 5. Layout Updates

Updated `app/layout.tsx`:
- Added ThemeProvider with system preference support
- Integrated Header component
- Updated metadata with favicon and brand assets
- Added OpenGraph and Twitter card meta tags
- Manifest link for PWA support

### 6. Theme Support

- Installed `next-themes` package
- Created `components/theme-provider.tsx`
- System-aware logo switching in header

### 7. PWA Support

Created `public/manifest.json`:
- App name and description
- Theme colors
- Icon configurations for all platforms

## Files Modified/Created

### New Files:
- `components/header.tsx`
- `components/theme-provider.tsx`
- `scripts/generate-favicons.js`
- `public/manifest.json`
- `public/branding/*` (all brand assets)

### Modified Files:
- `app/layout.tsx`
- `components/footer.tsx`
- `package.json` (added next-themes dependency)

## Technical Details

### Dark/Light Mode Logic
The header uses `next-themes` to detect the current theme and switches between:
- Light mode: `/branding/logo.webp`
- Dark mode: `/branding/logo-dark.png`

Footer uses CSS classes with `dark:hidden` and `hidden dark:block` for automatic switching.

### SEO/Meta Tags
- Favicons: Multiple sizes for different devices
- OpenGraph: Brand logo as social preview image
- Twitter Cards: Summary large image format
- Manifest: PWA-ready configuration

## Notes for Future

1. The Jobs logo (`logo-jobs.webp`) is ready for the `/jobs` page when implemented
2. All logos are in the `public/branding/` folder for easy access
3. The favicon generation script can be re-run if the icon avatar changes
