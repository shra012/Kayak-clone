import { logger } from '../config/logger.js';
import { getPostgresPool } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { PROFILE_TYPES } from '../constants/profileTypes.js';
import { isValidSsn } from '../utils/validators.js';
import {
  normalizeProfileType,
  normalizePartnerDetails,
} from '../utils/profile.js';
import {
  getCachedUserProfile,
  cacheUserProfile,
  invalidateUserProfileCache,
} from '../utils/cache.js';

export const listUsers = async (filters) => {
  const pool = getPostgresPool();
  const { page, pageSize, email, state } = filters;
  const offset = (page - 1) * pageSize;

  let query = `SELECT id, ssn, first_name, last_name, email, phone_number,
    address_line1, address_line2, address_city, address_state, address_zip_code,
    profile_image_url, role, loyalty_tier, profile_type, ssn_verified_at,
    partner_details, created_at, updated_at, last_login
    FROM users WHERE 1=1`;
  const params = [];
  let paramIndex = 1;

  if (email) {
    query += ` AND email = $${paramIndex++}`;
    params.push(email);
  }

  if (state) {
    query += ` AND address_state = $${paramIndex++}`;
    params.push(state);
  }

  query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(pageSize, offset);

  const usersResult = await pool.query(query, params);
  const users = usersResult.rows;

  let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
  const countParams = [];
  let countParamIndex = 1;
  if (email) {
    countQuery += ` AND email = $${countParamIndex++}`;
    countParams.push(email);
  }
  if (state) {
    countQuery += ` AND address_state = $${countParamIndex++}`;
    countParams.push(state);
  }
  const countResult = await pool.query(countQuery, countParams);
  const totalItems = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(totalItems / pageSize);

  return {
    items: users,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages
    }
  };
};

export const createUser = async (userData) => {
  const pool = getPostgresPool();
  const userId = uuidv4();

  const {
    ssn,
    firstName,
    lastName,
    email,
    phoneNumber,
    address,
    profileImageUrl,
    profileType = PROFILE_TYPES.TRAVELER,
    partnerDetails: partnerProfile = null,
  } = userData;

  if (ssn && !isValidSsn(ssn)) {
    const error = new Error('SSN must match XXX-XX-XXXX');
    error.code = 'INVALID_SSN';
    throw error;
  }

  const normalizedProfileType = normalizeProfileType(profileType);
  const partnerDetails = normalizePartnerDetails(normalizedProfileType, partnerProfile);
  const partnerDetailsValue = partnerDetails ? JSON.stringify(partnerDetails) : null;

  const query = `
    INSERT INTO users (
      id, ssn, first_name, last_name, email, phone_number,
      address_line1, address_line2, address_city, address_state, address_zip_code,
      profile_image_url, profile_type, ssn_verified_at, partner_details
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
  `;

  const params = [
    userId,
    ssn || null,
    firstName,
    lastName,
    email,
    phoneNumber,
    address.line1,
    address.line2 || null,
    address.city,
    address.state,
    address.zipCode,
    profileImageUrl || null,
    normalizedProfileType,
    ssn ? new Date() : null,
    partnerDetailsValue,
  ];

  await pool.query(query, params);

  return getUserById(userId);
};

export const getUserById = async (userId) => {
  // Try to get cached user profile
  const cached = await getCachedUserProfile(userId);
  if (cached) {
    logger.debug(`Returning cached user profile: ${userId}`);
    return cached;
  }

  const pool = getPostgresPool();
  const result = await pool.query(
    `SELECT id, ssn, first_name, last_name, email, phone_number,
     address_line1, address_line2, address_city, address_state, address_zip_code,
     profile_image_url, role, loyalty_tier, profile_type, ssn_verified_at,
     partner_details, created_at, updated_at, last_login
     FROM users WHERE id = $1`,
    [userId]
  );

  const user = result.rows[0] || null;

  if (user) {
    // Cache the user profile
    await cacheUserProfile(userId, user);
  }

  return user;
};

export const updateUserSsn = async (userId, ssn) => {
  if (!ssn) {
    const error = new Error('SSN is required');
    error.code = 'INVALID_SSN';
    throw error;
  }

  if (!isValidSsn(ssn)) {
    const error = new Error('SSN must match XXX-XX-XXXX');
    error.code = 'INVALID_SSN';
    throw error;
  }

  const pool = getPostgresPool();
  const result = await pool.query(
    `UPDATE users
     SET ssn = $2,
         ssn_verified_at = NOW(),
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, email, first_name, last_name, role, loyalty_tier,
       profile_type, ssn, ssn_verified_at` ,
    [userId, ssn]
  );

  if (result.rowCount === 0) {
    const error = new Error('User not found');
    error.code = 'NOT_FOUND';
    throw error;
  }

  // Invalidate user profile cache
  await invalidateUserProfileCache(userId);

  return result.rows[0];
};

export const updateUser = async (userId, userData) => {
  const pool = getPostgresPool();
  logger.info(`Updating user ${userId}`);
  
  // Invalidate user profile cache
  await invalidateUserProfileCache(userId);
  
  return getUserById(userId);
};

export const deleteUser = async (userId) => {
  const pool = getPostgresPool();
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  
  // Invalidate user profile cache
  await invalidateUserProfileCache(userId);
  
  logger.info(`Deleted user ${userId}`);
};

export const getUserBookings = async (userId, filters) => {
  logger.info(`Getting bookings for user ${userId}`);
  return { items: [], pagination: {} };
};

export const createUserBooking = async (userId, bookingData) => {
  logger.info(`Creating booking for user ${userId}`);
  return {};
};

export const getUserReviews = async (userId) => {
  const pool = getPostgresPool();
  const result = await pool.query(
    'SELECT * FROM reviews WHERE user_id = $1',
    [userId]
  );
  return result.rows;
};
