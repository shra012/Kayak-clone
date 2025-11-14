import { logger } from '../config/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  const isDevelopment = process.env.NODE_ENV === 'development';

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    code: err.code || 'INTERNAL_ERROR',
    message,
    ...(isDevelopment && { stack: err.stack }),
    ...(err.details && { details: err.details }),
    correlationId: req.correlationId || req.id
  });
};

