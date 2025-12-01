# Kaggle Datasets for Kayak Platform

This directory contains real-world travel data from Kaggle to populate the Kayak platform with realistic listings.

## 📥 Required Datasets

### 1. **Airports Data** (Required)
Download the Global Airports dataset to get accurate IATA codes, coordinates, and airport information.

**Dataset**: Global Airports (IATA/ICAO/coords/timezone)
- **URL**: https://www.kaggle.com/datasets/samvelkoch/global-airports-iata-icao-timezone-geo
- **File needed**: `airports.csv`
- **Place in**: `backend/scripts/data/airports.csv`

**Alternative**: OpenFlights Dataset
- **URL**: https://www.kaggle.com/datasets/elmoallistair/airlines-airport-and-routes
- **File needed**: `airports.dat` (rename to `airports.csv`)

---

### 2. **Flight Prices** (Recommended)
Choose ONE of these flight datasets:

#### Option A: EaseMyTrip Flight Price Prediction (India)
- **URL**: https://www.kaggle.com/datasets/shubhambathwal/flight-price-prediction
- **File needed**: `Clean_Dataset.csv` or `Data_Train.xlsx` (convert to CSV)
- **Place in**: `backend/scripts/data/Clean_Dataset.csv`
- **Columns**: airline, source, destination, duration, price, stops

#### Option B: Expedia Flight Prices (US Routes)
- **URL**: https://www.kaggle.com/datasets/dilwong/flightprices
- **File needed**: `itineraries.csv`
- **Place in**: `backend/scripts/data/itineraries.csv`
- **Columns**: legId, searchDate, flightDate, startingAirport, destinationAirport, fareBasisCode, travelDuration, totalFare

**Note**: If no flight CSV is provided, the script will generate synthetic flights based on airports data.

---

### 3. **Hotels/Airbnb Listings** (Recommended)
Choose ONE of these accommodation datasets:

#### Option A: Inside Airbnb - NYC
- **URL**: https://www.kaggle.com/datasets/dominoweir/inside-airbnb-nyc
- **Alternative**: http://insideairbnb.com/get-the-data/ (direct download)
- **File needed**: `listings.csv` or `listings.csv.gz` (gunzip if compressed)
- **Place in**: `backend/scripts/data/listings.csv`
- **Columns**: id, name, neighbourhood, latitude, longitude, price, rating, amenities, availability_30

#### Option B: Hotel Booking Demand
- **URL**: https://www.kaggle.com/datasets/mojtaba142/hotel-booking
- **File needed**: `hotel_bookings.csv`
- **Place in**: `backend/scripts/data/hotel_bookings.csv`
- **Columns**: hotel, lead_time, arrival_date, adr (average daily rate), country

**Note**: If no hotel CSV is provided, the script will generate synthetic hotels based on airports/cities.

---

## 📦 Installation Steps

### Step 1: Install Dependencies
```bash
cd backend
npm install csv-parse
```

### Step 2: Create Kaggle Account
1. Go to https://www.kaggle.com/
2. Sign up or log in
3. Go to your account settings: https://www.kaggle.com/account
4. Scroll to "API" section and click "Create New API Token"
5. This downloads `kaggle.json` with your credentials

### Step 3: Download Datasets

#### Using Kaggle CLI (Recommended)
```bash
# Install Kaggle CLI
pip install kaggle

# Set up Kaggle credentials
mkdir -p ~/.kaggle
mv ~/Downloads/kaggle.json ~/.kaggle/
chmod 600 ~/.kaggle/kaggle.json

# Create data directory
mkdir -p backend/scripts/data
cd backend/scripts/data

# Download Airports
kaggle datasets download -d samvelkoch/global-airports-iata-icao-timezone-geo
unzip global-airports-iata-icao-timezone-geo.zip
mv airports.dat airports.csv  # if needed

# Download Flights (Option A - EaseMyTrip)
kaggle datasets download -d shubhambathwal/flight-price-prediction
unzip flight-price-prediction.zip

# Download Hotels (Option A - Airbnb NYC)
kaggle datasets download -d dominoweir/inside-airbnb-nyc
unzip inside-airbnb-nyc.zip
```

#### Manual Download (Alternative)
1. Go to each dataset URL listed above
2. Click "Download" button (you must be logged in)
3. Extract the ZIP files
4. Copy the required CSV files to `backend/scripts/data/`

---

## 🚀 Running the Data Loader

### Basic Usage
```bash
cd backend
npm run load:kaggle-data
```

### What the Script Does
1. ✅ Reads CSV files from `backend/scripts/data/`
2. ✅ Processes and transforms data for MongoDB
3. ✅ Generates flights for next 6 months using real routes
4. ✅ Detects deals (price ≤ 85% of average)
5. ✅ Marks limited availability hotels
6. ✅ Clears existing collections and inserts new data
7. ✅ Creates indexes for optimal query performance

### Expected Output
```
✅ Connected to MongoDB

📍 Step 1: Loading airports...
   Loaded 346 airports

✈️  Step 2: Loading flights...
   Processing 500 flight records from Kaggle dataset
   Generated 30,000 flights

🏨 Step 3: Loading hotels...
   Processing 1000 hotel records from Kaggle dataset
   Generated 1,000 hotels

🚗 Step 4: Loading cars...
   Generated 150 cars

🗑️  Clearing existing collections...
   Collections cleared

💾 Inserting data into MongoDB...
✅ Inserted 30,000 flights
✅ Inserted 1,000 hotels
✅ Inserted 150 cars

📊 Creating indexes...
✅ Indexes created

🎉 Database seeded successfully with Kaggle data!

📊 Summary:
   ✈️  Flights: 30,000
   🏨 Hotels: 1,000
   🚗 Cars: 150
   📍 Airports: 346
```

---

## 📊 Data Schema

### Flights Collection (MongoDB)
```javascript
{
  _id: "FL-1001",
  id: "FL-1001",
  from: "JFK",
  to: "LAX",
  departDate: "2025-12-15",
  returnDate: null,
  airline: "Delta Air Lines",
  durationMinutes: 330,
  price: 285.99,
  currency: "USD",
  nonstop: true,
  stops: 0,
  departureTime: "10:30",
  arrivalTime: "13:45",
  
  // Deal metadata
  isDeal: true,
  avgPrice: 350.00,
  savingsPercent: 18,
  
  createdAt: ISODate("2025-12-01"),
  updatedAt: ISODate("2025-12-01")
}
```

### Hotels Collection (MongoDB)
```javascript
{
  _id: "HT-2001",
  id: "HT-2001",
  city: "New York",
  state: "NY",
  name: "Cozy Manhattan Apartment",
  rating: 4.8,
  pricePerNight: 125.00,
  currency: "USD",
  amenities: ["wifi", "kitchen", "breakfast", "parking"],
  lat: 40.7589,
  lng: -73.9851,
  
  // Deal metadata
  isDeal: true,
  limitedAvailability: false,
  availableRooms: 15,
  tags: ["wifi", "kitchen", "breakfast", "Great Deal"],
  neighbourhood: "Midtown",
  
  createdAt: ISODate("2025-12-01"),
  updatedAt: ISODate("2025-12-01")
}
```

### Cars Collection (MongoDB)
```javascript
{
  _id: "CR-3001",
  id: "CR-3001",
  city: "Los Angeles",
  state: "CA",
  vendor: "Hertz",
  type: "SUV",
  seats: 7,
  pricePerDay: 78.99,
  currency: "USD",
  createdAt: ISODate("2025-12-01"),
  updatedAt: ISODate("2025-12-01")
}
```

---

## 🔧 Customization

### Adjust Date Range
Edit `load-kaggle-data.js` line 44:
```javascript
const generateFutureDates = (months = 6) => {  // Change 6 to desired months
```

### Adjust Data Volume
Edit the sampling in `loadFlights()` and `loadHotels()`:
```javascript
const sampleSize = Math.min(flightData.length, 500); // Increase 500 for more flights
```

### Add Custom Airports
Edit `getDefaultAirports()` function to add your preferred airports.

---

## 🎯 Deal Detection Logic

### Flights
- **Deal**: price ≤ 85% of average price for route
- **Savings**: Calculated as percentage off average

### Hotels
- **Deal**: pricePerNight ≤ 85% of city median ($150)
- **Limited Availability**: available rooms < 5
- **Tags**: Auto-generated from amenities and deal status

---

## ⚡ Performance Tips

1. **Use indexes**: Already created automatically
2. **Batch inserts**: Script uses 1000-record batches
3. **Connection pooling**: Configured in `database.js`
4. **Cache frequently accessed data**: Use Redis caching

Expected load times:
- 10,000 records: ~5 seconds
- 50,000 records: ~20 seconds
- 100,000 records: ~40 seconds

---

## 🐛 Troubleshooting

### Error: "No such file or directory: airports.csv"
- Download the airports dataset and place it in `backend/scripts/data/`
- Or let the script use default US airports (no download needed)

### Error: "MONGODB_URI is not set"
- Make sure `.env` file exists in `backend/` directory
- Check that `MONGODB_URI` is properly configured

### Error: "Failed to parse CSV"
- Ensure CSV files are not corrupted
- Try re-downloading the dataset
- Check that files are actual CSV format (not Excel or compressed)

### Script runs but generates synthetic data
- This is normal if CSV files are not found
- The script will generate realistic synthetic data automatically

### Out of Memory Error
- Reduce `sampleSize` in `loadFlights()` and `loadHotels()`
- Process data in smaller batches

---

## 📚 Additional Resources

- **Kaggle API Docs**: https://github.com/Kaggle/kaggle-api
- **Inside Airbnb**: http://insideairbnb.com/get-the-data/
- **MongoDB Indexes**: https://www.mongodb.com/docs/manual/indexes/
- **CSV Parse**: https://csv.js.org/parse/

---

## 📄 License

The datasets are provided by Kaggle and are subject to their respective licenses:
- Most datasets are licensed under CC0, CC BY-SA, or similar open licenses
- Check individual dataset pages for specific license information
- This script and transformation code is part of the Kayak platform

---

## 🤝 Contributing

Have a better dataset or transformation logic? Submit a PR!

**Useful Datasets to Add:**
- Car rental prices (currently synthetic)
- More international airports
- Seasonal pricing patterns
- Real-time availability data

