import { getMongoDB } from '../config/database.js';
import { logger } from '../config/logger.js';
import { getOrSetCached } from '../utils/cache.js';

/**
 * Search flights with filters and pagination
 */
export const searchFlights = async (query) => {
  try {
    const {
      from,
      to,
      departDate,
      returnDate,
      passengers = 1,
      class: flightClass = 'economy',
      nonstop,
      maxPrice,
      page = 1,
      limit = 20,
      sort = 'price',
      order = 'asc',
    } = query;

    const db = await getMongoDB();
    const collection = db.collection('flights');

    // Build query filter
    const filter = {};
    if (from) filter.from = from;
    if (to) filter.to = to;
    if (departDate) filter.departDate = departDate;
    if (returnDate) filter.returnDate = returnDate;
    if (nonstop === 'true') filter.nonstop = true;
    if (maxPrice) filter.price = { $lte: parseFloat(maxPrice) };

    // Build sort
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [items, totalItems] = await Promise.all([
      collection.find(filter).sort(sortObj).skip(skip).limit(parseInt(limit)).toArray(),
      collection.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems,
        totalPages: Math.ceil(totalItems / parseInt(limit)),
      },
    };
  } catch (error) {
    logger.error('Error in searchFlights service:', error);
    throw error;
  }
};

/**
 * Get available airlines
 */
export const getAvailableAirlines = async (query) => {
  try {
    const db = await getMongoDB();
    const collection = db.collection('flights');
    
    const airlines = await collection.distinct('airline');
    return { airlines };
  } catch (error) {
    logger.error('Error in getAvailableAirlines service:', error);
    throw error;
  }
};

/**
 * Get flight locations for autocomplete
 */
export const getFlightLocations = async (query, limit = 10) => {
  try {
    const db = await getMongoDB();
    const collection = db.collection('flights');
    
    const regex = new RegExp(query, 'i');
    const fromLocations = await collection.distinct('from', { from: regex });
    const toLocations = await collection.distinct('to', { to: regex });
    
    const uniqueLocations = [...new Set([...fromLocations, ...toLocations])];
    return uniqueLocations.slice(0, limit);
  } catch (error) {
    logger.error('Error in getFlightLocations service:', error);
    throw error;
  }
};

/**
 * Get flight prices by date range
 */
export const getFlightPricesByDate = async ({ from, to, startDate, endDate }) => {
  try {
    const db = await getMongoDB();
    const collection = db.collection('flights');
    
    const filter = {};
    if (from) filter.from = from;
    if (to) filter.to = to;
    if (startDate || endDate) {
      filter.departDate = {};
      if (startDate) filter.departDate.$gte = startDate;
      if (endDate) filter.departDate.$lte = endDate;
    }
    
    const flights = await collection.find(filter).toArray();
    
    // Group by date and get min price
    const pricesByDate = {};
    flights.forEach(flight => {
      const date = flight.departDate;
      if (!pricesByDate[date] || flight.price < pricesByDate[date]) {
        pricesByDate[date] = flight.price;
      }
    });
    
    return Object.entries(pricesByDate).map(([date, price]) => ({ date, price }));
  } catch (error) {
    logger.error('Error in getFlightPricesByDate service:', error);
    throw error;
  }
};

/**
 * Get flight by ID
 */
export const getFlightById = async (flightId) => {
  try {
    const db = await getMongoDB();
    const collection = db.collection('flights');
    
    return await collection.findOne({ id: flightId });
  } catch (error) {
    logger.error('Error in getFlightById service:', error);
    throw error;
  }
};

/**
 * Search hotels with filters and pagination
 */
export const searchHotels = async (query) => {
  try {
    const {
      city,
      state,
      checkIn,
      checkOut,
      guests = 1,
      minRating,
      maxPrice,
      amenities,
      page = 1,
      limit = 20,
      sort = 'price',
      order = 'asc',
    } = query;

    const db = await getMongoDB();
    const collection = db.collection('hotels');

    // Build query filter
    const filter = {};
    if (city) filter.city = new RegExp(city, 'i');
    if (state) filter.state = state;
    if (minRating) filter.rating = { $gte: parseFloat(minRating) };
    if (maxPrice) filter['rooms.pricePerNight'] = { $lte: parseFloat(maxPrice) };
    if (amenities) {
      const amenitiesList = amenities.split(',');
      filter.amenities = { $all: amenitiesList };
    }

    // Build sort
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [items, totalItems] = await Promise.all([
      collection.find(filter).sort(sortObj).skip(skip).limit(parseInt(limit)).toArray(),
      collection.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems,
        totalPages: Math.ceil(totalItems / parseInt(limit)),
      },
    };
  } catch (error) {
    logger.error('Error in searchHotels service:', error);
    throw error;
  }
};

/**
 * Get hotel cities for autocomplete
 */
export const getHotelCities = async (query, limit = 10) => {
  try {
    const db = await getMongoDB();
    const collection = db.collection('hotels');
    
    const regex = new RegExp(query, 'i');
    const cities = await collection.distinct('city', { city: regex });
    
    return cities.slice(0, limit);
  } catch (error) {
    logger.error('Error in getHotelCities service:', error);
    throw error;
  }
};

/**
 * Get hotel by ID
 */
export const getHotelById = async (hotelId) => {
  try {
    const db = await getMongoDB();
    const collection = db.collection('hotels');
    
    return await collection.findOne({ id: hotelId });
  } catch (error) {
    logger.error('Error in getHotelById service:', error);
    throw error;
  }
};

/**
 * Search cars with filters and pagination
 */
export const searchCars = async (query) => {
  try {
    const {
      city,
      state,
      pickupDate,
      dropoffDate,
      carType,
      transmission,
      maxPrice,
      page = 1,
      limit = 20,
      sort = 'price',
      order = 'asc',
    } = query;

    const db = await getMongoDB();
    const collection = db.collection('cars');

    // Build query filter
    const filter = {};
    if (city) filter.city = new RegExp(city, 'i');
    if (state) filter.state = state;
    if (carType) filter.type = carType;
    if (transmission) filter.transmission = transmission;
    if (maxPrice) filter.pricePerDay = { $lte: parseFloat(maxPrice) };

    // Build sort
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [items, totalItems] = await Promise.all([
      collection.find(filter).sort(sortObj).skip(skip).limit(parseInt(limit)).toArray(),
      collection.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems,
        totalPages: Math.ceil(totalItems / parseInt(limit)),
      },
    };
  } catch (error) {
    logger.error('Error in searchCars service:', error);
    throw error;
  }
};

/**
 * Get car by ID
 */
export const getCarById = async (carId) => {
  try {
    const db = await getMongoDB();
    const collection = db.collection('cars');
    
    return await collection.findOne({ id: carId });
  } catch (error) {
    logger.error('Error in getCarById service:', error);
    throw error;
  }
};

/**
 * Get car locations for autocomplete
 */
export const getCarLocations = async (query, limit = 10) => {
  try {
    const db = await getMongoDB();
    const collection = db.collection('cars');
    
    const regex = new RegExp(query, 'i');
    const cities = await collection.distinct('city', { city: regex });
    
    return cities.slice(0, limit);
  } catch (error) {
    logger.error('Error in getCarLocations service:', error);
    throw error;
  }
};

