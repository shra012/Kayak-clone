import multer from 'multer';
import { logger } from '../config/logger.js';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed'), false);
  }
};

export const uploadSingle = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter,
}).single('image');

export const uploadMultiple = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
  fileFilter,
}).array('images', 10);

export const uploadMiddleware = (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err) {
      logger.error('Upload error:', err);
      return res.status(400).json({
        code: 'UPLOAD_ERROR',
        message: err.message,
      });
    }
    next();
  });
};

