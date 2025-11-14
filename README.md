# Kayak Simulation Platform

A distributed travel booking platform built with Express.js backend and React frontend.

## Project Structure

```
Kayak-Project/
├── backend/          # Express.js API server
├── frontend/         # React frontend application
├── infra/           # Infrastructure as code (AWS, Docker)
├── api-docs/         # OpenAPI specification
└── docs/            # Documentation
```

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose (optional, for local development)
- Supabase account (free tier)
- MongoDB Atlas account (free tier)
- Redis Cloud account (free tier)

### 1. Setup Cloud Databases

- **Supabase**: Create project and get connection string
- **MongoDB Atlas**: Create free cluster and get connection string
- **Redis Cloud**: Create free database and get connection string

See `backend/docs/DATABASE_SETUP.md` for detailed setup instructions.

### 2. Start Local Infrastructure (Optional)

For Kafka and local development:

```bash
cd infra/local
docker compose up -d
```

This starts:
- Kafka (port 9092)

### 3. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Supabase, MongoDB Atlas, and Redis credentials
npm run dev
```

Backend runs on `http://localhost:3000`

### 4. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## Tech Stack

### Backend
- **Express.js** - Web framework
- **PostgreSQL (Supabase)** - Relational database (users, bookings, payments)
- **MongoDB Atlas** - Document database (listings, analytics)
- **Redis Cloud** - Caching and sessions
- **Kafka** - Event streaming
- **Winston** - Logging
- **Morgan** - HTTP request logging
- **JWT** - Authentication

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Query** - Server state & caching
- **Redux Toolkit** - Client state
- **Axios** - HTTP client
- **DaisyUI** - Component library
- **Tailwind CSS** - Styling

## Architecture

### Backend Structure
```
backend/
├── src/
│   ├── server.js           # Entry point
│   ├── config/             # Configuration
│   ├── middleware/         # Express middleware
│   ├── routes/             # API routes
│   ├── controllers/       # Request handlers
│   └── services/           # Business logic
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/         # Reusable components
│   ├── pages/              # Page components
│   ├── services/           # API services
│   ├── store/             # Redux store
│   └── hooks/             # Custom hooks
```

## API Endpoints

All endpoints are prefixed with `/api/v1`

See `api-docs/openapi.yaml` for complete API specification.

## Development

### Backend
```bash
cd backend
npm run dev      # Development with auto-reload
npm start        # Production
npm run lint     # Linting
```

### Frontend
```bash
cd frontend
npm run dev      # Development server
npm run build    # Production build
npm run lint     # Linting
```

## Environment Variables

### Backend (.env)
See `backend/.env.example`

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_API_VERSION=v1
```

## Next Steps

1. Implement database migrations
2. Complete service implementations
3. Add authentication flow
4. Implement Kafka integration
5. Add WebSocket support
6. Add comprehensive tests

## Documentation

### Project Documentation
- [Implementation Plan](./docs/IMPLEMENTATION_PLAN.md)
- [Quick Start Guide](./docs/QUICK_START.md)
- [Firebase Setup](./docs/FIREBASE_SETUP.md)

### Component Documentation
- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [API Documentation](./api-docs/README.md)

### Backend Documentation
- [Database Setup](./backend/docs/DATABASE_SETUP.md)

### Frontend Documentation
- See [frontend/docs](./frontend/docs/) for frontend-specific documentation

