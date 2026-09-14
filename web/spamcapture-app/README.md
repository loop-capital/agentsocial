# SpamCapture MVP

## Community-Powered Spam Reporting & Blocking App

SpamCapture is a minimum viable product (MVP) mobile application that empowers users to report spam texts and fraud calls, pools this data for community intelligence, and enables auto-blocking capabilities similar to carrier-based solutions but powered by community reports.

![SpamCapture Screens](docs/screenshots.png)

## Features

### Multi-Channel Reporting Interface
- **Spam Text Reporting**: Report unwanted SMS/MMS messages
- **Fraud Call Reporting**: Report robocalls, scam calls, and telemarketing
- **Rich Reporting**: Capture caller ID, phone number, timestamp, content, and categorize spam type
- **Privacy-First**: Anonymous reporting option available

### Community Intelligence & Number Pooling
- **Centralized Database**: All reports stored securely in PostgreSQL
- **Real-time Aggregation**: Automatic detection of trending spam numbers
- **Threat Scoring**: Numbers ranked by report frequency and patterns
- **Exportable Block Lists**: Download community block lists in JSON/CSV format

### Auto-Blocking Capabilities
- **Block List Generation**: Automatically generated from top-reported numbers
- **Subscription Model**: Users can subscribe to automatic updates
- **Platform Integration**: Stubs for iOS/Android blocking integration
- **Threshold-Based**: Configurable reporting thresholds for blocking

### Integration with SpamSuit
- **Anonymous User Tracking**: Consistent ID across SpamCapture and SpamSuit
- **Compensation Ready**: Infrastructure for user reward tracking
- **Deep Linking**: Seamless navigation between apps

## Technical Architecture

### Mobile App (React Native/Expo)
- **Framework**: React Native with Expo SDK 51
- **Language**: TypeScript
- **State Management**: Zustand + React Query
- **Navigation**: React Navigation v6
- **UI Components**: Custom components with consistent styling
- **Offline Support**: Local SQLite queue for report submission

### Backend API (Node.js/Express)
- **Runtime**: Node.js >=18.0
- **Framework**: Express.js 4.18
- **Database**: PostgreSQL with Sequelize ORM
- **Validation**: Express-validator for input sanitization
- **Security**: Helmet, CORS, rate limiting
- **Documentation**: Self-documenting API endpoints

### Database Schema
- **Users**: Anonymous user tracking with device tokens
- **SpamReports**: Core reporting table with rich metadata
- **BlockLists**: Aggregated blocking lists with threat levels
- **Subscriptions**: User preferences for auto-blocking updates

## Quick Start

### Prerequisites
- Node.js >=18.0
- PostgreSQL >=13
- Expo CLI (for mobile development)
- Git

### Backend Setup
```bash
# Clone repository
git clone <repository-url>
cd spamcapture-app/backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
npm run migrate

# Seed initial data (optional)
npm run seed

# Start server
npm run dev
```

### Mobile App Setup
```bash
# Navigate to mobile directory
cd ../mobile

# Install dependencies
npm install

# Start development server
npm start

# Run on emulator/simulator
# Press 'a' for Android, 'i' for iOS in Expo DevTools
```

## API Documentation

### Report Submission
```
POST /api/reports
Content-Type: application/json
X-Anonymous-User-Id: <optional-user-id>

{
  "phoneNumber": "+15551234567",
  "callerId": "Scam Likely",
  "type": "call",
  "content": "Extended warranty scam",
  "category": "scam",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Get Block List
```
GET /api/blocklist?limit=100&minReports=5
```

### Export Block List
```
GET /api/blocklist/export?format=csv&limit=1000
```

## Project Structure

```
spamcapture-app/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Custom middleware
│   │   └── utils/          # Helper functions
│   ├── migrations/         # Database migrations
│   ├── config/             # Configuration files
│   ├── package.json
│   └── .env.example
│
├── mobile/                 # React Native/Expo app
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── screens/        # Screen components
│   │   ├── navigation/     # Navigation configuration
│   │   ├── services/       # API and device services
│   │   ├── store/          # State management (Zustand)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── constants/      # App constants
│   │   └── types/          # TypeScript definitions
│   ├── App.tsx             # Entry point
│   ├── app.json            # Expo configuration
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                   # Documentation
│   ├── api.md              # Detailed API reference
│   ├── database.md         # Database schema
│   └── screenshots/        # UI mockups
│
└── README.md               # This file
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anonymous_id VARCHAR(36) UNIQUE NOT NULL,
  device_token VARCHAR(255),
  spamsuit_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Spam Reports Table
```sql
CREATE TABLE spam_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number VARCHAR(20) NOT NULL,
  caller_id VARCHAR(100),
  type VARCHAR(10) NOT NULL CHECK(type IN ('sms', 'call')),
  content TEXT,
  screenshot_url VARCHAR(500),
  category VARCHAR(20) CHECK(category IN ('spam', 'scam', 'phishing', 'robocall', 'telemarketing', 'other')),
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  location JSONB,
  device_info JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Block Lists Table
```sql
CREATE TABLE block_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  report_count INTEGER NOT NULL DEFAULT 1,
  last_reported TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  first_reported TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  threat_level VARCHAR(10) NOT NULL DEFAULT 'low' CHECK(threat_level IN ('low', 'medium', 'high', 'critical')),
  categories JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Security & Privacy Considerations

### Data Protection
- **Minimal PII Collection**: Only phone numbers and optional caller ID/content
- **Anonymous Reporting**: User accounts optional for basic reporting
- **Data Encryption**: TLS encryption for all API communications
- **Input Validation**: Strict validation and sanitization on all inputs
- **Rate Limiting**: Prevent abuse of reporting endpoints

### Privacy Features
- **Anonymous by Default**: No account required to report spam
- **Optional Tracking**: Anonymous ID for contribution tracking
- **Data Minimization**: Only essential fields stored
- **No Personal Details**: Names, addresses, or other PII not collected
- **GDPR Ready**: Infrastructure for data deletion requests

## Deployment

### Production Deployment
1. Set `NODE_ENV=production` in backend `.env`
2. Use process manager like PM2 or Docker
3. Configure SSL/TLS termination at reverse proxy
4. Set up automated backups for PostgreSQL
5. Configure monitoring and logging

### Mobile Distribution
- **Development**: Expo Go app for testing
- **Production**: EAS Build for standalone IPA/APK
- **Over-the-Air Updates**: Expo OTA for JS bundle updates
- **App Store**: Ready for submission to Apple App Store and Google Play

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by carrier-based spam protection services
- Built with Expo and React Native community
- Special thanks to open-source contributors
- Designed to complement the SpamSuit ecosystem

---

**SpamCapture: Powered by the community, protected by collective intelligence.**