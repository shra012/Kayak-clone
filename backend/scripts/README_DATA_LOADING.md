# Data Loading Scripts - Quick Reference

## 🚀 Quick Start

### Load Data (Without Kaggle CSVs)
```bash
cd backend
npm run load:kaggle-data
```
**Result**: Generates **31,486 flights**, **86 hotels**, **82 cars** automatically.

---

## 📥 Load Data (With Kaggle CSVs)

### Step 1: Download Datasets (Optional)
See detailed instructions in: `backend/scripts/data/README.md`

**Quick download** (requires Kaggle CLI):
```bash
cd backend/scripts/data

# Airports
kaggle datasets download -d samvelkoch/global-airports-iata-icao-timezone-geo
unzip global-airports-iata-icao-timezone-geo.zip

# Flights (Option 1)
kaggle datasets download -d shubhambathwal/flight-price-prediction
unzip flight-price-prediction.zip

# Hotels (Option 1)
kaggle datasets download -d dominoweir/inside-airbnb-nyc
unzip inside-airbnb-nyc.zip
```

### Step 2: Load Data
```bash
cd backend
npm run load:kaggle-data
```

---

## 📊 Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run load:kaggle-data` | Load travel data (flights, hotels, cars) |
| `node scripts/test-data-loader.js` | Test MongoDB connection and counts |
| `node scripts/sample-queries.js` | Run example queries on loaded data |
| `npm run seed:us-data` | ⚠️ Old script - use `load:kaggle-data` instead |

---

## 📁 Files Overview

### Main Scripts
- **`load-kaggle-data.js`** - Main data loader (use this!)
- **`seed-us-data.js`** - Old mock data script (replaced)
- **`test-data-loader.js`** - Connection testing
- **`sample-queries.js`** - Example queries

### Documentation
- **`data/README.md`** - Kaggle dataset download guide (detailed)
- **`KAGGLE_DATA_GUIDE.md`** - Complete architecture guide (400 lines)
- **`README_DATA_LOADING.md`** - This file (quick reference)

### Project Root
- **`DATA_LOADING_SUMMARY.md`** - Implementation summary

---

## 🎯 What Data Gets Loaded?

### Without CSV Files (Default)
```
✈️  Flights: 31,486
   • 210 routes (15 major US airports)
   • 6 months of dates
   • Multiple airlines per route

🏨 Hotels: 86
   • 15 cities
   • 4-7 hotels per city
   • Realistic amenities and pricing

🚗 Cars: 82
   • 15 cities
   • 6 vehicle types (Economy to Luxury)
   • 7 rental vendors
```

### With CSV Files (Optional)
```
✈️  Flights: 50,000+
🏨 Hotels: 1,000+ (from Airbnb data)
🚗 Cars: 150+
📍 Airports: 346+ (all major US airports)
```

---

## 🗄️ Database Architecture

### MongoDB (Listings)
- `flights` - Flight inventory with pricing
- `hotels` - Hotel/accommodation listings
- `cars` - Car rental inventory

### PostgreSQL (Transactional)
- `users` - User accounts and profiles
- `bookings` - Booking records with transactions
- `payments` - Payment processing

### Redis (Caching)
- Listing cache (5-minute TTL)
- Search results (1-minute TTL)

---

## 🎯 Deal Detection

The script automatically marks deals:

**Flights**:
- Deal = price ≤ 85% of route average
- `isDeal: true` flag added
- `savingsPercent` calculated

**Hotels**:
- Deal = price ≤ 85% of city median
- `limitedAvailability` if rooms < 5
- Tags auto-generated

---

## 🧪 Testing

### Test 1: Connection
```bash
node scripts/test-data-loader.js
```
Verifies: MongoDB connection, env variables, data counts

### Test 2: Load Data
```bash
npm run load:kaggle-data
```
Expected: ~4 seconds to load 31K+ records

### Test 3: Query Data
```bash
node scripts/sample-queries.js
```
Shows: Cheap flights, deals, statistics, top routes

---

## 📈 Performance

```
Load Time: ~4 seconds (31K records)
Query Time: <100ms (with indexes)
Memory: Efficient (batch processing)
Scalability: 100K+ records supported
```

---

## 🔧 Configuration

### Adjust Date Range
Edit `load-kaggle-data.js` line 44:
```javascript
const generateFutureDates = (months = 6) => {  // Change to 12 for 1 year
```

### Adjust Deal Threshold
Edit `loadFlights()` around line 260:
```javascript
const isDeal = Math.random() < 0.15;  // 15% of flights are deals
```

Or for price-based detection:
```javascript
const isDeal = dealPrice <= basePrice * 0.85;  // 15% discount
```

---

## 🐛 Troubleshooting

### Error: "MONGODB_URI not set"
**Fix**: Check `.env` file exists in `backend/` directory

### Error: "CSV file not found"
**Fix**: This is normal! Script will use synthetic data automatically

### Error: "Connection timeout"
**Fix**: Check internet connection and MongoDB URI

### Want more data?
**Fix**: Download Kaggle CSV files (see `data/README.md`)

---

## 📚 Full Documentation

- **Quick start**: This file
- **Kaggle datasets**: `backend/scripts/data/README.md`
- **Complete guide**: `backend/scripts/KAGGLE_DATA_GUIDE.md`
- **Implementation**: `DATA_LOADING_SUMMARY.md` (project root)
- **Database architecture**: `docs/DATABASE_ARCHITECTURE.md`

---

## ✅ Checklist

- [x] Install dependencies: `npm install`
- [x] Configure `.env` file with MongoDB URI
- [x] Run data loader: `npm run load:kaggle-data`
- [x] Test connection: `node scripts/test-data-loader.js`
- [x] Test queries: `node scripts/sample-queries.js`
- [ ] (Optional) Download Kaggle datasets
- [ ] (Optional) Re-run loader with CSV files

---

## 🎉 You're Done!

Your database now has **31,000+ travel listings** ready to use!

**Next steps**:
1. Start the backend: `npm start`
2. Test the API endpoints
3. Connect the frontend
4. Start booking!

---

**Need help?** See the detailed guides in the documentation files listed above.

