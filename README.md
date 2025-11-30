# Kayak Simulation Platform

Travel booking platform with Express.js backend, React frontend, and AI-agent service.

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Python 3.12+ (for AI-agent)
- Cloud accounts: Supabase, MongoDB Atlas, Redis Cloud, Firebase

### 1. Environment Setup

**Backend** (`backend/.env`):
```env
PORT=3000
DATABASE_URL=postgresql://...  # Supabase
MONGODB_URI=mongodb+srv://...  # MongoDB Atlas
REDIS_URL=redis://...          # Redis Cloud
JWT_SECRET=...                  # Generate with: node scripts/generate-secrets.js
SESSION_SECRET=...              # Generate with: node scripts/generate-secrets.js
FIREBASE_SERVICE_ACCOUNT={...} # Firebase JSON
FIREBASE_STORAGE_BUCKET=...
CACHE_ENABLED=false            # Set to 'true' to enable Redis caching
KAFKA_ENABLED=false            # Set to 'true' if using Kafka
AI_AGENT_URL=http://ai-agent:8000
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:3000
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
```

**AI-Agent** (`ai-agent/.env`):
```env
PORT=8000
DATABASE_URL=sqlite:///./data/concierge.db
OPENAI_API_KEY=...
```

### 2. Start with Docker

```bash
# Enable BuildKit for faster builds
export COMPOSE_DOCKER_CLI_BUILD=1
export DOCKER_BUILDKIT=1

# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services:
- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`
- AI-Agent: `http://localhost:8000`

### 3. Seed Database (Optional)

```bash
cd backend
npm run seed:us-data  # Seeds flights, hotels, cars for US cities
npm run seed:test-users  # Creates test users for E2E tests
```

### 4. Local Development

**Backend:**
```bash
cd backend
npm install
npm run dev  # http://localhost:3000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

**AI-Agent:**
```bash
cd ai-agent
./update-requirements.sh  # Creates .venv and requirements.txt
source .venv/bin/activate
uvicorn main:app --reload  # http://localhost:8000
```

## Tech Stack

**Backend:** Node.js 20, Express.js, PostgreSQL (Supabase), MongoDB Atlas, Redis Cloud, Kafka (Aiven), Firebase Storage  
**Frontend:** React 18, Vite, Redux Toolkit, Tailwind CSS + DaisyUI  
**AI-Agent:** Python 3.12, FastAPI, SQLite/Supabase

## Features

- User authentication (JWT + RBAC)
- Flight, hotel, car search and booking
- Payment processing
- Admin inventory management
- AI concierge service
- Kafka event streaming
- Redis caching (optional, disabled by default)
- Firebase image storage

## API

All endpoints: `/api/v1/*`  
See `api-docs/openapi.yaml` for full specification

## Testing

```bash
cd e2e
npm install
npm test  # Runs Playwright E2E tests
```

Test users are auto-created via `globalSetup` in `playwright.config.js`

## Documentation

- [Database Setup](./backend/docs/DATABASE_SETUP.md) - Cloud database configuration
- [Firebase Setup](./docs/FIREBASE_SETUP.md) - Image storage setup
- [Kafka Setup](./backend/kafka/README.md) - Event streaming
- [API Docs](./api-docs/README.md) - OpenAPI specification
