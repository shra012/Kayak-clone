import { getMongoDB } from '../src/config/database.js';
import { logger } from '../src/config/logger.js';

async function checkFlights() {
  try {
    logger.info('Checking flights in database...');
    
    const db = await getMongoDB();
    const collection = db.collection('flights');
    
    // Check total count
    const totalCount = await collection.countDocuments({});
    logger.info(`Total flights in database: ${totalCount}`);
    
    // Check for SFO to LAX flights
    const sfoToLax = await collection.find({ from: 'SFO', to: 'LAX' }).limit(5).toArray();
    logger.info(`\nSFO to LAX flights (sample of 5):`);
    if (sfoToLax.length > 0) {
      sfoToLax.forEach(flight => {
        logger.info(`  - ID: ${flight.id}, Date: ${flight.departDate}, Airline: ${flight.airline}, Price: $${flight.price}`);
      });
    } else {
      logger.warn('  No SFO to LAX flights found');
    }
    
    // Check for specific date
    const dateCheck = await collection.find({ from: 'SFO', to: 'LAX', departDate: '2025-12-08' }).toArray();
    logger.info(`\nSFO to LAX flights on 2025-12-08: ${dateCheck.length}`);
    if (dateCheck.length > 0) {
      dateCheck.forEach(flight => {
        logger.info(`  - ID: ${flight.id}, Airline: ${flight.airline}, Price: $${flight.price}, Nonstop: ${flight.nonstop}`);
      });
    }
    
    // Check date range
    const dateRange = await collection.find({ 
      from: 'SFO', 
      to: 'LAX',
      departDate: { $gte: '2025-12-01', $lte: '2025-12-15' }
    }).toArray();
    logger.info(`\nSFO to LAX flights between 2025-12-01 and 2025-12-15: ${dateRange.length}`);
    
    // Check sample flights to see structure
    const sample = await collection.findOne({});
    if (sample) {
      logger.info(`\nSample flight structure:`);
      logger.info(JSON.stringify(sample, null, 2));
    } else {
      logger.warn('No flights found in database - database may need to be seeded');
    }
    
    // Check distinct dates
    const distinctDates = await collection.distinct('departDate', { from: 'SFO', to: 'LAX' });
    logger.info(`\nDistinct dates for SFO to LAX: ${distinctDates.length} dates`);
    if (distinctDates.length > 0) {
      logger.info(`  First 10 dates: ${distinctDates.slice(0, 10).join(', ')}`);
    }
    
    process.exit(0);
  } catch (error) {
    logger.error('Error checking flights:', error);
    process.exit(1);
  }
}

checkFlights();

