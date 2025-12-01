/**
 * Sample queries to demonstrate the loaded Kaggle data
 * Run: node scripts/sample-queries.js
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const runQueries = async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db();
    
    // Query 1: Find cheap flights from JFK to LAX
    console.log('📍 Query 1: Cheap flights JFK → LAX');
    console.log('=' .repeat(60));
    const cheapFlights = await db.collection('flights')
      .find({
        from: 'JFK',
        to: 'LAX',
        departDate: { $gte: new Date().toISOString().split('T')[0] }
      })
      .sort({ price: 1 })
      .limit(5)
      .toArray();
    
    cheapFlights.forEach((f, i) => {
      console.log(`${i + 1}. ${f.airline} - $${f.price} (${f.departDate})`);
      console.log(`   ${f.from} → ${f.to} | ${f.durationMinutes} min | ${f.nonstop ? 'Nonstop' : f.stops + ' stop(s)'}`);
      if (f.isDeal) {
        console.log(`   🎉 DEAL! Save ${f.savingsPercent}% (Avg: $${f.avgPrice})`);
      }
    });
    
    // Query 2: Find deals
    console.log('\n📍 Query 2: Today\'s Top Flight Deals');
    console.log('=' .repeat(60));
    const deals = await db.collection('flights')
      .find({ isDeal: true })
      .sort({ savingsPercent: -1 })
      .limit(5)
      .toArray();
    
    deals.forEach((f, i) => {
      console.log(`${i + 1}. ${f.from} → ${f.to} - $${f.price} (Save ${f.savingsPercent}%)`);
      console.log(`   ${f.airline} on ${f.departDate}`);
    });
    
    // Query 3: Hotel deals in a city
    console.log('\n📍 Query 3: Hotel Deals in Los Angeles');
    console.log('=' .repeat(60));
    const hotelDeals = await db.collection('hotels')
      .find({
        city: 'Los Angeles',
        rating: { $gte: 4.0 }
      })
      .sort({ pricePerNight: 1 })
      .limit(5)
      .toArray();
    
    hotelDeals.forEach((h, i) => {
      console.log(`${i + 1}. ${h.name} - $${h.pricePerNight}/night`);
      console.log(`   Rating: ${h.rating}/5 | Amenities: ${h.amenities.slice(0, 3).join(', ')}`);
      if (h.isDeal) {
        console.log(`   🎉 DEAL!`);
      }
      if (h.limitedAvailability) {
        console.log(`   ⚠️  Limited availability (${h.availableRooms} rooms)`);
      }
    });
    
    // Query 4: Cars available in a city
    console.log('\n📍 Query 4: Cars in San Francisco');
    console.log('=' .repeat(60));
    const cars = await db.collection('cars')
      .find({ city: 'San Francisco' })
      .sort({ pricePerDay: 1 })
      .limit(5)
      .toArray();
    
    cars.forEach((c, i) => {
      console.log(`${i + 1}. ${c.vendor} ${c.type} - $${c.pricePerDay}/day`);
      console.log(`   ${c.seats} seats`);
    });
    
    // Query 5: Statistics
    console.log('\n📍 Query 5: Database Statistics');
    console.log('=' .repeat(60));
    
    const flightStats = await db.collection('flights').aggregate([
      {
        $group: {
          _id: null,
          totalFlights: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          dealCount: { $sum: { $cond: ['$isDeal', 1, 0] } }
        }
      }
    ]).toArray();
    
    const hotelStats = await db.collection('hotels').aggregate([
      {
        $group: {
          _id: null,
          totalHotels: { $sum: 1 },
          avgPrice: { $avg: '$pricePerNight' },
          avgRating: { $avg: '$rating' },
          dealCount: { $sum: { $cond: ['$isDeal', 1, 0] } }
        }
      }
    ]).toArray();
    
    const carCount = await db.collection('cars').countDocuments();
    
    console.log('Flights:');
    console.log(`  Total: ${flightStats[0].totalFlights.toLocaleString()}`);
    console.log(`  Avg Price: $${Math.round(flightStats[0].avgPrice)}`);
    console.log(`  Price Range: $${Math.round(flightStats[0].minPrice)} - $${Math.round(flightStats[0].maxPrice)}`);
    console.log(`  Deals: ${flightStats[0].dealCount.toLocaleString()} (${Math.round(flightStats[0].dealCount / flightStats[0].totalFlights * 100)}%)`);
    
    console.log('\nHotels:');
    console.log(`  Total: ${hotelStats[0].totalHotels.toLocaleString()}`);
    console.log(`  Avg Price: $${Math.round(hotelStats[0].avgPrice)}/night`);
    console.log(`  Avg Rating: ${hotelStats[0].avgRating.toFixed(1)}/5`);
    console.log(`  Deals: ${hotelStats[0].dealCount}`);
    
    console.log('\nCars:');
    console.log(`  Total: ${carCount.toLocaleString()}`);
    
    // Query 6: Route popularity
    console.log('\n📍 Query 6: Top 10 Routes by Flight Count');
    console.log('=' .repeat(60));
    const topRoutes = await db.collection('flights').aggregate([
      {
        $group: {
          _id: { from: '$from', to: '$to' },
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();
    
    topRoutes.forEach((r, i) => {
      console.log(`${i + 1}. ${r._id.from} → ${r._id.to}: ${r.count} flights (Avg: $${Math.round(r.avgPrice)})`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Sample queries completed successfully!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error running queries:', error);
  } finally {
    await client.close();
  }
};

runQueries();

