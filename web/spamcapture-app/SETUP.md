# Environment Setup

## Backend (.env.example)

```
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Connection
DATABASE_URL=postgres://username:password@localhost:5432/spamcapture

# Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production
ENCRYPTION_KEY=your-encryption-key-for-sensitive-data

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX=100

# CORS Origins
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006,exp://localhost:19000

# File Uploads
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif

# Feature Flags
ENABLE_ANONYMOUS_REPORTING=true
ENABLE_AUTO_BLOCKING=false
ENABLE_SPAMSUIT_INTEGRATION=true

# Logging
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
```

## Mobile App Configuration

### app.json

```json
{
  "expo": {
    "name": "SpamCapture",
    "slug": "spamcapture",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.spamcapture.app",
      "buildNumber": "1.0.0",
      "config": {
        "usesNonExemptEncryption": false
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.spamcapture.app",
      "versionCode": 1
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "apiUrl": "http://localhost:3000",
      "eas": {
        "projectId": "your-project-id"
      }
    },
    "plugins": [
      "expo-localization"
    ]
  }
}
```

### babel.config.js

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        root: ['./src'],
        aliases: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@services': './src/services',
          '@store': './src/store',
          '@hooks': './src/hooks',
          '@constants': './src/constants',
          '@types': './src/types',
        }
      }]
    ]
  };
};
```

## Development Setup

### Backend
1. Install Node.js >=18.0
2. Install PostgreSQL >=13
3. Create database: `createdb spamcapture`
4. Copy `.env.example` to `.env` and configure
5. Install dependencies: `npm install`
6. Run migrations: `npm run migrate`
7. Start development server: `npm run dev`

### Mobile App
1. Install Node.js >=18.0
2. Install Expo CLI: `npm install -g expo-cli`
3. Install dependencies: `npm install`
4. Start development server: `npm start`
5. Scan QR code with Expo Go app (iOS/Android) or press 'a'/'i' for emulator

## Production Deployment

### Backend (Docker Example)
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
```

### Mobile App (EAS Build)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build (eas.json)
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      },
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "android": {
        "gradleCommand": ":app:assembleRelease"
      },
      "ios": {
        "archivePath": "build/SpamCapture.ipa",
        "buildType": "archive"
      }
    }
  }
}

# Build for production
eas build --platform all --profile production
```

## Testing

### Backend Tests
```bash
# Run unit tests
npm test

# Run linting
npm run lint

# Run linting with fixes
npm run lint:fix
```

### Mobile App Tests
```bash
# Run unit tests
npm test

# Run linting
npm run lint

# Run type checking
npx tsc --noEmit
```

## Environment Variables Reference

### Backend
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| PORT | Server port | 3000 | No |
| NODE_ENV | Environment mode | development | No |
| DATABASE_URL | PostgreSQL connection | - | Yes |
| JWT_SECRET | JWT signing secret | - | Yes |
| ENCRYPTION_KEY | Data encryption key | - | No |
| RATE_LIMIT_WINDOW_MS | Rate limit window (ms) | 900000 | No |
| RATE_LIMIT_MAX | Max requests per window | 100 | No |
| ALLOWED_ORIGINS | CORS origins (CSV) | - | No |
| MAX_FILE_SIZE | Max upload size (bytes) | 10485760 | No |
| ALLOWED_FILE_TYPES | Allowed MIME types (CSV) | - | No |
| ENABLE_ANONYMOUS_REPORTING | Allow anonymous reports | true | No |
| ENABLE_AUTO_BLOCKING | Enable auto-blocking features | false | No |
| ENABLE_SPAMSUIT_INTEGRATION | Enable SpamSuit sync | true | No |
| LOG_LEVEL | Logging level | info | No |
| ENABLE_REQUEST_LOGGING | Log HTTP requests | true | No |

### Mobile App (app.json)
| Field | Description |
|-------|-------------|
| expo.name | App name displayed to users |
| expo.slug | URL-friendly app identifier |
| expo.version | Version string (semver) |
| expo.orientation | Screen orientation lock |
| expo.icon | App icon path |
| expo.splash | Splash screen configuration |
| expo.updates | OTA update configuration |
| expo.assetBundlePatterns | Asset inclusion patterns |
| expo.ios | iOS-specific configuration |
| expo.android | Android-specific configuration |
| expo.web | Web-specific configuration |
| expo.extra | Custom variables (apiUrl, etc.) |
| expo.plugins | Expo plugins array |

## Troubleshooting

### Common Backend Issues
- **Database Connection Failed**: Check DATABASE_URL and PostgreSQL service
- **Port Already In Use**: Change PORT or kill existing process
- **Migration Errors**: Check database permissions and schema consistency
- **CORS Errors**: Verify ALLOWED_ORIGINS includes your frontend URL

### Common Mobile Issues
- **Expo CLI Not Found**: Install globally with `npm install -g expo-cli`
- **Dependency Conflicts**: Delete node_modules and reinstall
- **Build Failures**: Check expo-dev-client version compatibility
- **Hot Reload Not Working**: Ensure development server is accessible

## Version Compatibility

### Backend
- Node.js: >=18.0 (LTS recommended)
- PostgreSQL: >=13
- Sequelize: >=6.0
- Express: >=4.18

### Mobile App
- Expo SDK: 50.0.0+
- React Native: 0.74.0+
- iOS: 13.0+
- Android: 8.0 (API 26)+
- TypeScript: 5.0.0+

## Changelog

### v1.0.0 (Initial Release)
- Core reporting functionality
- Community block list generation
- Anonymous user support
- Basic API endpoints
- React Native/Expo mobile app
- PostgreSQL backend