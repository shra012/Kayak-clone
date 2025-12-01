import { getRedisClient } from '../config/database.js';
import { logger } from '../config/logger.js';
import crypto from 'crypto';

const CACHE_ENABLED = process.env.CACHE_ENABLED === 'true';
const CACHE_TTL_LISTING = parseInt(process.env.CACHE_TTL_LISTING || '300', 10);
const CACHE_TTL_SEARCH = parseInt(process.env.CACHE_TTL_SEARCH || '60', 10);
const CACHE_TTL_USER = parseInt(process.env.CACHE_TTL_USER || '600', 10);
const CACHE_TTL_AIRLINES = parseInt(process.env.CACHE_TTL_AIRLINES || '900', 10);

const DEFAULT_TTL = {
  LISTING: CACHE_TTL_LISTING,
  SEARCH_RESULT: CACHE_TTL_SEARCH,
  USER_PROFILE: CACHE_TTL_USER,
  AIRLINES: CACHE_TTL_AIRLINES,
};

export const isCacheEnabled = () => CACHE_ENABLED;

export const generateCacheKey = (prefix, ...parts) => {
  const key = parts.join(':');
  return `${prefix}:${key}`;
};

export const hashSearchCriteria = (criteria) => {
  const str = JSON.stringify(criteria);
  return crypto.createHash('md5').update(str).digest('hex');
};

export const getCached = async (key) => {
  if (!CACHE_ENABLED) {
    logger.debug('Cache disabled, skipping get');
    return null;
  }

  try {
    const redis = await getRedisClient(true);
    if (!redis) {
      logger.debug('Redis client not available (cache disabled or connection failed)');
      return null;
    }

    const cached = await redis.get(key);

    if (cached) {
      logger.debug(`Cache hit: ${key}`);
      return JSON.parse(cached);
    }

    logger.debug(`Cache miss: ${key}`);
    return null;
  } catch (error) {
    logger.error(`Error getting cache for key ${key}:`, error);
    return null;
  }
};

export const setCached = async (key, value, ttlSeconds = DEFAULT_TTL.LISTING) => {
  if (!CACHE_ENABLED) {
    logger.debug('Cache disabled, skipping set');
    return;
  }

  try {
    const redis = await getRedisClient(true);
    if (!redis) {
      logger.debug('Redis client not available (cache disabled or connection failed)');
      return;
    }

    await redis.setEx(key, ttlSeconds, JSON.stringify(value));
    logger.debug(`Cache set: ${key} (TTL: ${ttlSeconds}s)`);
  } catch (error) {
    logger.error(`Error setting cache for key ${key}:`, error);
  }
};

export const deleteCached = async (key) => {
  if (!CACHE_ENABLED) {
    logger.debug('Cache disabled, skipping delete');
    return;
  }

  try {
    const redis = await getRedisClient(true);
    if (!redis) {
      logger.debug('Redis client not available (cache disabled or connection failed)');
      return;
    }

    await redis.del(key);
    logger.debug(`Cache deleted: ${key}`);
  } catch (error) {
    logger.error(`Error deleting cache for key ${key}:`, error);
  }
};

export const deleteCachedByPattern = async (pattern) => {
  if (!CACHE_ENABLED) {
    logger.debug('Cache disabled, skipping pattern delete');
    return;
  }

  try {
    const redis = await getRedisClient(true);
    if (!redis) {
      logger.debug('Redis client not available (cache disabled or connection failed)');
      return;
    }

    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(keys);
      logger.debug(`Cache deleted ${keys.length} keys matching pattern: ${pattern}`);
    }
  } catch (error) {
    logger.error(`Error deleting cache by pattern ${pattern}:`, error);
  }
};

export const getOrSetCached = async (key, fetchFn, ttlSeconds = DEFAULT_TTL.LISTING) => {
  const cached = await getCached(key);

  if (cached !== null) {
    return cached;
  }

  const value = await fetchFn();
  await setCached(key, value, ttlSeconds);
  return value;
};

export const cacheListing = async (type, id, listing, ttlSeconds = DEFAULT_TTL.LISTING) => {
  const key = generateCacheKey('listing', type, id);
  await setCached(key, listing, ttlSeconds);
};

export const getCachedListing = async (type, id) => {
  const key = generateCacheKey('listing', type, id);
  return await getCached(key);
};

export const cacheSearchResults = async (type, criteria, results, ttlSeconds = DEFAULT_TTL.SEARCH_RESULT) => {
  const hash = hashSearchCriteria(criteria);
  const key = generateCacheKey('search', type, hash);
  await setCached(key, results, ttlSeconds);
};

export const getCachedSearchResults = async (type, criteria) => {
  const hash = hashSearchCriteria(criteria);
  const key = generateCacheKey('search', type, hash);
  return await getCached(key);
};

export const invalidateListingCache = async (type, id) => {
  const key = generateCacheKey('listing', type, id);
  await deleteCached(key);

  const searchPattern = generateCacheKey('search', type, '*');
  await deleteCachedByPattern(searchPattern);
};

export const cacheUserProfile = async (userId, profile, ttlSeconds = DEFAULT_TTL.USER_PROFILE) => {
  const key = generateCacheKey('user', 'profile', userId);
  await setCached(key, profile, ttlSeconds);
};

export const getCachedUserProfile = async (userId) => {
  const key = generateCacheKey('user', 'profile', userId);
  return await getCached(key);
};

export const invalidateUserProfileCache = async (userId) => {
  const key = generateCacheKey('user', 'profile', userId);
  await deleteCached(key);
};

export const cacheAvailableAirlines = async (query, airlines, ttlSeconds = DEFAULT_TTL.AIRLINES) => {
  const hash = hashSearchCriteria(query);
  const key = generateCacheKey('airlines', hash);
  await setCached(key, airlines, ttlSeconds);
};

export const getCachedAvailableAirlines = async (query) => {
  const hash = hashSearchCriteria(query);
  const key = generateCacheKey('airlines', hash);
  return await getCached(key);
};

export const invalidateAirlinesCache = async (pattern = '*') => {
  const cachePattern = generateCacheKey('airlines', pattern);
  await deleteCachedByPattern(cachePattern);
};
