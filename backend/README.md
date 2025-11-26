# Kayak Backend API

Backend API for the Kayak travel booking simulation platform.

## Technology Stack

- **Runtime**: Node.js with Express
- **Database**: PostgreSQL (Supabase Cloud) + MongoDB Atlas (Cloud)
- **Storage**: Firebase Storage (Google Cloud)
- **Caching**: Redis Cloud
- **Message Queue**: Kafka

## Prerequisites

- Node.js 18+
- MongoDB Atlas account (cloud)
- Supabase PostgreSQL account (cloud)
- Firebase project with Storage enabled (cloud)
- Redis Cloud account (cloud)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory with **cloud credentials**:

```bash
# Server Configuration
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Supabase PostgreSQL (Required - Cloud)
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres

# MongoDB Atlas (Required - Cloud)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kayak?retryWrites=true&w=majority

# Redis Cloud (Required - Cloud)
REDIS_URL=redis://default:password@redis-xxxxx.cloud.redislabs.com:xxxxx

# Firebase Configuration (Required - Cloud)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com

# JWT & Session Secrets
JWT_SECRET=your-secure-jwt-secret
JWT_EXPIRES_IN=24h
SESSION_SECRET=your-secure-session-secret

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Optional Services
KAFKA_BROKERS=localhost:9092
```

> **Note**: All databases are cloud-based for team collaboration. Get credentials from your team lead.

### 3. Seed the Database

```bash
npm run mongo:seed
```

This will populate MongoDB with sample hotels, flights, and cars data.

### 4. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The server will run on `http://localhost:3000`

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start development server with auto-reload
- `npm run mongo:seed` - Seed MongoDB with sample data
- `npm run mongo:list` - List all MongoDB collections and document counts
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## API Endpoints

### Hotels

- `GET /api/v1/listings/hotels` - Search hotels
  - Query params: `city`, `location`, `minPrice`, `maxPrice`, `minRating`, `stars`, `sortBy`, `sortOrder`, `page`, `pageSize`
- `GET /api/v1/listings/hotels/:id` - Get hotel by ID
- `GET /api/v1/listings/hotels/locations/search` - Search hotel locations (autocomplete)

### Flights

- `GET /api/v1/listings/flights` - Search flights
  - Query params: `from`, `to`, `departDate`, `returnDate`, `minPrice`, `maxPrice`, `airline`, `sortBy`, `sortOrder`, `page`, `pageSize`
  - `departDate`: Departure date in YYYY-MM-DD format (required for filtering by date)
  - `returnDate`: Return date in YYYY-MM-DD format (optional, for round-trip searches)
- `GET /api/v1/listings/flights/:id` - Get flight by ID
- `GET /api/v1/listings/flights/locations/search` - Search flight locations (autocomplete)

### Cars

- `GET /api/v1/listings/cars` - Search cars
  - Query params: `location`, `type`, `vendor`, `minPrice`, `maxPrice`, `sortBy`, `sortOrder`, `page`, `pageSize`
- `GET /api/v1/listings/cars/:id` - Get car by ID

### Users & Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/users/profile` - Get user profile (authenticated)
- `PUT /api/v1/users/profile` - Update user profile (authenticated)

### Images

- `POST /api/v1/images/upload` - Upload image to Firebase Storage
- `DELETE /api/v1/images/:filename` - Delete image

## Database Schema

### MongoDB Collections

**hotels**
- name, location, city, country
- rating, reviews, stars
- pricePerNight, currency
- amenities (array)
- imageUrl (Firebase Storage URL)
- latitude, longitude

**flights**
- airline, flightNumber
- origin, destination
- departDate (YYYY-MM-DD)
- departureTime, arrivalTime, duration
- durationMinutes, price, currency
- stops, nonstop, cabinClass

**cars**
- location, vendor, type
- seats, pricePerDay, currency
- imageUrl (Firebase Storage URL)

See `docs/MONGODB_SCHEMA.md` for complete schema documentation.

## Firebase Storage Structure

Images are stored in Firebase Storage with the following structure:

```
kayak/
  ├── properties/
  │   └── {hotel-id}/
  │       └── {image-name}.jpg
  └── cars/
      └── {car-id}/
          └── {image-name}.jpg
```

## Image Fallback System

All listing endpoints automatically provide placeholder images for missing or damaged images:
- Hotels: `https://via.placeholder.com/800x600/4A5568/FFFFFF?text=Hotel+Image`
- Cars: `https://via.placeholder.com/800x600/4A5568/FFFFFF?text=Car+Image`

## Development

### Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files (database, firebase, logger)
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Express middleware
│   ├── routes/         # API routes
│   ├── services/       # Business logic layer
│   └── utils/          # Utility functions
├── scripts/            # Database scripts
│   ├── seed-mongo.js
│   └── list-mongo-collections.js
├── docs/               # Documentation
└── logs/               # Application logs
```

### Logging

Winston logger with daily rotation:
- `logs/application-{DATE}.log` - All logs
- `logs/error-{DATE}.log` - Error logs only

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production MongoDB Atlas cluster
3. Set up Firebase Storage production bucket
4. Configure Redis and Kafka for production
5. Use process manager (PM2, systemd, or Docker)

```bash
# Using PM2
pm2 start src/server.js --name kayak-backend
```

## Troubleshooting

### MongoDB Connection Issues

- Verify MONGODB_URI is correct
- Check network access in MongoDB Atlas (whitelist your IP)
- Ensure database user has read/write permissions

### Firebase Storage Issues

- Verify FIREBASE_SERVICE_ACCOUNT JSON is valid
- Check FIREBASE_STORAGE_BUCKET name
- Ensure service account has Storage Admin role

### Missing Images

- Images automatically fallback to placeholders
- Check Firebase Storage rules allow public read access
- Verify image URLs in MongoDB documents

## Support

For issues and questions, please refer to the main project documentation in the root directory.
