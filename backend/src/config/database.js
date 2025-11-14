import pg from 'pg';
import { MongoClient } from 'mongodb';
import { createClient as createRedisClient } from 'redis';
import { logger } from './logger.js';

const { Pool } = pg;

let postgresPool = null;

export const getPostgresPool = () => {
  if (!postgresPool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (connectionString) {
      postgresPool = new Pool({
        connectionString,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      postgresPool.on('error', (err) => {
        logger.error('PostgreSQL pool error:', err);
      });

      logger.info('PostgreSQL connection pool created');
    } else {
      logger.warn('DATABASE_URL not set');
    }
  }
  return postgresPool;
};

let mongoClient = null;
let mongoDb = null;

export const getMongoDB = async () => {
  if (!mongoClient) {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('MONGODB_URI must be set');
    }

    mongoClient = new MongoClient(uri);

    try {
      await mongoClient.connect();
      const dbName = 'kayak';
      mongoDb = mongoClient.db(dbName);
      logger.info('MongoDB connected successfully');
    } catch (error) {
      logger.error('MongoDB connection error:', error);
      throw error;
    }
  }
  return mongoDb;
};

let redisClient = null;

export const getRedisClient = async () => {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;
    
    if (redisUrl) {
      redisClient = createRedisClient({
        url: redisUrl,
      });
    } else {
      redisClient = createRedisClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379
        }
      });
    }

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    await redisClient.connect();
  }
  return redisClient;
};

export const closeConnections = async () => {
  try {
    if (postgresPool) {
      await postgresPool.end();
      logger.info('PostgreSQL connection pool closed');
    }

    if (mongoClient) {
      await mongoClient.close();
      logger.info('MongoDB connection closed');
    }

    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis connection closed');
    }
  } catch (error) {
    logger.error('Error closing database connections:', error);
  }
};

