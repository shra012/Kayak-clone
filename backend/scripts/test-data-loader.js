/**
 * Quick test script to verify data loader works without CSV files
 * This will use synthetic data generation
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
  console.log('🧪 Testing Data Loader Prerequisites\n');
  
  // Test 1: Environment variables
  console.log('✓ Checking environment variables...');
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not set in .env file');
    process.exit(1);
  }
  console.log('  ✓ MONGODB_URI is set');
  
  // Test 2: MongoDB connection
  console.log('\n✓ Testing MongoDB connection...');
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('  ✓ Connected to MongoDB successfully');
    
    const db = client.db();
    
    // Test 3: Check collections
    console.log('\n✓ Checking existing collections...');
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log(`  Found ${collections.length} collections:`, collectionNames.join(', '));
    
    // Test 4: Count existing data
    console.log('\n✓ Counting existing documents...');
    const flightCount = await db.collection('flights').countDocuments();
    const hotelCount = await db.collection('hotels').countDocuments();
    const carCount = await db.collection('cars').countDocuments();
    
    console.log(`  Flights: ${flightCount}`);
    console.log(`  Hotels: ${hotelCount}`);
    console.log(`  Cars: ${carCount}`);
    
    console.log('\n✅ All prerequisites passed!');
    console.log('\n📝 Next steps:');
    console.log('  1. (Optional) Download Kaggle datasets to backend/scripts/data/');
    console.log('  2. Run: npm run load:kaggle-data');
    console.log('  3. Script will use CSV files if available, or generate synthetic data');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
};

testConnection();

