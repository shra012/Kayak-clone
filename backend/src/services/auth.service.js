import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPostgresPool } from '../config/database.js';
import { logger } from '../config/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { doesProfileRequireSsn } from '../constants/profileTypes.js';
import { isValidSsn } from '../utils/validators.js';
import {
  normalizeProfileType,
  normalizePartnerDetails,
} from '../utils/profile.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const SALT_ROUNDS = 12;

const parsePartnerDetails = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }
  return value;
};

export const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

const mapUserForResponse = (user) => {
  const profileType = normalizeProfileType(user.profile_type);
  const requiresSsn = doesProfileRequireSsn(profileType);
  const hasSsnOnFile = Boolean(user.ssn);
  const partnerDetails = parsePartnerDetails(user.partner_details);

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
    loyaltyTier: user.loyalty_tier,
    profileType,
    requiresSsn,
    hasSsnOnFile,
    compliance: {
      profileType,
      requiresSsn,
      isSsnOnFile: hasSsnOnFile,
      verifiedAt: user.ssn_verified_at || null,
    },
    partnerDetails,
  };
};

export const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role || 'user',
    profileType: normalizeProfileType(user.profile_type),
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const register = async (userData) => {
  const pool = getPostgresPool();
  const userId = uuidv4();

  const {
    email,
    password,
    ssn,
    firstName,
    lastName,
    phoneNumber,
    address,
    profileType,
    partnerProfile = null,
  } = userData;

  const normalizedProfileType = normalizeProfileType(profileType);
  const partnerDetails = normalizePartnerDetails(normalizedProfileType, partnerProfile);
  const partnerDetailsValue = partnerDetails ? JSON.stringify(partnerDetails) : null;

  if (ssn && !isValidSsn(ssn)) {
    throw new Error('SSN must match XXX-XX-XXXX');
  }

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  const hashedPassword = await hashPassword(password);

  const query = `
    INSERT INTO users (
      id, email, password_hash, ssn, first_name, last_name, phone_number,
      address_line1, address_line2, address_city, address_state, address_zip_code,
      role, loyalty_tier, profile_type, ssn_verified_at, partner_details,
      created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12,
      $13, $14, $15, $16, $17, NOW(), NOW()
    )
    RETURNING id, email, first_name, last_name, role, loyalty_tier,
      profile_type, ssn, ssn_verified_at, partner_details
  `;

  const params = [
    userId,
    email,
    hashedPassword,
    ssn || null,
    firstName,
    lastName,
    phoneNumber,
    address.line1,
    address.line2 || null,
    address.city,
    address.state,
    address.zipCode,
    'user',
    'none',
    normalizedProfileType,
    ssn ? new Date() : null,
    partnerDetailsValue,
  ];

  const result = await pool.query(query, params);
  const user = result.rows[0];

  const token = generateToken(user);

  return {
    user: mapUserForResponse(user),
    token,
  };
};

export const login = async (email, password) => {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (user.role === 'suspended') {
    throw new Error('Account is suspended');
  }

  if (!user.password_hash) {
    throw new Error('Invalid email or password');
  }

  const isValidPassword = await comparePassword(password, user.password_hash);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  const token = generateToken(user);

  return {
    user: mapUserForResponse(user),
    token,
  };
};

export const getUserByEmail = async (email) => {
  const pool = getPostgresPool();
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
};

export const refreshToken = async (userId) => {
  const pool = getPostgresPool();
  const result = await pool.query(
    `SELECT id, email, first_name, last_name, role, loyalty_tier,
      profile_type, ssn, ssn_verified_at, partner_details
     FROM users WHERE id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = result.rows[0];

  if (user.role === 'suspended') {
    throw new Error('Account is suspended');
  }

  const token = generateToken(user);

  return {
    user: mapUserForResponse(user),
    token,
  };
};
