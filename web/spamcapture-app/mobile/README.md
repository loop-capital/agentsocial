# SpamCapture Mobile

Cross-platform mobile app for reporting spam calls and texts, built with Expo SDK 51, React Native 0.74, and TypeScript.

## Overview

The SpamCapture mobile app lets users:
- Submit spam reports (calls and texts) with phone number, category, and content
- Browse the community block list with threat levels
- Check if a phone number is a known spammer
- Auto-block spam numbers via native blocking modules
- View community statistics and trending numbers
- Deep-link into the SpamSuit legal platform

**Key design choice**: Authentication is **anonymous**. On first launch, the app generates an `anonymousId` and authenticates with the backend. No email or password is required.

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | >= 18.0.0 | |
| npm | >= 9.0.0 | or Yarn >= 1.22 |
| Expo CLI | latest | `npm install -g expo-cli` |
| Expo Go | latest | On your iOS/Android device for testing |
| Android Studio | 2022.1+ | For Android emulator (optional) |
| Xcode | 14+ | For iOS simulator (macOS only) |

### Expo SDK 51 Compatibility

| Dependency | Version |
|-----------|---------|
| React | 18.2 |
| React Native | 0.74 |
| TypeScript | ~5.3 |

## Installation Steps

### 1. Install Expo CLI
```bash
npm install -g expo-cli
```

### 2. Install Dependencies
```bash
cd mobile
npm install
```

### 3. Configure Environment
```bash
# No .env file needed for development — defaults are used
# To override the API URL, set the environment variable:
export EXPO_PUBLIC_API_URL=https://api.spamsuit.com/v1
# Default: https://api.spamsuit.com/v1
```

### 4. Start the Development Server
```bash
expo start
```

## Running on iOS/Android

### Physical Device (Easiest)
1. Install **Expo Go** from the App Store (iOS) or Play Store (Android)
2. Run `expo start`
3. Scan the QR code with your device camera
4. The app opens in Expo Go

### iOS Simulator (macOS only)
```bash
npm run ios
# or: expo start --ios
```

### Android Emulator
```bash
npm run android
# or: expo start --android
```

### Web Browser
```bash
npm run web
# or: expo start --web
```

## Building for Production

### EAS Build (Expo Application Services)
```bash
# Install EAS CLI
npm install -g eas-cli

# Log in
eas login

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Build for both
eas build --platform all
```

### App Store Submission
```bash
# iOS
eas submit --platform ios

# Android
eas submit --platform android
```

> **Note**: The `app.json` has `extra.eas.projectId` set to `"your-project-id"`. Replace with your actual EAS project ID.

## Configuration Options

### API Configuration (`src/constants/api.ts`)

| Constant | Description | Default |
|----------|-------------|---------|
| `API_CONFIG.BASE_URL` | Backend API base URL | `https://api.spamsuit.com/v1` |
| `API_CONFIG.TIMEOUT` | Request timeout in ms | `30000` |
| `API_CONFIG.RETRY_ATTEMPTS` | Max retry attempts | `3` |
| `API_CONFIG.RETRY_DELAY` | Delay between retries (ms) | `1000` |

Override the base URL by setting `EXPO_PUBLIC_API_URL` in your environment.

### Expo Configuration (`app.json`)

| Setting | Value |
|---------|-------|
| **Bundle ID (iOS)** | `com.spamsuit.spamcapture` |
| **Package (Android)** | `com.spamsuit.spamcapture` |
| **URL Scheme** | `spamsuit` (enables deep linking) |
| **Splash BG** | `#0066FF` (SpamSuit Blue) |

### iOS Permissions

| Permission | Purpose |
|-----------|---------|
| `NSContactsUsageDescription` | Check for spam numbers in contacts |
| `NSMicrophoneUsageDescription` | Call reporting features |
| `NSCameraUsageDescription` | Scan phone numbers |
| `UIBackgroundModes` | `fetch`, `remote-notification` |

### Android Permissions

| Permission | Purpose |
|-----------|---------|
| `READ_CONTACTS` | Check contacts for spam numbers |
| `READ_PHONE_STATE` | Detect incoming calls |
| `READ_CALL_LOG` | Access call history |
| `READ_SMS` / `RECEIVE_SMS` | Detect spam texts |
| `FOREGROUND_SERVICE` | Background call monitoring |
| `POST_NOTIFICATIONS` | Spam alerts |

## Project Structure

```
mobile/src/
├── constants/
│   ├── api.ts          # API base URL, endpoints, storage keys
│   ├── categories.ts   # Spam category definitions (8 categories)
│   └── colors.ts       # Color palette + per-category colors
├── hooks/
│   └── useAuth.ts      # Anonymous auth hook (init, refresh, logout)
├── services/
│   ├── api.ts          # Axios HTTP client with interceptors
│   ├── blocking.ts     # Native blocking module interface (stubs)
│   ├── permissions.ts  # Expo permissions (contacts, notifications)
│   └── storage.ts      # SecureStore (tokens) + AsyncStorage (cache)
└── types/
    └── index.ts        # TypeScript interfaces for all data types
```

## Key Architecture

### Anonymous Auth Flow

1. App launches → `useAuth` hook checks `SecureStore` for existing `userId` + `authToken`
2. If found → verifies token validity, proceeds to app
3. If not → calls `apiService.authenticateAnonymous()` which POSTs to `/auth/anonymous`
4. Backend returns `{ userId, token, refreshToken }`
5. Stored in `SecureStore` for subsequent launches
6. On 401 → automatic token refresh via interceptor

### Data Flow

```
User Action
    │
    ▼
React Component
    │
    ▼
Zustand Store (local state) ──── React Query (server state)
    │                                    │
    ▼                                    ▼
 apiService (Axios) ◀───────────────────┘
    │
    ▼
Backend API (/api/v1/*)
    │
    ▼
SecureStore (auth tokens)
AsyncStorage (report/blocklist cache)
```

### Spam Categories

| Category | Icon | Color |
|----------|------|-------|
| Scam | `warning` | `#FF1744` |
| Telemarketing | `phone-forwarded` | `#FF9800` |
| Robocall | `voicemail` | `#9C27B0` |
| Phishing | `link-off` | `#F44336` |
| Debt Collector | `money-off` | `#795548` |
| Political | `account-balance` | `#3F51B5` |
| Survey | `poll` | `#009688` |
| Other | `help-outline` | `#607D8B` |

### Native Blocking

The `BlockingService` (`src/services/blocking.ts`) defines an interface for platform-native call/SMS blocking:

- `addToBlockList(phoneNumber)` / `removeFromBlockList(phoneNumber)`
- `getBlockedNumbers()` / `checkIfBlocked(phoneNumber)`
- `syncBlockList(entries)` — bulk sync from server
- `isBlockingEnabled()` / `enableBlocking()` / `disableBlocking()`

> **Note**: These are **stubs** in the current MVP. Native modules (`CallBlockingModule`, `SMSBlockingModule`) are not yet implemented. They require a custom development build (not Expo Go). On iOS, this uses CallKit's Call Directory extension. On Android, it uses the default CallScreeningService.

### Storage Strategy

| Data | Storage | Key |
|------|---------|-----|
| Auth token | SecureStore | `@spamcapture:auth_token` |
| Refresh token | SecureStore | `@spamcapture:refresh_token` |
| User ID | SecureStore | `@spamcapture:user_id` |
| Reports cache | AsyncStorage | `@spamcapture:reports_cache` |
| Block list cache | AsyncStorage | `@spamcapture:blocklist_cache` |
| Settings | AsyncStorage | `@spamcapture:settings` |
| Last sync timestamp | AsyncStorage | `@spamcapture:last_sync` |

### Deep Linking

The app registers the `spamsuit://` URL scheme for cross-app navigation from SpamSuit:

```typescript
// Incoming deep link format:
spamsuit://report?phoneNumber=+18005551234&type=sms
spamsuit://block?phoneNumber=+18005551234
spamsuit://lookup?phoneNumber=+18005551234
```

The `DeepLinkData` type in `types/index.ts` defines:
- `action`: `'report' | 'block' | 'lookup'`
- `phoneNumber`: optional target number
- `type`: optional `ReportType`

## Testing

```bash
# Run tests
npm test

# Lint
npm run lint
```

## Troubleshooting

### Common Issues

**Metro cache issues:**
```bash
expo start -c
```

**Android build issues:**
```bash
cd android && ./gradlew clean && cd ..
expo start -c
```

**Native modules not working in Expo Go:**
- This is expected. The `BlockingService` stubs log to console but don't perform real blocking.
- Build a development client: `eas build --profile development`

### Getting Help
- Expo docs: https://docs.expo.dev/
- React Native docs: https://reactnative.dev/

## License

MIT