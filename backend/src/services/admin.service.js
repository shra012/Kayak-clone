import { v4 as uuidv4 } from 'uuid';
import { getMongoDB, getPostgresPool } from '../config/database.js';
import { logger } from '../config/logger.js';
import { sendKafkaMessage } from '../config/kafka.js';
import { invalidateListingCache } from '../utils/cache.js';

/**
 * Create flight listing
 */
export const createFlight = async (flightData) => {
  const db = await getMongoDB();
  const flightsCollection = db.collection('flights');

  try {
    const flight = {
      _id: flightData.id || uuidv4(),
      ...flightData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await flightsCollection.insertOne(flight);

    logger.info(`Flight created: ${flight._id}`);

    await sendKafkaMessage('inventory.updated', {
      eventId: uuidv4(),
      occurredAt: new Date().toISOString(),
      listingType: 'flight',
      listingId: flight._id,
      action: 'created',
      data: flight,
    });

    await invalidateListingCache('flight', flight._id);

    return flight;
  } catch (error) {
    logger.error('Error creating flight:', error);
    throw error;
  }
};

/**
 * Update flight listing
 */
export const updateFlight = async (flightId, updateData) => {
  const db = await getMongoDB();
  const flightsCollection = db.collection('flights');

  try {
    const update = {
      ...updateData,
      updatedAt: new Date(),
    };

    const result = await flightsCollection.updateOne(
      { _id: flightId },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      throw new Error('Flight not found');
    }

    logger.info(`Flight updated: ${flightId}`);

    await sendKafkaMessage('inventory.updated', {
      eventId: uuidv4(),
      occurredAt: new Date().toISOString(),
      listingType: 'flight',
      listingId: flightId,
      action: 'updated',
      data: update,
    });

    await invalidateListingCache('flight', flightId);

    return result;
  } catch (error) {
    logger.error('Error updating flight:', error);
    throw error;
  }
};

/**
 * Delete flight listing
 */
export const deleteFlight = async (flightId) => {
  const db = await getMongoDB();
  const flightsCollection = db.collection('flights');

  try {
    const result = await flightsCollection.deleteOne({ _id: flightId });

    if (result.deletedCount === 0) {
      throw new Error('Flight not found');
    }

    logger.info(`Flight deleted: ${flightId}`);

    await sendKafkaMessage('inventory.updated', {
      eventId: uuidv4(),
      occurredAt: new Date().toISOString(),
      listingType: 'flight',
      listingId: flightId,
      action: 'deleted',
    });

    await invalidateListingCache('flight', flightId);

    return result;
  } catch (error) {
    logger.error('Error deleting flight:', error);
    throw error;
  }
};

/**
 * Create hotel listing
 */
export const createHotel = async (hotelData) => {
  const db = await getMongoDB();
  const hotelsCollection = db.collection('hotels');

  try {
    const hotel = {
      _id: hotelData.id || uuidv4(),
      ...hotelData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await hotelsCollection.insertOne(hotel);

    logger.info(`Hotel created: ${hotel._id}`);

    await sendKafkaMessage('inventory.updated', {
      eventId: uuidv4(),
      occurredAt: new Date().toISOString(),
      listingType: 'hotel',
      listingId: hotel._id,
      action: 'created',
      data: hotel,
    });

    await invalidateListingCache('hotel', hotel._id);

    return hotel;
  } catch (error) {
    logger.error('Error creating hotel:', error);
    throw error;
  }
};

/**
 * Update hotel listing
 */
export const updateHotel = async (hotelId, updateData) => {
  const db = await getMongoDB();
  const hotelsCollection = db.collection('hotels');

  try {
    const update = {
      ...updateData,
      updatedAt: new Date(),
    };

    const result = await hotelsCollection.updateOne(
      { _id: hotelId },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      throw new Error('Hotel not found');
    }

    logger.info(`Hotel updated: ${hotelId}`);

    await sendKafkaMessage('inventory.updated', {
      eventId: uuidv4(),
      occurredAt: new Date().toISOString(),
      listingType: 'hotel',
      listingId: hotelId,
      action: 'updated',
      data: update,
    });

    await invalidateListingCache('hotel', hotelId);

    return result;
  } catch (error) {
    logger.error('Error updating hotel:', error);
    throw error;
  }
};

/**
 * Delete hotel listing
 */
export const deleteHotel = async (hotelId) => {
  const db = await getMongoDB();
  const hotelsCollection = db.collection('hotels');

  try {
    const result = await hotelsCollection.deleteOne({ _id: hotelId });

    if (result.deletedCount === 0) {
      throw new Error('Hotel not found');
    }

    logger.info(`Hotel deleted: ${hotelId}`);

    await sendKafkaMessage('inventory.updated', {
      eventId: uuidv4(),
      occurredAt: new Date().toISOString(),
      listingType: 'hotel',
      listingId: hotelId,
      action: 'deleted',
    });

    await invalidateListingCache('hotel', hotelId);

    return result;
  } catch (error) {
    logger.error('Error deleting hotel:', error);
    throw error;
  }
};

/**
 * Create car listing
 */
export const createCar = async (carData) => {
  const db = await getMongoDB();
  const carsCollection = db.collection('cars');

  try {
    const car = {
      _id: carData.id || uuidv4(),
      ...carData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await carsCollection.insertOne(car);

    logger.info(`Car created: ${car._id}`);

    await sendKafkaMessage('inventory.updated', {
      eventId: uuidv4(),
      occurredAt: new Date().toISOString(),
      listingType: 'car',
      listingId: car._id,
      action: 'created',
      data: car,
    });

    await invalidateListingCache('car', car._id);

    return car;
  } catch (error) {
    logger.error('Error creating car:', error);
    throw error;
  }
};

/**
 * Update car listing
 */
export const updateCar = async (carId, updateData) => {
  const db = await getMongoDB();
  const carsCollection = db.collection('cars');

  try {
    const update = {
      ...updateData,
      updatedAt: new Date(),
    };

    const result = await carsCollection.updateOne(
      { _id: carId },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      throw new Error('Car not found');
    }

    logger.info(`Car updated: ${carId}`);

    await sendKafkaMessage('inventory.updated', {
      eventId: uuidv4(),
      occurredAt: new Date().toISOString(),
      listingType: 'car',
      listingId: carId,
      action: 'updated',
      data: update,
    });

    await invalidateListingCache('car', carId);

    return result;
  } catch (error) {
    logger.error('Error updating car:', error);
    throw error;
  }
};

/**
 * Delete car listing
 */
export const deleteCar = async (carId) => {
  const db = await getMongoDB();
  const carsCollection = db.collection('cars');

  try {
    const result = await carsCollection.deleteOne({ _id: carId });

    if (result.deletedCount === 0) {
      throw new Error('Car not found');
    }

    logger.info(`Car deleted: ${carId}`);

    await sendKafkaMessage('inventory.updated', {
      eventId: uuidv4(),
      occurredAt: new Date().toISOString(),
      listingType: 'car',
      listingId: carId,
      action: 'deleted',
    });

    await invalidateListingCache('car', carId);

    return result;
  } catch (error) {
    logger.error('Error deleting car:', error);
    throw error;
  }
};

/**
 * Get revenue report
 */
export const getRevenueReport = async (filters = {}) => {
  const pool = getPostgresPool();

  try {
    const {
      startDate,
      endDate,
      city,
      state,
      provider,
      groupBy = 'month',
    } = filters;

    let query = `
      SELECT 
        DATE_TRUNC($1, b.created_at) as period,
        b.booking_type,
        SUM(b.price_amount) as revenue,
        COUNT(*) as booking_count
      FROM bookings b
      WHERE b.status = 'CONFIRMED'
    `;
    const params = [groupBy];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND b.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND b.created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` GROUP BY period, b.booking_type ORDER BY period DESC`;

    const result = await pool.query(query, params);

    return {
      generatedAt: new Date().toISOString(),
      filters,
      items: result.rows.map((row) => ({
        period: row.period,
        bookingType: row.booking_type,
        revenue: parseFloat(row.revenue),
        bookingCount: parseInt(row.booking_count, 10),
      })),
    };
  } catch (error) {
    logger.error('Error generating revenue report:', error);
    throw error;
  }
};

/**
 * Get top providers report
 * Note: This is a simplified version. In production, provider info would come from listing metadata
 */
export const getTopProviders = async (filters = {}) => {
  const pool = getPostgresPool();

  try {
    const { limit = 10, startDate, endDate } = filters;

    let query = `
      SELECT 
        b.booking_type as provider,
        SUM(b.price_amount) as total_revenue,
        COUNT(*) as booking_count
      FROM bookings b
      WHERE b.status = 'CONFIRMED'
    `;
    const params = [];
    let paramIndex = 1;

    if (startDate) {
      query += ` AND b.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND b.created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` GROUP BY b.booking_type ORDER BY total_revenue DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);

    return {
      generatedAt: new Date().toISOString(),
      providers: result.rows.map((row) => ({
        provider: row.provider,
        totalRevenue: parseFloat(row.total_revenue),
        bookingCount: parseInt(row.booking_count, 10),
      })),
    };
  } catch (error) {
    logger.error('Error generating top providers report:', error);
    throw error;
  }
};

