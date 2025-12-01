# Kaggle Data Integration Guide

## 📊 Overview

This guide explains how the Kayak platform uses real-world Kaggle datasets to populate its database with realistic travel data. The system is designed to handle **10,000+ listings, 10,000+ users, and 100,000+ reservation records** as per scalability requirements.

---

## 🏗️ Architecture Summary

### Database Design

The Kayak platform uses a **hybrid database architecture**:

#### **PostgreSQL (Supabase)** - Transactional Data
- ✅ Users (with authentication, roles, profiles)
- ✅ Bookings (with ACID transactions)
- ✅ Payments (with idempotency support)
- ✅ Reviews

**Why PostgreSQL?**
- ACID compliance for financial transactions
- Foreign key constraints ensure data integrity
- Complex joins for reporting
- Connection pooling for scalability

#### **MongoDB (Atlas)** - Listing Data
- ✅ Flights (flexible schema, high read volume)
- ✅ Hotels (nested amenities, location data)
- ✅ Cars (simple documents)
- ✅ Concierge sessions (AI conversations)
- ✅ User analytics/traces

**Why MongoDB?**
- Document-based structure for listings
- Flexible schema for different listing types
- High-performance search with indexes
- Horizontal scalability

#### **Redis (Cloud)** - Caching & Sessions
- ✅ Listing cache (5-minute TTL)
- ✅ Search results cache (1-minute TTL)
- ✅ User profile cache (10-minute TTL)
- ✅ Rate limiting counters

**Why Redis?**
- Sub-millisecond latency
- Reduced database load
- TTL-based expiration
- Pub/sub for notifications

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (free tier works)
- Supabase PostgreSQL account (free tier works)
- Redis Cloud account (free tier works)

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Configure Environment
Your `.env` file should have:
```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/kayak

# PostgreSQL (Supabase)
DATABASE_URL=postgresql://user:pass@db.supabase.co:5432/postgres

# Redis Cloud
REDIS_URL=redis://default:pass@host:port
```

### Step 3: Load Data (Without Kaggle CSVs)
```bash
npm run load:kaggle-data
```

This will generate **31,000+ flights, 86 hotels, 82 cars** using synthetic data based on real US airports.

### Step 4: Load Data (With Kaggle CSVs)
See detailed instructions in `backend/scripts/data/README.md`

1. Download datasets from Kaggle (free account required)
2. Place CSV files in `backend/scripts/data/`
3. Run: `npm run load:kaggle-data`

The script intelligently:
- ✅ Uses CSV data if available
- ✅ Falls back to synthetic data if CSV missing
- ✅ Generates future dates (next 6 months)
- ✅ Detects deals (price ≤ 85% of average)
- ✅ Marks limited availability
- ✅ Creates optimized indexes

---

## 📈 Scalability Features

### Performance Optimizations

1. **Batch Inserts**
   - Data is inserted in 1,000-record batches
   - Prevents memory exhaustion
   - ~40 seconds for 100,000 records

2. **Indexes Created Automatically**
   ```javascript
   // Flights
   { from: 1, to: 1, departDate: 1 }  // Route search
   { airline: 1 }                      // Airline filter
   { price: 1 }                        // Price sorting
   { isDeal: 1 }                       // Deal detection
   
   // Hotels
   { city: 1, state: 1 }               // Location search
   { pricePerNight: 1 }                // Price sorting
   { rating: 1 }                       // Rating filter
   
   // Cars
   { city: 1, state: 1 }               // Location search
   { pricePerDay: 1 }                  // Price sorting
   ```

3. **Connection Pooling**
   ```javascript
   // PostgreSQL
   max: 10 connections
   idleTimeoutMillis: 30000
   
   // MongoDB
   serverSelectionTimeoutMS: 10000
   ```

4. **Redis Caching Strategy**
   ```javascript
   // Listing cache
   TTL: 300s (5 minutes)
   Key: listing:flight:FL-1001
   
   // Search cache
   TTL: 60s (1 minute)
   Key: search:flights:{hash}
   
   // User cache
   TTL: 600s (10 minutes)
   Key: user:profile:{userId}
   ```

### Testing Scalability

```bash
# Load 100K+ records
npm run load:kaggle-data  # Loads 30K+ flights automatically

# Test query performance
node scripts/test-query-performance.js
```

Expected performance:
- **Single listing lookup**: < 5ms (cached), < 50ms (database)
- **Search with filters**: < 100ms (20-30 results)
- **Booking creation**: < 200ms (with transaction)

---

## 🎯 Deal Detection Algorithm

### Flights
```javascript
// Calculate average price for route
const avgPrice = calculateRouteAverage(from, to, airline);

// Detect deal
const isDeal = price <= avgPrice * 0.85;  // 15% discount
const savingsPercent = Math.round((1 - price / avgPrice) * 100);
```

### Hotels
```javascript
// Calculate city median
const cityMedian = calculateCityMedian(city);

// Detect deal
const isDeal = pricePerNight <= cityMedian * 0.85;  // 15% discount

// Limited availability
const limitedAvailability = availableRooms < 5;
```

### Deal Metadata Stored
```javascript
{
  isDeal: true,
  avgPrice: 350.00,
  savingsPercent: 18,
  limitedAvailability: true,
  tags: ["Great Deal", "Limited Availability", "wifi", "breakfast"]
}
```

---

## 📊 Data Volume Summary

### Current Load (Without Kaggle CSVs)
- ✈️ Flights: **31,486** (210 routes × 60 days × 2-3 flights/day)
- 🏨 Hotels: **86** (15 cities × 4-7 hotels/city)
- 🚗 Cars: **82** (15 cities × 4-6 cars/city)
- 📍 Airports: **15** major US airports

### With Kaggle CSVs (Recommended)
- ✈️ Flights: **50,000+** (500 unique routes × 30 days × 3 flights/day)
- 🏨 Hotels: **1,000+** (from Airbnb NYC dataset)
- 🚗 Cars: **150+** (25 cities × 6 cars/city)
- 📍 Airports: **346+** (all major US airports)

### Easily Scalable To
- ✈️ Flights: **100,000+** (increase date range to 12 months)
- 🏨 Hotels: **10,000+** (add more cities from Airbnb data)
- 🚗 Cars: **1,000+** (expand to all airports)
- 👥 Users: **10,000+** (use existing seed script)
- 📝 Bookings: **100,000+** (generate booking history)

---

## 🔧 Customization

### Adjust Data Volume

**More Flights:**
```javascript
// In load-kaggle-data.js, line 44
const generateFutureDates = (months = 12) => { // Change 6 to 12
```

**More Hotels:**
```javascript
// In loadHotels(), line 337
const sampleSize = Math.min(hotelData.length, 5000); // Increase 1000 to 5000
```

**More Cities:**
```javascript
// In getDefaultAirports(), add more airports
{ code: 'SAN', city: 'San Diego', state: 'CA', lat: 32.7338, lng: -117.1933 },
{ code: 'PDX', city: 'Portland', state: 'OR', lat: 45.5898, lng: -122.5951 },
```

### Adjust Deal Detection

**More aggressive deals (20% discount):**
```javascript
const isDeal = price <= avgPrice * 0.80; // Change 0.85 to 0.80
```

**Fewer deals (10% discount):**
```javascript
const isDeal = price <= avgPrice * 0.90; // Change 0.85 to 0.90
```

---

## 🧪 Testing & Validation

### Run Tests
```bash
# Test connection
node scripts/test-data-loader.js

# Load data
npm run load:kaggle-data

# Verify counts
node scripts/test-data-loader.js
```

### Query Examples

**Find cheap flights:**
```javascript
db.flights.find({
  isDeal: true,
  from: "JFK",
  to: "LAX",
  departDate: { $gte: "2025-12-01" }
}).sort({ price: 1 }).limit(10);
```

**Find hotels with deals:**
```javascript
db.hotels.find({
  isDeal: true,
  city: "New York",
  rating: { $gte: 4.0 }
}).sort({ pricePerNight: 1 }).limit(10);
```

**Flight statistics:**
```javascript
db.flights.aggregate([
  { $group: {
    _id: "$from",
    avgPrice: { $avg: "$price" },
    count: { $sum: 1 },
    deals: { $sum: { $cond: ["$isDeal", 1, 0] } }
  }}
]);
```

---

## 🎓 Best Practices

### 1. Regular Data Refresh
```bash
# Run weekly to update deals
npm run load:kaggle-data
```

### 2. Monitor Performance
```javascript
// Add timing to queries
const start = Date.now();
const results = await db.flights.find(query).toArray();
console.log(`Query took ${Date.now() - start}ms`);
```

### 3. Use Indexes
```bash
# Check index usage
db.flights.find({...}).explain("executionStats")
```

### 4. Cache Aggressively
```javascript
// Cache expensive searches
const cacheKey = `search:${JSON.stringify(criteria)}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
```

### 5. Batch Operations
```javascript
// Insert in batches
const batchSize = 1000;
for (let i = 0; i < data.length; i += batchSize) {
  await collection.insertMany(data.slice(i, i + batchSize));
}
```

---

## 📚 Additional Resources

- **Database Architecture**: `docs/DATABASE_ARCHITECTURE.md`
- **Implementation Status**: `backend/docs/IMPLEMENTATION_STATUS.md`
- **Kaggle Instructions**: `backend/scripts/data/README.md`
- **API Documentation**: `api-docs/openapi.yaml`

---

## 🐛 Troubleshooting

### Issue: "Out of memory"
**Solution:** Reduce batch size or sample size
```javascript
const batchSize = 500; // Reduce from 1000
const sampleSize = 100; // Reduce from 500
```

### Issue: "Slow query performance"
**Solution:** Check indexes
```bash
db.flights.getIndexes()
```

### Issue: "Connection timeout"
**Solution:** Increase timeout in database.js
```javascript
connectionTimeoutMillis: 20000, // Increase from 10000
```

### Issue: "Duplicate key error"
**Solution:** Clear collections first
```javascript
await db.collection('flights').deleteMany({});
```

---

## ✅ Success Criteria

You've successfully set up the system when:

- ✅ 10,000+ listings loaded (flights + hotels + cars)
- ✅ All indexes created
- ✅ Queries return in < 100ms
- ✅ Deal detection working (isDeal flag set)
- ✅ Geographic data present (lat/lng)
- ✅ Future dates covered (next 6 months minimum)
- ✅ All collections accessible

---

## 📞 Support

Questions or issues? Check:
1. `backend/scripts/data/README.md` - Dataset instructions
2. `docs/DATABASE_ARCHITECTURE.md` - Architecture details
3. GitHub Issues - Community support

---

**Last Updated**: December 1, 2025
**Version**: 1.0.0

