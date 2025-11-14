import * as authService from '../services/auth.service.js';
import { getPostgresPool } from '../config/database.js';
import { logger } from '../config/logger.js';
import { doesProfileRequireSsn } from '../constants/profileTypes.js';
import { normalizeProfileType } from '../utils/profile.js';

export const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({
      code: 'SUCCESS',
      data: result,
    });
  } catch (error) {
    logger.error('Registration error:', error);
    if (error.message === 'User with this email already exists') {
      return res.status(409).json({
        code: 'CONFLICT',
        message: error.message,
      });
    }
    if (error.code === 'VALIDATION_ERROR') {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: error.message,
      });
    }
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Email and password are required',
      });
    }

    const result = await authService.login(email, password);
    res.json({
      code: 'SUCCESS',
      data: result,
    });
  } catch (error) {
    logger.error('Login error:', error);
    if (
      error.message === 'Invalid email or password' ||
      error.message === 'Account is suspended'
    ) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: error.message,
      });
    }
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    const result = await authService.refreshToken(userId);
    res.json({
      code: 'SUCCESS',
      data: result,
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    if (error.message === 'Account is suspended') {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: error.message,
      });
    }
    next(error);
  }
};

export const logout = async (req, res) => {
  res.json({
    code: 'SUCCESS',
    message: 'Logged out successfully',
  });
};

export const getMe = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    const pool = getPostgresPool();
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, role, loyalty_tier,
        profile_image_url, created_at, updated_at,
        profile_type, ssn, ssn_verified_at, partner_details
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    const user = result.rows[0];
    const profileType = normalizeProfileType(user.profile_type);
    const requiresSsn = doesProfileRequireSsn(profileType);
    const hasSsn = Boolean(user.ssn);

    res.json({
      code: 'SUCCESS',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        loyaltyTier: user.loyalty_tier,
        profileImageUrl: user.profile_image_url,
        profileType,
        requiresSsn,
        hasSsnOnFile: hasSsn,
        partnerDetails: user.partner_details || null,
        compliance: {
          requiresSsn,
          ssnOnFile: hasSsn,
          verifiedAt: user.ssn_verified_at || null,
        },
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    });
  } catch (error) {
    logger.error('Get me error:', error);
    next(error);
  }
};
