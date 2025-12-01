import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { getPostgresPool } from '../src/config/database.js';
import { logger } from '../src/config/logger.js';

// Load environment variables
dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    logger.info('Starting migration: fix_users_id_type');
    
    await client.query('BEGIN');
    
    // Step 1: Drop foreign key constraints
    logger.info('Dropping foreign key constraints...');
    await client.query(`
      ALTER TABLE bookings 
      DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;
    `);
    
    await client.query(`
      ALTER TABLE payments 
      DROP CONSTRAINT IF EXISTS payments_user_id_fkey;
    `);
    
    await client.query(`
      ALTER TABLE reviews 
      DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
    `);
    
    // Step 2: Change column type
    logger.info('Changing users.id column from UUID to TEXT...');
    await client.query(`
      ALTER TABLE users 
      ALTER COLUMN id TYPE TEXT USING id::text;
    `);
    
    // Step 3: Add comment
    logger.info('Adding column comment...');
    await client.query(`
      COMMENT ON COLUMN users.id IS 'MongoDB ObjectId stored as TEXT (24-char hex string)';
    `);
    
    await client.query('COMMIT');
    
    logger.info('Migration completed successfully!');
    logger.info('users.id is now TEXT type and can store MongoDB ObjectIds');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Migration error:', error);
    process.exit(1);
  });

