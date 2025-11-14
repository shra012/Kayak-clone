import jwt from 'jsonwebtoken';
import { logger } from '../config/logger.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Authentication token required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Invalid token:', error.message);
    return res.status(403).json({
      code: 'FORBIDDEN',
      message: 'Invalid or expired token'
    });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      code: 'FORBIDDEN',
      message: 'Admin privileges required'
    });
  }

  next();
};

export const requireModerator = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Authentication required'
    });
  }

  if (!['admin', 'moderator'].includes(req.user.role)) {
    return res.status(403).json({
      code: 'FORBIDDEN',
      message: 'Moderator privileges required'
    });
  }

  next();
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'Insufficient privileges'
      });
    }

    next();
  };
};

