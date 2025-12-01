import dns from 'node:dns';
import pg from 'pg';
import { MongoClient } from 'mongodb';
import { createClient as createRedisClient } from 'redis';
import { logger } from './logger.js';

const { Pool } = pg;

// Prefer IPv4 for cloud databases (Supabase) to avoid IPv6 ENETUNREACH in Docker
dns.setDefaultResultOrder('ipv4first');

let postgresPool = null;

export const getPostgresPool = () => {
  if (!postgresPool) {
    let connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      const error = new Error('DATABASE_URL must be set for cloud PostgreSQL (Supabase)');
      logger.error(error.message);
      throw error;
    }

    // Allow overriding the hostname to an IPv4-capable endpoint when Docker lacks IPv6
    // e.g. set POSTGRES_HOST_OVERRIDE to a pooling endpoint or IPv4 address
    if (process.env.POSTGRES_HOST_OVERRIDE) {
      try {
        const url = new URL(connectionString);
        url.hostname = process.env.POSTGRES_HOST_OVERRIDE;
        connectionString = url.toString();
        logger.warn(`Using POSTGRES_HOST_OVERRIDE=${process.env.POSTGRES_HOST_OVERRIDE}`);
      } catch (err) {
        logger.error('Failed to apply POSTGRES_HOST_OVERRIDE:', err);
      }
    }

    try {
      // Detect whether to use SSL:
      // - For cloud databases like Supabase, SSL is required
      // - For local Docker/Postgres (localhost/127.0.0.1), SSL is typically disabled
      // - Can be overridden explicitly via POSTGRES_SSL env var
      let sslConfig;
      const sslOverride = process.env.POSTGRES_SSL;
      const isLocalHost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

      if (sslOverride === 'false' || isLocalHost) {
        // Local/Postgres running without SSL
        sslConfig = false;
        logger.info('PostgreSQL SSL disabled (local connection detected or POSTGRES_SSL=false)');
      } else {
        // Cloud PostgreSQL (Supabase) configuration
        sslConfig = { rejectUnauthorized: false };
      }

      postgresPool = new Pool({
        connectionString,
        ssl: sslConfig,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000, // Increased timeout for cloud connections
      });

      postgresPool.on('error', (err) => {
        logger.error('PostgreSQL pool error:', err);
      });

      logger.info('PostgreSQL (Supabase Cloud) connection pool created');
    } catch (error) {
      logger.error('Failed to create PostgreSQL pool:', error);
      throw error;
    }
  }
  return postgresPool;
};

let mongoClient = null;
let mongoDb = null;

export const getMongoDB = async () => {
  if (!mongoDb) {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      const error = new Error('MONGODB_URI must be set');
      logger.error(error.message);
      throw error;
    }

    mongoClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout for cloud connections
      connectTimeoutMS: 10000,
    });

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
      const error = new Error('REDIS_URL must be set for cloud Redis connection');
      logger.error(error.message);
      throw error;
    }
    
    try {
      // Cloud Redis configuration
      redisClient = createRedisClient({
        url: redisUrl,
        socket: {
          connectTimeout: 10000, // 10 second timeout for cloud connections
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis connection failed after 10 retries');
              return new Error('Redis connection failed');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      redisClient.on('error', (err) => {
        logger.error('Redis Client Error:', err);
      });

      redisClient.on('connect', () => {
        logger.info('Redis Cloud connected');
      });

      await redisClient.connect();
    } catch (error) {
      logger.error('Redis connection error:', error);
      redisClient = null;
      throw error;
    }
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

    // Close Kafka connections
    const { closeKafkaConnections } = await import('./kafka.js');
    await closeKafkaConnections();
  } catch (error) {
    logger.error('Error closing database connections:', error);
  }
};
