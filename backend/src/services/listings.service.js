import { getMongoDB } from '../config/database.js';
import { logger } from '../config/logger.js';
import {
  getCached,
  setCached,
  getOrSetCached,
  getCachedSearchResults,
  cacheSearchResults,
  getCachedListing,
  cacheListing,
  generateCacheKey,
} from '../utils/cache.js';

/**
 * Extract airport code from parameter (handles "LAX" or "LAX - Los Angeles...")
 */
const extractAirportCode = (param) => {
  if (!param) return null;
  // If it's just a code (3 letters), return it
  if (/^[A-Z]{3}$/.test(param.trim())) {
    return param.trim();
  }
  // If it contains a code, extract it (format: "LAX - Los Angeles...")
  const match = param.match(/^([A-Z]{3})/);
  return match ? match[1] : param.trim();
};

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
      departTimeStart,
      departTimeEnd,
      arriveTimeStart,
      arriveTimeEnd,
      minSeats,
      page = 1,
      limit: limitParam,
      pageSize,
      sort = 'price',
      order = 'asc',
    } = query;
    
    // Support both 'limit' and 'pageSize' query parameters
    const limit = limitParam || pageSize || 20;

    // Try to get cached results
    const cached = await getCachedSearchResults('flight', query);
    if (cached) {
      logger.debug('Returning cached flight search results');
      return cached;
    }

    const db = await getMongoDB();
    const collection = db.collection('flights');

    // Build query filter
    const filter = {};
    if (from) {
      const fromCode = extractAirportCode(from);
      filter.from = fromCode;
    }
    if (to) {
      const toCode = extractAirportCode(to);
      filter.to = toCode;
    }
    if (departDate) {
      filter.departDate = departDate;
    }
    if (returnDate) filter.returnDate = returnDate;
    // Only filter by nonstop if explicitly set to 'true' (ignore 'any' or 'false')
    if (nonstop === 'true') filter.nonstop = true;
    if (maxPrice) filter.price = { $lte: parseFloat(maxPrice) };
    // Filter by class if specified (economy, premium_economy, business, first)
    if (flightClass) filter.class = flightClass;
    if (minSeats) filter.availableSeats = { $gte: parseInt(minSeats, 10) };
    if (departTimeStart || departTimeEnd) {
      filter.departureTime = {};
      if (departTimeStart) filter.departureTime.$gte = departTimeStart;
      if (departTimeEnd) filter.departureTime.$lte = departTimeEnd;
    }
    if (arriveTimeStart || arriveTimeEnd) {
      filter.arrivalTime = {};
      if (arriveTimeStart) filter.arrivalTime.$gte = arriveTimeStart;
      if (arriveTimeEnd) filter.arrivalTime.$lte = arriveTimeEnd;
    }

    // Build sort
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const [items, totalItems] = await Promise.all([
      collection.find(filter).sort(sortObj).skip(skip).limit(parseInt(limit)).toArray(),
      collection.countDocuments(filter),
    ]);

    const results = {
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems,
        totalPages: Math.ceil(totalItems / parseInt(limit)),
      },
    };

    // Cache the results
    await cacheSearchResults('flight', query, results);

    return results;
  } catch (error) {
    logger.error('Error in searchFlights service:', error);
    throw error;
  }
};

/**
 * Get available airlines filtered by route and dates
 */
export const getAvailableAirlines = async (query) => {
  try {
    const { from, to, departDate, returnDate } = query;
    
    const db = await getMongoDB();
    const collection = db.collection('flights');
    
    if (returnDate) {
      // For round trips, find airlines that exist for both outbound and return flights
      const fromCode = extractAirportCode(from);
      const toCode = extractAirportCode(to);
      
      // Get airlines for outbound flight
      const outboundFilter = {
        from: fromCode,
        to: toCode,
        departDate: departDate,
      };
      const outboundAirlines = await collection.distinct('airline', outboundFilter);
      
      // Get airlines for return flight (reversed route)
      const returnFilter = {
        from: toCode,
        to: fromCode,
        departDate: returnDate,
      };
      const returnAirlines = await collection.distinct('airline', returnFilter);
      
      // Return airlines that exist in both directions
      const commonAirlines = outboundAirlines.filter(airline => returnAirlines.includes(airline));
      
      return { airlines: commonAirlines.sort() };
    } else {
      // For one-way trips, just get airlines for the route
      const filter = {};
      
      if (from) {
        const fromCode = extractAirportCode(from);
        filter.from = fromCode;
      }
      
      if (to) {
        const toCode = extractAirportCode(to);
        filter.to = toCode;
      }
      
      if (departDate) {
        filter.departDate = departDate;
      }
      
      // Get distinct airlines that match the filter
      const airlines = await collection.distinct('airline', filter);
      
      return { airlines: airlines.sort() };
    }
  } catch (error) {
    logger.error('Error in getAvailableAirlines service:', error);
    throw error;
  }
};

/**
 * Get flight locations for autocomplete (with Redis caching)
 */
export const getFlightLocations = async (query, limit = 10) => {
  try {
    const trimmedQuery = (query || '').trim();
    
    // If query is empty, return empty array
    if (!trimmedQuery) {
      return [];
    }
    
    // Generate cache key based on query
    const cacheKey = generateCacheKey('flight_locations', trimmedQuery.toLowerCase(), limit);
    
    // Try to get from cache first
    const cached = await getCached(cacheKey);
    if (cached) {
      logger.debug(`Returning cached flight locations for query: ${trimmedQuery}`);
      return cached;
    }
    
    // If not in cache, query database
    const db = await getMongoDB();
    const flightsCollection = db.collection('flights');
    const airportsCollection = db.collection('airports');
    
    // Use regex to match airport codes that start with or contain the query
    // Escape special regex characters in the query
    const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'i');
    
    // Query with regex filter using MongoDB $regex operator (more efficient)
    const fromLocations = await flightsCollection.distinct('from', { from: { $regex: regex } });
    const toLocations = await flightsCollection.distinct('to', { to: { $regex: regex } });
    
    // Combine and deduplicate, filter out null/undefined values
    const uniqueCodes = [...new Set([...fromLocations, ...toLocations])]
      .filter(code => code && typeof code === 'string' && code.trim().length > 0)
      .slice(0, limit);
    
    // Look up full airport details from airports collection
    const airportDetails = await airportsCollection.find({
      code: { $in: uniqueCodes }
    }).toArray();
    
    // Create a map of code -> airport details
    const airportMap = new Map();
    airportDetails.forEach(airport => {
      airportMap.set(airport.code, airport);
    });
    
    // Format results with full airport names
    const results = uniqueCodes.map(code => {
      const airport = airportMap.get(code);
      if (airport) {
        // Format: "CODE - City (Airport Name)"
        const cityPart = airport.city && airport.city !== 'Unknown' ? ` - ${airport.city}` : '';
        const namePart = airport.name && airport.name !== 'Unknown' ? ` (${airport.name})` : '';
        return {
          code: code,
          city: airport.city || null,
          name: airport.name || null,
          label: `${code}${cityPart}${namePart}`,
        };
      } else {
        // If airport not found in airports collection, return just the code
        return {
          code: code,
          city: null,
          name: null,
          label: code,
        };
      }
    });
    
    logger.debug(`Found ${results.length} flight locations for query: ${trimmedQuery}`);
    
    // Cache the results for 1 minute (60 seconds)
    await setCached(cacheKey, results, 60);
    
    return results;
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
    // Try to get cached flight
    const cached = await getCachedListing('flight', flightId);
    if (cached) {
      logger.debug(`Returning cached flight: ${flightId}`);
      return cached;
    }

    const db = await getMongoDB();
    const collection = db.collection('flights');
    
    const flight = await collection.findOne({ id: flightId });

    if (flight) {
      // Cache the flight
      await cacheListing('flight', flightId, flight);
    }

    return flight;
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

    // Try to get cached results
    const cached = await getCachedSearchResults('hotel', query);
    if (cached) {
      logger.debug('Returning cached hotel search results');
      return cached;
    }

    const db = await getMongoDB();
    const collection = db.collection('hotels');

    // Build query filter
    const filter = {};
    if (city) filter.city = new RegExp(city, 'i');
    if (state) filter.state = state;
    if (minRating) filter.rating = { $gte: parseFloat(minRating) };
    if (maxPrice) filter.pricePerNight = { $lte: parseFloat(maxPrice) };
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

    const results = {
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems,
        totalPages: Math.ceil(totalItems / parseInt(limit)),
      },
    };

    // Cache the results
    await cacheSearchResults('hotel', query, results);

    return results;
  } catch (error) {
    logger.error('Error in searchHotels service:', error);
    throw error;
  }
};

/**
 * Get hotel locations (cities) and property names for autocomplete
 */
export const getHotelCities = async (query, limit = 10) => {
  try {
    const db = await getMongoDB();
    const collection = db.collection('hotels');
    
    const regex = new RegExp(query, 'i');
    const results = [];
    
    // Get distinct cities matching the query
    const cities = await collection.distinct('city', { city: regex });
    cities.slice(0, Math.floor(limit / 2)).forEach(city => {
      results.push({
        type: 'location',
        name: city,
        displayName: city,
        country: null, // Will be populated if available
      });
    });
    
    // Get hotel names matching the query
    const hotels = await collection.find(
      { name: regex },
      { projection: { name: 1, city: 1, state: 1, country: 1 } }
    ).limit(Math.ceil(limit / 2)).toArray();
    
    hotels.forEach(hotel => {
      // Avoid duplicates if city already added
      const cityExists = results.some(r => r.type === 'location' && r.name === hotel.city);
      if (!cityExists && results.length < limit) {
        results.push({
          type: 'property',
          name: hotel.name,
          displayName: `${hotel.name}, ${hotel.city}`,
          city: hotel.city,
          state: hotel.state || null,
          country: hotel.country || null,
        });
      }
    });
    
    return results.slice(0, limit);
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
    // Try to get cached hotel
    const cached = await getCachedListing('hotel', hotelId);
    if (cached) {
      logger.debug(`Returning cached hotel: ${hotelId}`);
      return cached;
    }

    const db = await getMongoDB();
    const collection = db.collection('hotels');
    
    const hotel = await collection.findOne({ id: hotelId });

    if (hotel) {
      // Cache the hotel
      await cacheListing('hotel', hotelId, hotel);
    }

    return hotel;
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
      availabilityStatus,
      maxPrice,
      page = 1,
      limit = 20,
      sort = 'price',
      order = 'asc',
    } = query;

    // Try to get cached results
    const cached = await getCachedSearchResults('car', query);
    if (cached) {
      logger.debug('Returning cached car search results');
      return cached;
    }

    const db = await getMongoDB();
    const collection = db.collection('cars');

    // Build query filter
    const filter = {};
    if (city) filter.city = new RegExp(city, 'i');
    if (state) filter.state = state;
    if (carType) filter.type = carType;
    if (transmission) filter.transmission = transmission;
    if (maxPrice) filter.pricePerDay = { $lte: parseFloat(maxPrice) };
    if (availabilityStatus) {
      // support either availabilityStatus or status fields in the collection
      filter.$or = [
        { availabilityStatus },
        { status: availabilityStatus },
      ];
    }

    // Build sort
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [items, totalItems] = await Promise.all([
      collection.find(filter).sort(sortObj).skip(skip).limit(parseInt(limit)).toArray(),
      collection.countDocuments(filter),
    ]);

    const results = {
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems,
        totalPages: Math.ceil(totalItems / parseInt(limit)),
      },
    };

    // Cache the results
    await cacheSearchResults('car', query, results);

    return results;
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
    // Try to get cached car
    const cached = await getCachedListing('car', carId);
    if (cached) {
      logger.debug(`Returning cached car: ${carId}`);
      return cached;
    }

    const db = await getMongoDB();
    const collection = db.collection('cars');
    
    const car = await collection.findOne({ id: carId });

    if (car) {
      // Cache the car
      await cacheListing('car', carId, car);
    }

    return car;
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
