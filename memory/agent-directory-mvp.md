# Agent Directory MVP

## Overview
The TaskLinkr Agent Directory is a GlassDoor-style marketplace for AI agents to list their skills and be discovered by potential clients.

## Tech Stack
- **Frontend:** Next.js 16 with React 19
- **Database:** PostgreSQL via Prisma ORM
- **Styling:** Tailwind CSS 4 with custom gradients
- **Components:** shadcn/ui compatible components

## Features

### 1. Agent Profile Creation
- Name, email, description
- Avatar (URL-based)
- Availability status (Available, Busy, Offline)
- Pricing model (Hourly, Fixed, Negotiable) with optional rate
- Skills with proficiency levels (Beginner → Expert)

### 2. Search & Discovery
- Full-text search by name/description
- Filter by skill name
- Filter by availability status
- Sort by date, price, name
- Responsive grid layout

### 3. Matching System
- POST `/api/match` endpoint
- Matches agents based on required/preferred skills
- Scoring algorithm: proficiency weight + availability bonus
- Returns top 10 matches with match percentage

### 4. UI Pages
- `/agents` - Browse directory with search & filters
- `/agents/[id]` - Individual agent profile
- `/agents/new` - Create new profile form

## Database Schema

```prisma
enum AgentStatus { AVAILABLE, BUSY, OFFLINE }
enum Pricing { HOURLY, FIXED, NEGOTIABLE }
enum Proficiency { BEGINNER, INTERMEDIATE, ADVANCED, EXPERT }

model Agent {
  id          String
  name        String
  email       String (unique)
  description String?
  avatar      String?
  status      AgentStatus
  pricing     Pricing
  pricingRate Int?
  approved    Boolean
  createdAt   DateTime
  skills      AgentSkill[]
}

model Skill {
  id       String
  name     String (unique)
  category String?
  agents   AgentSkill[]
}

model AgentSkill {
  id          String
  agentId     String
  skillId     String
  proficiency Proficiency
  agent       Agent
  skill       Skill
}
```

## API Endpoints

### Agents
- `GET /api/agents` - List agents with filters
- `POST /api/agents` - Create agent
- `GET /api/agents/[id]` - Get single agent
- `PATCH /api/agents/[id]` - Update agent
- `DELETE /api/agents/[id]` - Delete agent

### Skills
- `GET /api/skills` - List all skills
- `POST /api/skills` - Create skill

### Matching
- `POST /api/match` - Match agents to task requirements
  ```json
  {
    "requiredSkills": ["JavaScript", "React"],
    "preferredSkills": ["TypeScript"],
    "minProficiency": "INTERMEDIATE"
  }
  ```

## Setup Instructions

1. **Install dependencies:**
   ```bash
   cd web/my-app
   npm install
   ```

2. **Set up database:**
   - Create PostgreSQL database
   - Update `.env` with DATABASE_URL
   - Run migrations:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

3. **Seed sample data:**
   ```bash
   npm run db:seed
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

## Environment Variables

```
DATABASE_URL="postgresql://user:pass@localhost:5432/tasklinkr"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

## Sample Data
The seed creates 5 sample agents:
1. **CodeAssist Pro** - Full-stack developer ($75/hr)
2. **DataBot Analytics** - Data analyst ($500/project)
3. **DesignFlow AI** - UI/UX designer ($65/hr)
4. **MarketingGenius** - Digital marketer (negotiable)
5. **SupportPro** - Customer support ($30/hr)

## Out of Scope (MVP)
- Authentication (skipped for MVP)
- Payment integration
- Reviews/ratings system
- Real-time updates
- Admin approval workflow

## Next Steps
1. Add authentication (Clerk/Auth.js)
2. Implement payment flows (Stripe)
3. Build reviews/ratings
4. Add WebSocket for real-time status updates
5. Create admin dashboard for profile approval