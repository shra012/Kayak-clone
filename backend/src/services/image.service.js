import { getBucket } from '../config/firebase.js';
import { logger } from '../config/logger.js';

const BUCKET_NAME = process.env.FIREBASE_STORAGE_BUCKET || 'kayak';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_VERSIONS_TO_KEEP = 2;

const getEntityPath = (entityType, entityId) => {
  return `kayak/${entityType}/${entityId}`;
};

const getImagePath = (entityType, entityId, version, extension) => {
  return `${getEntityPath(entityType, entityId)}/${version}.${extension}`;
};

const getCurrentVersion = async (entityType, entityId) => {
  const bucket = getBucket();
  if (!bucket) {
    return 0;
  }

  const prefix = getEntityPath(entityType, entityId);
  const [files] = await bucket.getFiles({ prefix });

  if (files.length === 0) {
    return 0;
  }

  const versions = files
    .map((file) => {
      const match = file.name.match(/\/(\d+)\.\w+$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((v) => !isNaN(v));

  return versions.length > 0 ? Math.max(...versions) : 0;
};

const cleanupOldVersions = async (entityType, entityId, currentVersion) => {
  const bucket = getBucket();
  if (!bucket) {
    return;
  }

  const prefix = getEntityPath(entityType, entityId);
  const [files] = await bucket.getFiles({ prefix });

  let versionsToDelete;
  
  if (entityType === 'profiles') {
    versionsToDelete = files
      .map((file) => {
        const match = file.name.match(/\/(\d+)\.\w+$/);
        return match && parseInt(match[1], 10) < currentVersion
          ? { version: parseInt(match[1], 10), file }
          : null;
      })
      .filter((v) => v !== null);
  } else {
    versionsToDelete = files
      .map((file) => {
        const match = file.name.match(/\/(\d+)\.\w+$/);
        return match && parseInt(match[1], 10) < currentVersion - 1
          ? { version: parseInt(match[1], 10), file }
          : null;
      })
      .filter((v) => v && v.version < currentVersion - 1);
  }

  if (versionsToDelete.length > 0) {
    const deletePromises = versionsToDelete.map(({ file }) => file.delete());
    await Promise.all(deletePromises);
    logger.info(`Cleaned up ${versionsToDelete.length} old image versions for ${entityType}/${entityId}`);
  }
};

export const uploadEntityImage = async (file, entityType, entityId) => {
  if (!file) {
    throw new Error('No file provided');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 5MB limit');
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed');
  }

  const bucket = getBucket();
  if (!bucket) {
    throw new Error('Firebase Storage not initialized');
  }

  const currentVersion = await getCurrentVersion(entityType, entityId);
  const newVersion = currentVersion + 1;
  const fileExtension = file.originalname.split('.').pop();
  const fileName = getImagePath(entityType, entityId, newVersion, fileExtension);
  const fileUpload = bucket.file(fileName);

  const stream = fileUpload.createWriteStream({
    metadata: {
      contentType: file.mimetype,
      metadata: {
        originalName: file.originalname,
        uploadedAt: new Date().toISOString(),
        entityType,
        entityId,
        version: newVersion.toString(),
      },
    },
    public: true,
  });

  return new Promise((resolve, reject) => {
    stream.on('error', (error) => {
      logger.error('Image upload error:', error);
      reject(error);
    });

    stream.on('finish', async () => {
      try {
        await fileUpload.makePublic();
        const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`;
        logger.info(`Image uploaded: ${publicUrl} (version ${newVersion})`);

        await cleanupOldVersions(entityType, entityId, newVersion);

        resolve({
          url: publicUrl,
          fileName,
          version: newVersion,
          size: file.size,
          contentType: file.mimetype,
          entityType,
          entityId,
        });
      } catch (error) {
        logger.error('Error making file public:', error);
        reject(error);
      }
    });

    stream.end(file.buffer);
  });
};

export const uploadProfileImage = async (file, profileId) => {
  return uploadEntityImage(file, 'profiles', profileId);
};

export const uploadFlightImage = async (file, flightId) => {
  return uploadEntityImage(file, 'flights', flightId);
};

export const uploadHotelImage = async (file, hotelId) => {
  return uploadEntityImage(file, 'hotels', hotelId);
};

export const uploadCarImage = async (file, carId) => {
  return uploadEntityImage(file, 'cars', carId);
};

export const deleteImage = async (imageUrl) => {
  if (!imageUrl) {
    return;
  }

  try {
    const bucket = getBucket();
    if (!bucket) {
      logger.warn('Firebase Storage not initialized, skipping image deletion');
      return;
    }

    const fileName = imageUrl.split(`${BUCKET_NAME}/`)[1];
    if (!fileName) {
      logger.warn(`Could not extract filename from URL: ${imageUrl}`);
      return;
    }

    await bucket.file(fileName).delete();
    logger.info(`Image deleted: ${fileName}`);
  } catch (error) {
    logger.error('Error deleting image:', error);
    throw error;
  }
};

export const deleteEntityImages = async (entityType, entityId) => {
  const bucket = getBucket();
  if (!bucket) {
    logger.warn('Firebase Storage not initialized, skipping image deletion');
    return;
  }

  const prefix = getEntityPath(entityType, entityId);
  const [files] = await bucket.getFiles({ prefix });

  if (files.length > 0) {
    const deletePromises = files.map((file) => file.delete());
    await Promise.all(deletePromises);
    logger.info(`Deleted ${files.length} images for ${entityType}/${entityId}`);
  }
};

export const getImageUrl = (fileName) => {
  if (!fileName) {
    return null;
  }

  if (fileName.startsWith('http')) {
    return fileName;
  }

  let path = fileName;
  if (!path.startsWith('kayak/')) {
    path = `kayak/${path}`;
  }

  return `https://storage.googleapis.com/${BUCKET_NAME}/${path}`;
};

export const getEntityImageUrl = (entityType, entityId, version = null) => {
  if (!entityId) {
    return null;
  }

  if (version) {
    const match = version.toString().match(/^(\d+)\.(\w+)$/);
    if (match) {
      const [, ver, ext] = match;
      return getImageUrl(getImagePath(entityType, entityId, parseInt(ver, 10), ext));
    }
  }

  return null;
};
