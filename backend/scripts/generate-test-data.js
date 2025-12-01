import { getPostgresPool } from '../src/config/database.js';
import { getMongoDB } from '../src/config/database.js';
import { v4 as uuidv4 } from 'uuid';

const NUM_USERS = 10000;
const NUM_FLIGHTS = 10000;
const NUM_HOTELS = 10000;
const NUM_CARS = 10000;
const NUM_BOOKINGS = 5000;
const NUM_PAYMENTS = 5000;

const airports = ['JFK', 'LAX', 'SFO', 'ORD', 'DFW', 'DEN', 'SEA', 'MIA', 'ATL', 'BOS'];
const cities = ['New York', 'Los Angeles', 'San Francisco', 'Chicago', 'Dallas', 'Denver', 'Seattle', 'Miami', 'Atlanta', 'Boston'];
const states = ['NY', 'CA', 'IL', 'TX', 'CO', 'WA', 'FL', 'GA', 'MA'];
const airlines = ['American Airlines', 'Delta', 'United', 'Southwest', 'JetBlue', 'Alaska', 'Spirit', 'Frontier'];
const hotelChains = ['Marriott', 'Hilton', 'Hyatt', 'InterContinental', 'Holiday Inn', 'Best Western', 'Radisson', 'Wyndham'];
const carProviders = ['Hertz', 'Enterprise', 'Avis', 'Budget', 'National', 'Alamo', 'Thrifty', 'Dollar'];

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateSSN() {
  return `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 9000) + 1000}`;
}

async function generateUsers(pool) {
  console.log('Generating users...');
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (let i = 0; i < NUM_USERS; i++) {
      const userId = uuidv4();
      const firstName = `User${i}`;
      const lastName = `Test${i}`;
      const email = `user${i}@test.com`;
      const phone = `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`;
      const city = randomElement(cities);
      const state = randomElement(states);
      
      await client.query(
        `INSERT INTO users (
          id, first_name, last_name, email, phone_number,
          address_line1, address_city, address_state, address_zip_code,
          profile_type, role, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
        [
          userId,
          firstName,
          lastName,
          email,
          phone,
          `${Math.floor(Math.random() * 9999) + 1} Main St`,
          city,
          state,
          `${Math.floor(Math.random() * 90000) + 10000}`,
          'traveler',
          'user'
        ]
      );
      
      if ((i + 1) % 1000 === 0) {
        console.log(`  Generated ${i + 1} users...`);
      }
    }
    
    await client.query('COMMIT');
    console.log(`✓ Generated ${NUM_USERS} users`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function generateFlights(db) {
  console.log('Generating flights...');
  const flights = db.collection('flights');
  
  const flightArray = [];
  for (let i = 0; i < NUM_FLIGHTS; i++) {
    const departure = randomElement(airports);
    let arrival = randomElement(airports);
    while (arrival === departure) {
      arrival = randomElement(airports);
    }
    
    const departDate = randomDate(new Date('2024-12-01'), new Date('2025-06-30'));
    const arrivalDate = new Date(departDate.getTime() + (Math.random() * 12 + 2) * 60 * 60 * 1000);
    
    const flight = {
      id: `${randomElement(['AA', 'DL', 'UA', 'SW', 'B6', 'AS'])}${Math.floor(Math.random() * 9000) + 1000}`,
      airline: randomElement(airlines),
      departureAirport: departure,
      arrivalAirport: arrival,
      departureTime: departDate,
      arrivalTime: arrivalDate,
      durationMinutes: Math.floor((arrivalDate - departDate) / (1000 * 60)),
      totalSeats: Math.floor(Math.random() * 200) + 100,
      availableSeats: Math.floor(Math.random() * 150) + 10,
      basePrice: {
        amount: Math.floor(Math.random() * 800) + 100,
        currency: 'USD'
      },
      fareClass: randomElement(['economy', 'business', 'first']),
      rating: (Math.random() * 2 + 3).toFixed(1)
    };
    
    flightArray.push(flight);
    
    if ((i + 1) % 1000 === 0) {
      console.log(`  Generated ${i + 1} flights...`);
    }
  }
  
  await flights.insertMany(flightArray);
  console.log(`✓ Generated ${NUM_FLIGHTS} flights`);
}

async function generateHotels(db) {
  console.log('Generating hotels...');
  const hotels = db.collection('hotels');
  
  const hotelArray = [];
  for (let i = 0; i < NUM_HOTELS; i++) {
    const city = randomElement(cities);
    const state = randomElement(states);
    
    const hotel = {
      id: `hotel_${i + 1}`,
      name: `${randomElement(hotelChains)} ${city}`,
      address: {
        street: `${Math.floor(Math.random() * 9999) + 1} Hotel Blvd`,
        city: city,
        state: state,
        zipCode: `${Math.floor(Math.random() * 90000) + 10000}`,
        coordinates: {
          lat: (Math.random() * 50) + 25,
          lng: (Math.random() * 100) - 50
        }
      },
      rooms: [
        {
          type: 'standard',
          capacity: 2,
          pricePerNight: Math.floor(Math.random() * 200) + 50,
          amenities: ['WiFi', 'TV', 'AC']
        },
        {
          type: 'deluxe',
          capacity: 4,
          pricePerNight: Math.floor(Math.random() * 300) + 150,
          amenities: ['WiFi', 'TV', 'AC', 'Mini Bar']
        }
      ],
      amenities: ['Pool', 'Gym', 'Spa', 'Restaurant'],
      rating: (Math.random() * 2 + 3).toFixed(1),
      availableRooms: Math.floor(Math.random() * 50) + 10
    };
    
    hotelArray.push(hotel);
    
    if ((i + 1) % 1000 === 0) {
      console.log(`  Generated ${i + 1} hotels...`);
    }
  }
  
  await hotels.insertMany(hotelArray);
  console.log(`✓ Generated ${NUM_HOTELS} hotels`);
}

async function generateCars(db) {
  console.log('Generating cars...');
  const cars = db.collection('cars');
  
  const carArray = [];
  for (let i = 0; i < NUM_CARS; i++) {
    const city = randomElement(cities);
    
    const car = {
      id: `car_${i + 1}`,
      provider: randomElement(carProviders),
      model: randomElement(['Toyota Camry', 'Honda Accord', 'Ford Mustang', 'Chevrolet Malibu', 'Nissan Altima']),
      year: Math.floor(Math.random() * 5) + 2020,
      type: randomElement(['sedan', 'suv', 'compact', 'luxury']),
      transmission: randomElement(['automatic', 'manual']),
      seats: Math.floor(Math.random() * 5) + 4,
      pricePerDay: Math.floor(Math.random() * 100) + 30,
      availabilityStatus: randomElement(['available', 'available', 'available', 'unavailable']),
      location: {
        pickup: `${city} Airport`,
        return: `${city} Airport`
      }
    };
    
    carArray.push(car);
    
    if ((i + 1) % 1000 === 0) {
      console.log(`  Generated ${i + 1} cars...`);
    }
  }
  
  await cars.insertMany(carArray);
  console.log(`✓ Generated ${NUM_CARS} cars`);
}

async function generateBookings(pool, db) {
  console.log('Generating bookings...');
  const client = await pool.connect();
  
  try {
    // Get user IDs
    const userResult = await client.query('SELECT id FROM users LIMIT $1', [NUM_BOOKINGS]);
    const userIds = userResult.rows.map(row => row.id);
    
    await client.query('BEGIN');
    
    for (let i = 0; i < NUM_BOOKINGS; i++) {
      const bookingId = uuidv4();
      const userId = userIds[i % userIds.length];
      const bookingType = randomElement(['flight', 'hotel', 'car']);
      const status = randomElement(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']);
      const priceAmount = Math.floor(Math.random() * 1000) + 100;
      
      await client.query(
        `INSERT INTO bookings (
          id, user_id, booking_type, status, price_amount, price_currency,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [bookingId, userId, bookingType, status, priceAmount, 'USD']
      );
      
      if ((i + 1) % 1000 === 0) {
        console.log(`  Generated ${i + 1} bookings...`);
      }
    }
    
    await client.query('COMMIT');
    console.log(`✓ Generated ${NUM_BOOKINGS} bookings`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function generatePayments(pool) {
  console.log('Generating payments...');
  const client = await pool.connect();
  
  try {
    // Get booking IDs
    const bookingResult = await client.query('SELECT id, user_id FROM bookings LIMIT $1', [NUM_PAYMENTS]);
    const bookings = bookingResult.rows;
    
    await client.query('BEGIN');
    
    for (let i = 0; i < NUM_PAYMENTS && i < bookings.length; i++) {
      const paymentId = uuidv4();
      const booking = bookings[i];
      const status = randomElement(['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED']);
      const amount = Math.floor(Math.random() * 1000) + 100;
      
      await client.query(
        `INSERT INTO payments (
          id, booking_id, user_id, status, amount, currency,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [paymentId, booking.id, booking.user_id, status, amount, 'USD']
      );
      
      if ((i + 1) % 1000 === 0) {
        console.log(`  Generated ${i + 1} payments...`);
      }
    }
    
    await client.query('COMMIT');
    console.log(`✓ Generated ${NUM_PAYMENTS} payments`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  console.log('Starting test data generation...\n');
  
  try {
    const pool = getPostgresPool();
    const db = await getMongoDB();
    
    await generateUsers(pool);
    await generateFlights(db);
    await generateHotels(db);
    await generateCars(db);
    await generateBookings(pool, db);
    await generatePayments(pool);
    
    console.log('\n✓ Test data generation completed!');
    console.log(`\nSummary:`);
    console.log(`  Users: ${NUM_USERS}`);
    console.log(`  Flights: ${NUM_FLIGHTS}`);
    console.log(`  Hotels: ${NUM_HOTELS}`);
    console.log(`  Cars: ${NUM_CARS}`);
    console.log(`  Bookings: ${NUM_BOOKINGS}`);
    console.log(`  Payments: ${NUM_PAYMENTS}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error generating test data:', error);
    process.exit(1);
  }
}

main();

