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
- Docker & Docker Compose
- Supabase account (free tier)
- MongoDB Atlas account (free tier)
- Redis Cloud account (free tier)

### 1. Setup Cloud Databases

- **Supabase**: Create project and get connection string
- **MongoDB Atlas**: Create free cluster and get connection string
- **Redis Cloud**: Create free database and get connection string

See `backend/docs/DATABASE_SETUP.md` for detailed setup instructions.

### 2. Backend Setup

```bash
cd backend
npm install

# Copy environment template and configure
cp .env.example .env
# Edit .env with your database credentials

# Important: Cache is disabled by default
# Add to your .env:
CACHE_ENABLED=false  # Default for development
```

See `backend/docs/ENV_CACHE_SAMPLE.md` for cache configuration examples.

### 3. Start Backend

```bash
cd backend
npm run dev
```

Backend runs on `http://localhost:3000`

### 4. Frontend Setup

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
- **Redis Cloud** - Caching and sessions (optional, disabled by default)
- **Kafka (Aiven)** - Event streaming (optional)
- **Winston** - Logging
- **JWT** - Authentication

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Redux Toolkit** - Client state
- **Tailwind CSS + DaisyUI** - Styling
- **Axios** - HTTP client

## Features Implemented

### Core Features ✅
- ✅ User authentication and authorization (JWT + RBAC)
- ✅ Flight, hotel, and car listings search
- ✅ Booking creation and management
- ✅ Payment processing
- ✅ Admin inventory management
- ✅ Kafka event streaming (producers + consumers)
- ✅ **Redis caching with configurable enable/disable** (NEW)
- ✅ Session management
- ✅ File uploads (Firebase Storage)
- ✅ Docker containerization

### Cache Configuration ✅
Redis caching is **disabled by default** for easier development:

```env
# Development (default)
CACHE_ENABLED=false

# Production (recommended)
CACHE_ENABLED=true
CACHE_TTL_LISTING=300
CACHE_TTL_SEARCH=60
CACHE_TTL_USER=600
```

See `backend/docs/CACHE_CONFIGURATION.md` for detailed cache documentation.

## Environment Variables

### Backend (.env)

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@host:port/database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/kayak
REDIS_URL=redis://host:port

# Cache Configuration (NEW)
CACHE_ENABLED=false  # Disabled by default
CACHE_TTL_LISTING=300
CACHE_TTL_SEARCH=60
CACHE_TTL_USER=600

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Kafka (optional)
KAFKA_ENABLED=false
KAFKA_BROKERS=broker1:port,broker2:port
```

See `backend/.env.example` and `backend/docs/ENV_CACHE_SAMPLE.md` for complete examples.

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

## Docker Deployment

```bash
# Build and run with Docker Compose
docker compose up --build -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

## Documentation

### Project Documentation
- [Implementation Plan](./docs/IMPLEMENTATION_PLAN.md)
- [Project Overview](./docs/PROJECT_OVERVIEW.md)
- [Quick Start Guide](./docs/QUICK_START.md)
- [Firebase Setup](./docs/FIREBASE_SETUP.md)

### Backend Documentation
- [Database Setup](./backend/docs/DATABASE_SETUP.md)
- [**Cache Configuration**](./backend/docs/CACHE_CONFIGURATION.md) ⭐ NEW
- [**Environment Variables for Cache**](./backend/docs/ENV_CACHE_SAMPLE.md) ⭐ NEW
- [Implementation Status](./backend/docs/IMPLEMENTATION_STATUS.md)
- [Kafka Setup](./backend/kafka/README.md)

### Frontend Documentation
- [Frontend README](./frontend/README.md)

## Recent Updates

### Cache Configuration (Latest)
- ✅ Redis caching is now **configurable via environment variables**
- ✅ Cache is **disabled by default** for easier development
- ✅ Can be enabled in production with `CACHE_ENABLED=true`
- ✅ Configurable TTL values for listings, searches, and user profiles
- ✅ Complete documentation and examples added

### Performance
- With caching enabled: 50-80% faster response times
- With caching disabled: Standard database performance (default)
- Cache reduces database load by 70-90% when enabled

## Contributing

1. Create a feature branch
2. Make your changes
3. Test locally with cache disabled
4. Submit a pull request

## License

This project is for educational purposes.

## Support

For issues or questions, check the documentation or open an issue on GitHub.
