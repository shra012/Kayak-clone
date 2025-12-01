import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// US Airport Codes (3-letter IATA codes)
const US_AIRPORTS = [
  { code: 'LAX', city: 'Los Angeles', state: 'California', lat: 33.9425, lng: -118.4081 },
  { code: 'JFK', city: 'New York', state: 'New York', lat: 40.6413, lng: -73.7781 },
  { code: 'SFO', city: 'San Francisco', state: 'California', lat: 37.6213, lng: -122.3790 },
  { code: 'ORD', city: 'Chicago', state: 'Illinois', lat: 41.9742, lng: -87.9073 },
  { code: 'DFW', city: 'Dallas', state: 'Texas', lat: 32.8998, lng: -97.0403 },
  { code: 'DEN', city: 'Denver', state: 'Colorado', lat: 39.8561, lng: -104.6737 },
  { code: 'ATL', city: 'Atlanta', state: 'Georgia', lat: 33.6407, lng: -84.4277 },
  { code: 'LAS', city: 'Las Vegas', state: 'Nevada', lat: 36.0840, lng: -115.1537 },
  { code: 'SEA', city: 'Seattle', state: 'Washington', lat: 47.4502, lng: -122.3088 },
  { code: 'MIA', city: 'Miami', state: 'Florida', lat: 25.7959, lng: -80.2870 },
  { code: 'BOS', city: 'Boston', state: 'Massachusetts', lat: 42.3656, lng: -71.0096 },
  { code: 'PHX', city: 'Phoenix', state: 'Arizona', lat: 33.4342, lng: -112.0116 },
  { code: 'IAH', city: 'Houston', state: 'Texas', lat: 29.9902, lng: -95.3368 },
  { code: 'MCO', city: 'Orlando', state: 'Florida', lat: 28.4312, lng: -81.3083 },
  { code: 'CLT', city: 'Charlotte', state: 'North Carolina', lat: 35.2144, lng: -80.9473 },
  { code: 'EWR', city: 'Newark', state: 'New Jersey', lat: 40.6895, lng: -74.1745 },
  { code: 'DTW', city: 'Detroit', state: 'Michigan', lat: 42.2162, lng: -83.3554 },
  { code: 'PHL', city: 'Philadelphia', state: 'Pennsylvania', lat: 39.8719, lng: -75.2411 },
  { code: 'LGA', city: 'New York', state: 'New York', lat: 40.7769, lng: -73.8740 },
  { code: 'BWI', city: 'Baltimore', state: 'Maryland', lat: 39.1774, lng: -76.6684 },
  { code: 'SLC', city: 'Salt Lake City', state: 'Utah', lat: 40.7899, lng: -111.9791 },
  { code: 'DCA', city: 'Washington', state: 'District of Columbia', lat: 38.8512, lng: -77.0402 },
  { code: 'MDW', city: 'Chicago', state: 'Illinois', lat: 41.7868, lng: -87.7524 },
  { code: 'HNL', city: 'Honolulu', state: 'Hawaii', lat: 21.3206, lng: -157.9242 },
  { code: 'SAN', city: 'San Diego', state: 'California', lat: 32.7338, lng: -117.1933 },
  { code: 'STL', city: 'St. Louis', state: 'Missouri', lat: 38.7487, lng: -90.3700 },
  { code: 'TPA', city: 'Tampa', state: 'Florida', lat: 27.9755, lng: -82.5332 },
  { code: 'PDX', city: 'Portland', state: 'Oregon', lat: 45.5898, lng: -122.5951 },
  { code: 'MSP', city: 'Minneapolis', state: 'Minnesota', lat: 44.8848, lng: -93.2223 },
  { code: 'BNA', city: 'Nashville', state: 'Tennessee', lat: 36.1263, lng: -86.6774 },
  { code: 'AUS', city: 'Austin', state: 'Texas', lat: 30.1945, lng: -97.6699 },
  { code: 'OAK', city: 'Oakland', state: 'California', lat: 37.7213, lng: -122.2207 },
  { code: 'RDU', city: 'Raleigh', state: 'North Carolina', lat: 35.8776, lng: -78.7875 },
  { code: 'DAL', city: 'Dallas', state: 'Texas', lat: 32.8471, lng: -96.8518 },
  { code: 'IAD', city: 'Washington', state: 'District of Columbia', lat: 38.9445, lng: -77.4558 },
  { code: 'SMF', city: 'Sacramento', state: 'California', lat: 38.6954, lng: -121.5908 },
];

// Major US Airlines with their IATA codes
const AIRLINES = [
  { name: 'American Airlines', code: 'AA' },
  { name: 'Delta Air Lines', code: 'DL' },
  { name: 'United Airlines', code: 'UA' },
  { name: 'Southwest Airlines', code: 'WN' },
  { name: 'JetBlue Airways', code: 'B6' },
  { name: 'Alaska Airlines', code: 'AS' },
  { name: 'Spirit Airlines', code: 'NK' },
  { name: 'Frontier Airlines', code: 'F9' },
];

// Flight classes
const FLIGHT_CLASSES = ['economy', 'premium_economy', 'business', 'first'];

// Hotel chains and names
const HOTEL_CHAINS = [
  'Marriott',
  'Hilton',
  'Hyatt',
  'Holiday Inn',
  'Best Western',
  'Sheraton',
  'Westin',
  'Radisson',
  'DoubleTree',
  'Embassy Suites',
];

const HOTEL_SUFFIXES = [
  'Grand Hotel',
  'Plaza',
  'Inn',
  'Resort',
  'Suites',
  'Lodge',
  'Tower',
  'Center',
  'Park',
  'Beach Hotel',
];

// Car rental vendors
const CAR_VENDORS = ['Hertz', 'Avis', 'Enterprise', 'Budget', 'National', 'Alamo', 'Thrifty'];

// Car types
const CAR_TYPES = [
  { type: 'Economy', seats: 4, basePrice: 35 },
  { type: 'Compact', seats: 4, basePrice: 40 },
  { type: 'Mid-size', seats: 5, basePrice: 50 },
  { type: 'Full-size', seats: 5, basePrice: 60 },
  { type: 'SUV', seats: 7, basePrice: 75 },
  { type: 'Luxury', seats: 5, basePrice: 100 },
];

// Hotel amenities
const AMENITIES = [
  'wifi',
  'breakfast',
  'parking',
  'gym',
  'pool',
  'spa',
  'restaurant',
  'bar',
  'room_service',
  'concierge',
  'airport_shuttle',
  'pet_friendly',
  'beach_access',
  'business_center',
];

// Generate date string in YYYY-MM-DD format (local timezone, not UTC)
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Generate dates for flights - from November 15, 2025 to February 29, 2026
const generateFlightDates = () => {
  const dates = [];
  const startDate = new Date('2025-11-15');
  const endDate = new Date('2026-02-28'); // February 28, 2026 (2026 is not a leap year)
  
  // Generate all dates from start to end
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(formatDate(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates.sort();
};

// Generate random time
const getRandomTime = () => {
  const hour = Math.floor(Math.random() * 24);
  const minute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

// Calculate flight duration in minutes (rough estimate)
const calculateDuration = (from, to) => {
  // Rough distance-based duration calculation
  const distances = {
    'LAX-JFK': 330,
    'LAX-SFO': 90,
    'JFK-SFO': 360,
    'LAX-ORD': 240,
    'JFK-ORD': 120,
    'SFO-ORD': 240,
    'ATL-JFK': 120,
    'LAX-DEN': 150,
    'DEN-ORD': 120,
    'MIA-JFK': 180,
    'SEA-LAX': 150,
    'BOS-JFK': 60,
    'SFO-IAD': 300, // San Francisco to Washington DC (Dulles) ~5 hours
    'IAD-SFO': 300,
  };
  
  const key = `${from}-${to}`;
  const reverseKey = `${to}-${from}`;
  
  if (distances[key]) return distances[key];
  if (distances[reverseKey]) return distances[reverseKey];
  
  // Default: estimate based on typical US domestic flight
  return 120 + Math.floor(Math.random() * 180);
};

// Generate flight number (airline code + 3-4 digit number)
const generateFlightNumber = (airlineCode) => {
  const flightNum = Math.floor(100 + Math.random() * 9900); // 100-9999
  return `${airlineCode}${flightNum}`;
};

// Generate random flight class with weighted distribution
// 60% economy, 20% premium_economy, 15% business, 5% first
const getRandomFlightClass = () => {
  const rand = Math.random();
  if (rand < 0.6) return 'economy';
  if (rand < 0.8) return 'premium_economy';
  if (rand < 0.95) return 'business';
  return 'first';
};

// Calculate price multiplier based on class
const getClassPriceMultiplier = (flightClass) => {
  switch (flightClass) {
    case 'economy': return 1.0;
    case 'premium_economy': return 1.5;
    case 'business': return 2.5;
    case 'first': return 4.0;
    default: return 1.0;
  }
};

// Generate total seats based on aircraft type (estimated)
const getTotalSeats = () => {
  // Random aircraft size: small (100-150), medium (150-200), large (200-300)
  const size = Math.random();
  if (size < 0.3) return 100 + Math.floor(Math.random() * 50); // 100-150
  if (size < 0.7) return 150 + Math.floor(Math.random() * 50); // 150-200
  return 200 + Math.floor(Math.random() * 100); // 200-300
};

// Generate flights
const generateFlights = () => {
  const flights = [];
  const flightIdCounter = { count: 1001 };
  const availableDates = generateFlightDates();
  
  // Generate flights between major city pairs
  const majorRoutes = [
    ['LAX', 'JFK'], ['JFK', 'LAX'],
    ['LAX', 'SFO'], ['SFO', 'LAX'],
    ['JFK', 'SFO'], ['SFO', 'JFK'],
    ['LAX', 'ORD'], ['ORD', 'LAX'],
    ['JFK', 'ORD'], ['ORD', 'JFK'],
    ['SFO', 'ORD'], ['ORD', 'SFO'],
    ['ATL', 'JFK'], ['JFK', 'ATL'],
    ['LAX', 'DEN'], ['DEN', 'LAX'],
    ['DEN', 'ORD'], ['ORD', 'DEN'],
    ['MIA', 'JFK'], ['JFK', 'MIA'],
    ['SEA', 'LAX'], ['LAX', 'SEA'],
    ['BOS', 'JFK'], ['JFK', 'BOS'],
    ['LAX', 'LAS'], ['LAS', 'LAX'],
    ['SFO', 'SEA'], ['SEA', 'SFO'],
    ['ORD', 'ATL'], ['ATL', 'ORD'],
    ['DFW', 'LAX'], ['LAX', 'DFW'],
    ['DFW', 'JFK'], ['JFK', 'DFW'],
    ['PHX', 'LAX'], ['LAX', 'PHX'],
    ['MCO', 'JFK'], ['JFK', 'MCO'],
    ['BWI', 'JFK'], ['JFK', 'BWI'],
    ['DCA', 'JFK'], ['JFK', 'DCA'],
    ['SAN', 'LAX'], ['LAX', 'SAN'],
    ['PDX', 'SFO'], ['SFO', 'PDX'],
    ['MSP', 'ORD'], ['ORD', 'MSP'],
    ['AUS', 'DFW'], ['DFW', 'AUS'],
    ['SFO', 'IAD'], ['IAD', 'SFO'], // San Francisco to Washington DC (Dulles)
  ];
  
  // Generate flights for each route - ensure ALL dates have at least a few flights
  majorRoutes.forEach(([from, to]) => {
    const isPopularRoute = ['LAX', 'JFK', 'SFO', 'ORD'].includes(from) && 
                          ['LAX', 'JFK', 'SFO', 'ORD'].includes(to);
    
    // Generate flights for ALL dates (every day)
    availableDates.forEach(departDate => {
      // Generate 2-5 flights per date (different airlines/times)
      // Popular routes get more flights per day
      const flightsPerDate = isPopularRoute ? (3 + Math.floor(Math.random() * 3)) : (2 + Math.floor(Math.random() * 2));
      
      for (let j = 0; j < flightsPerDate; j++) {
        const airlineObj = AIRLINES[Math.floor(Math.random() * AIRLINES.length)];
        const airline = airlineObj.name;
        const airlineCode = airlineObj.code;
        const duration = calculateDuration(from, to);
        const nonstop = Math.random() > 0.3; // 70% nonstop
        
        // Generate flight class and adjust price
        const flightClass = getRandomFlightClass();
        const classMultiplier = getClassPriceMultiplier(flightClass);
        
        // Base price varies by route distance and airline
        const basePrice = duration * 0.8 + (nonstop ? 50 : 0);
        const price = (basePrice * classMultiplier) + Math.floor(Math.random() * 200) - 100;
        
        // Generate seats
        const totalSeats = getTotalSeats();
        // Available seats: 20-95% of total (some flights more full than others)
        const availableSeats = Math.floor(totalSeats * (0.2 + Math.random() * 0.75));
        
        // Generate flight number
        const flightNumber = generateFlightNumber(airlineCode);
        
        // One-way flight
        flights.push({
          _id: `FL-${flightIdCounter.count++}`,
          id: `FL-${flightIdCounter.count - 1}`,
          from,
          to,
          departDate,
          returnDate: null,
          airline,
          flightNumber,
          durationMinutes: duration,
          price: Math.max(99, Math.round(price * 100) / 100),
          currency: 'USD',
          class: flightClass,
          nonstop,
          totalSeats,
          availableSeats,
          departureTime: getRandomTime(),
          arrivalTime: getRandomTime(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        // For popular routes, also generate round trip flights (20% chance)
        if (isPopularRoute && Math.random() > 0.8) {
          const returnDateObj = new Date(departDate);
          returnDateObj.setDate(returnDateObj.getDate() + (3 + Math.floor(Math.random() * 7))); // 3-10 days later
          const returnDate = formatDate(returnDateObj);
          
          // Only add if return date is within our date range
          if (availableDates.includes(returnDate)) {
            // For round trip, use same class and generate new flight number
            const returnFlightNumber = generateFlightNumber(airlineCode);
            const returnTotalSeats = getTotalSeats();
            const returnAvailableSeats = Math.floor(returnTotalSeats * (0.2 + Math.random() * 0.75));
            
            flights.push({
              _id: `FL-${flightIdCounter.count++}`,
              id: `FL-${flightIdCounter.count - 1}`,
              from,
              to,
              departDate,
              returnDate,
              airline,
              flightNumber: returnFlightNumber,
              durationMinutes: duration,
              price: Math.max(199, Math.round(price * 1.8 * 100) / 100), // Round trip costs more
              currency: 'USD',
              class: flightClass,
              nonstop,
              totalSeats: returnTotalSeats,
              availableSeats: returnAvailableSeats,
              departureTime: getRandomTime(),
              arrivalTime: getRandomTime(),
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }
      }
    });
  });
  
  return flights;
};

// Generate hotels
const generateHotels = () => {
  const hotels = [];
  const hotelIdCounter = { count: 2001 };
  
  // Generate hotels for major cities
  const citiesWithHotels = US_AIRPORTS.filter(airport => 
    ['LAX', 'JFK', 'SFO', 'ORD', 'DFW', 'DEN', 'ATL', 'LAS', 'SEA', 'MIA', 
     'BOS', 'PHX', 'IAH', 'MCO', 'CLT', 'EWR', 'DTW', 'PHL', 'LGA', 'BWI',
     'SLC', 'DCA', 'HNL', 'SAN', 'STL', 'TPA', 'PDX', 'MSP', 'BNA', 'AUS'].includes(airport.code)
  );
  
  citiesWithHotels.forEach(airport => {
    // Generate 3-5 hotels per city to ensure availability
    const numHotels = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numHotels; i++) {
      const chain = HOTEL_CHAINS[Math.floor(Math.random() * HOTEL_CHAINS.length)];
      const suffix = HOTEL_SUFFIXES[Math.floor(Math.random() * HOTEL_SUFFIXES.length)];
      const name = `${chain} ${airport.city} ${suffix}`;
      
      // Rating between 3.5 and 5.0
      const rating = 3.5 + Math.random() * 1.5;
      
      // Price varies by city (major cities more expensive)
      const cityMultiplier = ['LAX', 'JFK', 'SFO', 'LGA', 'EWR'].includes(airport.code) ? 1.5 : 1.0;
      const basePrice = 80 + Math.random() * 200;
      const pricePerNight = Math.round(basePrice * cityMultiplier * 100) / 100;
      
      // Random amenities (3-7 amenities)
      const numAmenities = 3 + Math.floor(Math.random() * 5);
      const selectedAmenities = [];
      const availableAmenities = [...AMENITIES];
      for (let j = 0; j < numAmenities; j++) {
        const index = Math.floor(Math.random() * availableAmenities.length);
        selectedAmenities.push(availableAmenities.splice(index, 1)[0]);
      }
      
      // Slight variation in coordinates for different hotels in same city
      const lat = airport.lat + (Math.random() - 0.5) * 0.1;
      const lng = airport.lng + (Math.random() - 0.5) * 0.1;
      
      hotels.push({
        _id: `HT-${hotelIdCounter.count++}`,
        id: `HT-${hotelIdCounter.count - 1}`,
        city: airport.city,
        state: airport.state,
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

// Generate cars
const generateCars = () => {
  const cars = [];
  const carIdCounter = { count: 3001 };
  
  // Generate cars for major cities
  const citiesWithCars = US_AIRPORTS.filter(airport => 
    ['LAX', 'JFK', 'SFO', 'ORD', 'DFW', 'DEN', 'ATL', 'LAS', 'SEA', 'MIA', 
     'BOS', 'PHX', 'IAH', 'MCO', 'CLT', 'EWR', 'DTW', 'PHL', 'LGA', 'BWI',
     'SLC', 'DCA', 'HNL', 'SAN', 'STL', 'TPA', 'PDX', 'MSP', 'BNA', 'AUS'].includes(airport.code)
  );
  
  citiesWithCars.forEach(airport => {
    // Generate 3-5 car options per city to ensure availability
    const numCars = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numCars; i++) {
      const vendor = CAR_VENDORS[Math.floor(Math.random() * CAR_VENDORS.length)];
      const carType = CAR_TYPES[Math.floor(Math.random() * CAR_TYPES.length)];
      
      // Price varies by city and car type
      const cityMultiplier = ['LAX', 'JFK', 'SFO', 'LGA', 'EWR'].includes(airport.code) ? 1.3 : 1.0;
      const pricePerDay = Math.round((carType.basePrice * cityMultiplier + Math.random() * 20) * 100) / 100;
      
      cars.push({
        _id: `CR-${carIdCounter.count++}`,
        id: `CR-${carIdCounter.count - 1}`,
        city: airport.city, // Changed from 'location' to 'city' to match search query
        state: airport.state,
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
  
  return cars;
};

// Main seed function
const seedDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    console.error('MONGODB_URI environment variable is not set');
    process.exit(1);
  }
  
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Clear existing collections
    console.log('Clearing existing collections...');
    await db.collection('flights').deleteMany({});
    await db.collection('hotels').deleteMany({});
    await db.collection('cars').deleteMany({});
    
    // Generate data
    console.log('Generating flights...');
    const flights = generateFlights();
    console.log(`Generated ${flights.length} flights`);
    
    console.log('Generating hotels...');
    const hotels = generateHotels();
    console.log(`Generated ${hotels.length} hotels`);
    
    console.log('Generating cars...');
    const cars = generateCars();
    console.log(`Generated ${cars.length} cars`);
    
    // Insert data
    console.log('Inserting flights...');
    if (flights.length > 0) {
      await db.collection('flights').insertMany(flights);
      console.log(`Inserted ${flights.length} flights`);
    }
    
    console.log('Inserting hotels...');
    if (hotels.length > 0) {
      await db.collection('hotels').insertMany(hotels);
      console.log(`Inserted ${hotels.length} hotels`);
    }
    
    console.log('Inserting cars...');
    if (cars.length > 0) {
      await db.collection('cars').insertMany(cars);
      console.log(`Inserted ${cars.length} cars`);
    }
    
    // Create indexes for better query performance
    console.log('Creating indexes...');
    await db.collection('flights').createIndex({ from: 1, to: 1, departDate: 1 });
    await db.collection('flights').createIndex({ airline: 1 });
    await db.collection('hotels').createIndex({ city: 1 });
    await db.collection('hotels').createIndex({ state: 1 });
    await db.collection('hotels').createIndex({ pricePerNight: 1 });
    await db.collection('cars').createIndex({ city: 1 }); // Changed from 'location' to 'city'
    await db.collection('cars').createIndex({ state: 1 });
    await db.collection('cars').createIndex({ pricePerDay: 1 });
    
    console.log('Database seeded successfully!');
    console.log(`\nSummary:`);
    console.log(`- Flights: ${flights.length}`);
    console.log(`- Hotels: ${hotels.length}`);
    console.log(`- Cars: ${cars.length}`);
    
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
};

// Run the seed script
seedDatabase();

