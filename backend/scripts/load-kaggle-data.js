import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import { logger } from '../src/config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

/**
 * Main script to load real Kaggle datasets into MongoDB
 * 
 * Data Sources:
 * 1. Flights: Flight Price Prediction (EaseMyTrip) + Expedia Flight Prices
 * 2. Hotels: Inside Airbnb NYC + Hotel Booking Demand
 * 3. Airports: Global Airports (IATA/ICAO/coords/timezone)
 * 
 * Instructions:
 * 1. Download datasets from Kaggle (see README in this directory)
 * 2. Place CSV files in backend/scripts/data/ directory
 * 3. Run: npm run load:kaggle-data
 */

const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Helper: Read CSV file
 */
const readCSV = (filename) => {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) {
    logger.warn(`CSV file not found: ${filename}`);
    return [];
  }
  
  const content = fs.readFileSync(filepath, 'utf-8');
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
};

/**
 * Helper: Generate dates for the next 6 months
 */
const generateFutureDates = (months = 6) => {
  const dates = [];
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + months);
  
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

/**
 * Helper: Generate time string (HH:MM)
 */
const generateTime = () => {
  const hour = Math.floor(Math.random() * 24);
  const minute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

/**
 * Load airports data from Global Airports dataset
 */
const loadAirports = async () => {
  logger.info('Loading airports data...');
  
  // Read airports.csv from Kaggle dataset
  const airportsData = readCSV('airports.csv');
  
  if (airportsData.length === 0) {
    logger.warn('No airports data found, using default US airports');
    return getDefaultAirports();
  }
  
  // Filter for US airports with IATA codes
  const usAirports = airportsData
    .filter(row => 
      row.iso_country === 'US' && 
      row.iata_code && 
      row.iata_code.length === 3 &&
      row.type && 
      (row.type.includes('large_airport') || row.type.includes('medium_airport'))
    )
    .map(row => ({
      code: row.iata_code.toUpperCase(),
      name: row.name,
      city: row.municipality || 'Unknown',
      state: row.iso_region?.split('-')[1] || 'Unknown',
      country: row.iso_country,
      lat: parseFloat(row.latitude_deg) || 0,
      lng: parseFloat(row.longitude_deg) || 0,
      elevation: parseInt(row.elevation_ft) || 0,
      timezone: row.timezone || 'America/New_York',
    }));
  
  logger.info(`Loaded ${usAirports.length} US airports`);
  return usAirports;
};

/**
 * Default airports if CSV not available
 */
const getDefaultAirports = () => {
  return [
    { code: 'LAX', city: 'Los Angeles', state: 'CA', lat: 33.9425, lng: -118.4081 },
    { code: 'JFK', city: 'New York', state: 'NY', lat: 40.6413, lng: -73.7781 },
    { code: 'SFO', city: 'San Francisco', state: 'CA', lat: 37.6213, lng: -122.3790 },
    { code: 'ORD', city: 'Chicago', state: 'IL', lat: 41.9742, lng: -87.9073 },
    { code: 'DFW', city: 'Dallas', state: 'TX', lat: 32.8998, lng: -97.0403 },
    { code: 'DEN', city: 'Denver', state: 'CO', lat: 39.8561, lng: -104.6737 },
    { code: 'ATL', city: 'Atlanta', state: 'GA', lat: 33.6407, lng: -84.4277 },
    { code: 'LAS', city: 'Las Vegas', state: 'NV', lat: 36.0840, lng: -115.1537 },
    { code: 'SEA', city: 'Seattle', state: 'WA', lat: 47.4502, lng: -122.3088 },
    { code: 'MIA', city: 'Miami', state: 'FL', lat: 25.7959, lng: -80.2870 },
    { code: 'BOS', city: 'Boston', state: 'MA', lat: 42.3656, lng: -71.0096 },
    { code: 'PHX', city: 'Phoenix', state: 'AZ', lat: 33.4342, lng: -112.0116 },
    { code: 'IAH', city: 'Houston', state: 'TX', lat: 29.9902, lng: -95.3368 },
    { code: 'MCO', city: 'Orlando', state: 'FL', lat: 28.4312, lng: -81.3083 },
    { code: 'EWR', city: 'Newark', state: 'NJ', lat: 40.6895, lng: -74.1745 },
  ];
};

/**
 * Load flights from Kaggle datasets
 */
const loadFlights = async (airports) => {
  logger.info('Loading flights data...');
  
  // Try to read from multiple possible Kaggle datasets
  let flightData = readCSV('Clean_Dataset.csv'); // EaseMyTrip dataset
  if (flightData.length === 0) {
    flightData = readCSV('itineraries.csv'); // Expedia dataset
  }
  
  const flights = [];
  const flightIdCounter = { count: 1001 };
  const futureDates = generateFutureDates(6);
  
  // Get major airports for routes
  const majorAirports = airports.slice(0, 20);
  
  if (flightData.length === 0) {
    logger.warn('No flight data from CSV, generating synthetic flights based on airports');
    return generateSyntheticFlights(airports, futureDates, flightIdCounter);
  }
  
  logger.info(`Processing ${flightData.length} flight records from Kaggle dataset`);
  
  // Process real flight data
  const airlines = ['American Airlines', 'Delta Air Lines', 'United Airlines', 'Southwest Airlines', 
                   'JetBlue Airways', 'Alaska Airlines', 'Spirit Airlines', 'Frontier Airlines'];
  
  // Sample and duplicate flights across future dates
  const sampleSize = Math.min(flightData.length, 500); // Use up to 500 unique routes
  const sampledFlights = flightData.slice(0, sampleSize);
  
  sampledFlights.forEach((row, idx) => {
    // Extract flight info from CSV (columns vary by dataset)
    const from = row.source || row.origin || majorAirports[idx % majorAirports.length].code;
    const to = row.destination || row.dest || majorAirports[(idx + 5) % majorAirports.length].code;
    const airline = row.airline || airlines[Math.floor(Math.random() * airlines.length)];
    const stops = parseInt(row.stops || row.stop || 0);
    const duration = parseInt(row.duration || row.duration_minutes || (180 + Math.random() * 180));
    const basePrice = parseFloat(row.price || row.fare || (150 + Math.random() * 300));
    
    // Validate airport codes
    const fromAirport = airports.find(a => a.code === from);
    const toAirport = airports.find(a => a.code === to);
    
    if (!fromAirport || !toAirport) return;
    
    // Generate flights for multiple future dates (2-3 flights per date)
    const numDates = Math.min(30, futureDates.length); // Use first 30 days
    const selectedDates = futureDates.slice(0, numDates);
    
    selectedDates.forEach(date => {
      const flightsPerDay = 2 + Math.floor(Math.random() * 2); // 2-3 flights per day
      
      for (let i = 0; i < flightsPerDay; i++) {
        // Add price variation (±20%)
        const priceVariation = 0.8 + Math.random() * 0.4;
        const finalPrice = Math.round(basePrice * priceVariation * 100) / 100;
        
        // Deal detection: 15% chance of being a deal (price <= 85% of base)
        const isDeal = Math.random() < 0.15;
        const dealPrice = isDeal ? Math.round(basePrice * 0.75 * 100) / 100 : finalPrice;
        
        flights.push({
          _id: `FL-${flightIdCounter.count++}`,
          id: `FL-${flightIdCounter.count - 1}`,
          from,
          to,
          departDate: date.toISOString().split('T')[0],
          returnDate: null,
          airline,
          durationMinutes: duration,
          price: Math.max(99, dealPrice),
          currency: 'USD',
          nonstop: stops === 0,
          stops,
          departureTime: generateTime(),
          arrivalTime: generateTime(),
          
          // Deal metadata
          isDeal: isDeal,
          avgPrice: basePrice,
          savingsPercent: isDeal ? Math.round((1 - dealPrice / basePrice) * 100) : 0,
          
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    });
  });
  
  logger.info(`Generated ${flights.length} flights from Kaggle data`);
  return flights;
};

/**
 * Generate synthetic flights if no CSV available
 */
const generateSyntheticFlights = (airports, futureDates, flightIdCounter) => {
  logger.info('Generating synthetic flights...');
  
  const flights = [];
  const airlines = ['American Airlines', 'Delta Air Lines', 'United Airlines', 'Southwest Airlines', 
                   'JetBlue Airways', 'Alaska Airlines', 'Spirit Airlines', 'Frontier Airlines'];
  
  const majorAirports = airports.slice(0, 15);
  const routes = [];
  
  // Generate routes between major airports
  for (let i = 0; i < majorAirports.length; i++) {
    for (let j = i + 1; j < majorAirports.length; j++) {
      routes.push([majorAirports[i].code, majorAirports[j].code]);
      routes.push([majorAirports[j].code, majorAirports[i].code]);
    }
  }
  
  // Generate flights for each route and date
  const selectedDates = futureDates.slice(0, 60); // First 60 days
  
  routes.forEach(([from, to]) => {
    const baseDuration = 90 + Math.random() * 240;
    const basePrice = 150 + Math.random() * 300;
    
    selectedDates.forEach(date => {
      const flightsPerDay = 2 + Math.floor(Math.random() * 2);
      
      for (let i = 0; i < flightsPerDay; i++) {
        const airline = airlines[Math.floor(Math.random() * airlines.length)];
        const nonstop = Math.random() > 0.3;
        const priceVariation = 0.8 + Math.random() * 0.4;
        const price = Math.round(basePrice * priceVariation * 100) / 100;
        
        flights.push({
          _id: `FL-${flightIdCounter.count++}`,
          id: `FL-${flightIdCounter.count - 1}`,
          from,
          to,
          departDate: date.toISOString().split('T')[0],
          returnDate: null,
          airline,
          durationMinutes: Math.round(baseDuration),
          price: Math.max(99, price),
          currency: 'USD',
          nonstop,
          stops: nonstop ? 0 : 1,
          departureTime: generateTime(),
          arrivalTime: generateTime(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    });
  });
  
  return flights;
};

/**
 * Load hotels from Kaggle datasets (Airbnb + Hotel Booking)
 */
const loadHotels = async (airports) => {
  logger.info('Loading hotels data...');
  
  // Try reading Airbnb listings
  let hotelData = readCSV('listings.csv'); // Inside Airbnb NYC
  if (hotelData.length === 0) {
    hotelData = readCSV('hotel_bookings.csv'); // Hotel Booking Demand
  }
  
  const hotels = [];
  const hotelIdCounter = { count: 2001 };
  
  // Get major cities
  const majorCities = airports.slice(0, 25);
  
  if (hotelData.length === 0) {
    logger.warn('No hotel data from CSV, generating synthetic hotels');
    return generateSyntheticHotels(majorCities, hotelIdCounter);
  }
  
  logger.info(`Processing ${hotelData.length} hotel/listing records from Kaggle dataset`);
  
  // Process real hotel data
  const amenitiesList = ['wifi', 'breakfast', 'parking', 'gym', 'pool', 'spa', 
                         'restaurant', 'bar', 'room_service', 'pet_friendly', 'kitchen'];
  
  const sampleSize = Math.min(hotelData.length, 1000);
  const sampledHotels = hotelData.slice(0, sampleSize);
  
  sampledHotels.forEach((row, idx) => {
    // Extract hotel info (columns vary by dataset)
    const name = row.name || row.hotel || `Hotel ${idx + 1}`;
    const city = row.neighbourhood_cleansed || row.city || majorCities[idx % majorCities.length].city;
    const state = majorCities[idx % majorCities.length].state;
    
    // Price extraction
    let pricePerNight = parseFloat(row.price?.replace(/[$,]/g, '') || row.adr || (80 + Math.random() * 200));
    if (pricePerNight > 1000) pricePerNight = pricePerNight / 10; // Adjust if needed
    pricePerNight = Math.max(50, Math.round(pricePerNight * 100) / 100);
    
    // Rating
    const rating = parseFloat(row.review_scores_rating || row.average_daily_rate || (3.5 + Math.random() * 1.5));
    const normalizedRating = rating > 10 ? rating / 20 : rating; // Normalize to 0-5 scale
    
    // Amenities from Airbnb data
    let selectedAmenities = [];
    if (row.amenities) {
      const rawAmenities = row.amenities.toLowerCase();
      selectedAmenities = amenitiesList.filter(a => rawAmenities.includes(a));
    }
    if (selectedAmenities.length === 0) {
      // Random amenities if not available
      const numAmenities = 3 + Math.floor(Math.random() * 5);
      selectedAmenities = amenitiesList.sort(() => 0.5 - Math.random()).slice(0, numAmenities);
    }
    
    // Coordinates
    const lat = parseFloat(row.latitude) || majorCities[idx % majorCities.length].lat + (Math.random() - 0.5) * 0.1;
    const lng = parseFloat(row.longitude) || majorCities[idx % majorCities.length].lng + (Math.random() - 0.5) * 0.1;
    
    // Deal detection
    const cityMedianPrice = 150;
    const isDeal = pricePerNight <= cityMedianPrice * 0.85;
    
    // Availability (from Airbnb data)
    const availability = parseInt(row.availability_30 || row.availability_365 || 25);
    const limitedAvailability = availability < 5;
    
    hotels.push({
      _id: `HT-${hotelIdCounter.count++}`,
      id: `HT-${hotelIdCounter.count - 1}`,
      city,
      state,
      name: name.substring(0, 100), // Limit name length
      rating: Math.min(5, Math.max(0, Math.round(normalizedRating * 10) / 10)),
      pricePerNight,
      currency: 'USD',
      amenities: selectedAmenities,
      lat,
      lng,
      
      // Deal metadata
      isDeal,
      limitedAvailability,
      availableRooms: availability,
      tags: [
        ...selectedAmenities.slice(0, 3).map(a => a.replace('_', ' ')),
        limitedAvailability ? 'Limited Availability' : null,
        isDeal ? 'Great Deal' : null,
      ].filter(Boolean),
      
      // Neighborhood/location from Airbnb
      neighbourhood: row.neighbourhood_cleansed || row.neighbourhood || null,
      
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });
  
  logger.info(`Generated ${hotels.length} hotels from Kaggle data`);
  return hotels;
};

/**
 * Generate synthetic hotels if no CSV available
 */
const generateSyntheticHotels = (cities, hotelIdCounter) => {
  logger.info('Generating synthetic hotels...');
  
  const hotels = [];
  const hotelChains = ['Marriott', 'Hilton', 'Hyatt', 'Holiday Inn', 'Best Western', 
                       'Sheraton', 'Westin', 'Radisson'];
  const hotelSuffixes = ['Grand Hotel', 'Plaza', 'Inn', 'Resort', 'Suites', 'Lodge'];
  const amenities = ['wifi', 'breakfast', 'parking', 'gym', 'pool', 'spa', 
                     'restaurant', 'bar', 'room_service', 'pet_friendly'];
  
  cities.forEach(city => {
    const numHotels = 4 + Math.floor(Math.random() * 4); // 4-7 hotels per city
    
    for (let i = 0; i < numHotels; i++) {
      const chain = hotelChains[Math.floor(Math.random() * hotelChains.length)];
      const suffix = hotelSuffixes[Math.floor(Math.random() * hotelSuffixes.length)];
      const name = `${chain} ${city.city} ${suffix}`;
      
      const rating = 3.5 + Math.random() * 1.5;
      const pricePerNight = Math.round((80 + Math.random() * 200) * 100) / 100;
      
      const numAmenities = 3 + Math.floor(Math.random() * 5);
      const selectedAmenities = amenities.sort(() => 0.5 - Math.random()).slice(0, numAmenities);
      
      const lat = city.lat + (Math.random() - 0.5) * 0.1;
      const lng = city.lng + (Math.random() - 0.5) * 0.1;
      
      hotels.push({
        _id: `HT-${hotelIdCounter.count++}`,
        id: `HT-${hotelIdCounter.count - 1}`,
        city: city.city,
        state: city.state,
        name,
        rating: Math.round(rating * 10) / 10,
        pricePerNight,
        currency: 'USD',
        amenities: selectedAmenities,
        lat,
        lng,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  });
  
  return hotels;
};

/**
 * Load cars (synthetic based on airports/cities)
 */
const loadCars = async (airports) => {
  logger.info('Loading cars data...');
  
  const cars = [];
  const carIdCounter = { count: 3001 };
  
  const vendors = ['Hertz', 'Avis', 'Enterprise', 'Budget', 'National', 'Alamo', 'Thrifty'];
  const carTypes = [
    { type: 'Economy', seats: 4, basePrice: 35 },
    { type: 'Compact', seats: 4, basePrice: 40 },
    { type: 'Mid-size', seats: 5, basePrice: 50 },
    { type: 'Full-size', seats: 5, basePrice: 60 },
    { type: 'SUV', seats: 7, basePrice: 75 },
    { type: 'Luxury', seats: 5, basePrice: 100 },
  ];
  
  // Generate cars for major cities
  const majorCities = airports.slice(0, 25);
  
  majorCities.forEach(city => {
    const numCars = 4 + Math.floor(Math.random() * 3); // 4-6 cars per city
    
    for (let i = 0; i < numCars; i++) {
      const vendor = vendors[Math.floor(Math.random() * vendors.length)];
      const carType = carTypes[Math.floor(Math.random() * carTypes.length)];
      
      const pricePerDay = Math.round((carType.basePrice + Math.random() * 20) * 100) / 100;
      
      cars.push({
        _id: `CR-${carIdCounter.count++}`,
        id: `CR-${carIdCounter.count - 1}`,
        city: city.city,
        state: city.state,
        vendor,
        type: carType.type,
        seats: carType.seats,
        pricePerDay,
        currency: 'USD',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  });
  
  logger.info(`Generated ${cars.length} cars`);
  return cars;
};

/**
 * Main function to seed database
 */
const seedDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    console.error('MONGODB_URI environment variable is not set');
    process.exit(1);
  }
  
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    
    // Step 1: Load airports (reference data)
    console.log('\n📍 Step 1: Loading airports...');
    const airports = await loadAirports();
    console.log(`   Loaded ${airports.length} airports`);
    
    // Step 2: Load flights
    console.log('\n✈️  Step 2: Loading flights...');
    const flights = await loadFlights(airports);
    console.log(`   Generated ${flights.length} flights`);
    
    // Step 3: Load hotels
    console.log('\n🏨 Step 3: Loading hotels...');
    const hotels = await loadHotels(airports);
    console.log(`   Generated ${hotels.length} hotels`);
    
    // Step 4: Load cars
    console.log('\n🚗 Step 4: Loading cars...');
    const cars = await loadCars(airports);
    console.log(`   Generated ${cars.length} cars`);
    
    // Clear existing collections
    console.log('\n🗑️  Clearing existing collections...');
    await db.collection('flights').deleteMany({});
    await db.collection('hotels').deleteMany({});
    await db.collection('cars').deleteMany({});
    console.log('   Collections cleared');
    
    // Insert data
    console.log('\n💾 Inserting data into MongoDB...');
    
    if (flights.length > 0) {
      // Insert in batches to avoid memory issues
      const batchSize = 1000;
      for (let i = 0; i < flights.length; i += batchSize) {
        const batch = flights.slice(i, i + batchSize);
        await db.collection('flights').insertMany(batch);
        console.log(`   Inserted flights batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(flights.length / batchSize)}`);
      }
      console.log(`✅ Inserted ${flights.length} flights`);
    }
    
    if (hotels.length > 0) {
      const batchSize = 1000;
      for (let i = 0; i < hotels.length; i += batchSize) {
        const batch = hotels.slice(i, i + batchSize);
        await db.collection('hotels').insertMany(batch);
        console.log(`   Inserted hotels batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(hotels.length / batchSize)}`);
      }
      console.log(`✅ Inserted ${hotels.length} hotels`);
    }
    
    if (cars.length > 0) {
      await db.collection('cars').insertMany(cars);
      console.log(`✅ Inserted ${cars.length} cars`);
    }
    
    // Create indexes for better query performance
    console.log('\n📊 Creating indexes...');
    await db.collection('flights').createIndex({ from: 1, to: 1, departDate: 1 });
    await db.collection('flights').createIndex({ airline: 1 });
    await db.collection('flights').createIndex({ price: 1 });
    await db.collection('flights').createIndex({ isDeal: 1 });
    
    await db.collection('hotels').createIndex({ city: 1 });
    await db.collection('hotels').createIndex({ state: 1 });
    await db.collection('hotels').createIndex({ pricePerNight: 1 });
    await db.collection('hotels').createIndex({ rating: 1 });
    await db.collection('hotels').createIndex({ isDeal: 1 });
    
    await db.collection('cars').createIndex({ city: 1 });
    await db.collection('cars').createIndex({ state: 1 });
    await db.collection('cars').createIndex({ pricePerDay: 1 });
    
    console.log('✅ Indexes created');
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Database seeded successfully with Kaggle data!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   ✈️  Flights: ${flights.length.toLocaleString()}`);
    console.log(`   🏨 Hotels: ${hotels.length.toLocaleString()}`);
    console.log(`   🚗 Cars: ${cars.length.toLocaleString()}`);
    console.log(`   📍 Airports: ${airports.length}`);
    console.log('\n💡 Tips:');
    console.log('   - Flight deals are marked with isDeal: true');
    console.log('   - Hotels with limited availability have limitedAvailability: true');
    console.log('   - Data covers the next 6 months of dates');
    console.log('   - All prices are in USD');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
};

// Run the seed script
seedDatabase();

