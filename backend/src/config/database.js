import pg from 'pg';
import { MongoClient } from 'mongodb';
import { createClient as createRedisClient } from 'redis';
import { logger } from './logger.js';

const { Pool } = pg;

let postgresPool = null;

export const getPostgresPool = () => {
  if (!postgresPool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL must be set for cloud PostgreSQL (Supabase)');
    }
    
    // Cloud PostgreSQL (Supabase) configuration
    postgresPool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }, // Required for Supabase cloud connection
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    postgresPool.on('error', (err) => {
      logger.error('PostgreSQL pool error:', err);
    });

    logger.info('PostgreSQL (Supabase Cloud) connection pool created');
  }
  return postgresPool;
};

let mongoClient = null;
let mongoDb = null;

export const getMongoDB = async () => {
  if (!mongoDb) {
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
      // Reset client on error so it can retry
      mongoClient = null;
      mongoDb = null;
      throw error;
    }
  }
  return mongoDb;
};

let redisClient = null;

export const getRedisClient = async () => {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      throw new Error('REDIS_URL must be set for cloud Redis connection');
    }
    
    // Cloud Redis configuration
    redisClient = createRedisClient({
      url: redisUrl,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis Cloud connected');
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

