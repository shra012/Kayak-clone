import { getImageUrl } from './image.service.js';

// Use Firebase storage paths when available, and fall back to stable CDN images
const DESTINATION_IMAGES = {
  'Los Angeles': {
    storagePath: 'kayak/destinations/los-angeles.jpg',
    fallbackUrl: 'https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=1200&q=80',
  },
  'Las Vegas': {
    storagePath: 'kayak/destinations/las-vegas.jpg',
    fallbackUrl: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80',
  },
  'San Diego': {
    storagePath: 'kayak/destinations/san-diego.jpg',
    fallbackUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
  },
  'Reno': {
    storagePath: 'kayak/destinations/reno.jpg',
    fallbackUrl: 'https://images.unsplash.com/photo-1534108392-94a232c27a4b?auto=format&fit=crop&w=1200&q=80',
  },
  'New York': {
    storagePath: 'kayak/destinations/new-york.jpg',
    fallbackUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80',
  },
  'Miami': {
    storagePath: 'kayak/destinations/miami.jpg',
    fallbackUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
  },
  'London': {
    storagePath: 'kayak/destinations/london.jpg',
    fallbackUrl: 'https://images.unsplash.com/photo-1439416915279-68957d86ad1e?auto=format&fit=crop&w=1200&q=80',
  },
  'Paris': {
    storagePath: 'kayak/destinations/paris.jpg',
    fallbackUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
  },
  'Tokyo': {
    storagePath: 'kayak/destinations/tokyo.jpg',
    fallbackUrl: 'https://images.unsplash.com/photo-1549692520-acc6669e2f0c?auto=format&fit=crop&w=1200&q=80',
  },
  'Rome': {
    storagePath: 'kayak/destinations/rome.jpg',
    fallbackUrl: 'https://images.unsplash.com/photo-1505764706515-aa95265c5abc?auto=format&fit=crop&w=1200&q=80',
  },
  'Dubai': {
    storagePath: 'kayak/destinations/dubai.jpg',
    fallbackUrl: 'https://images.unsplash.com/photo-1504274066651-8d31a536b11a?auto=format&fit=crop&w=1200&q=80',
  },
  'Sydney': {
    storagePath: 'kayak/destinations/sydney.jpg',
    fallbackUrl: 'https://images.unsplash.com/photo-1506976785307-8732e854ad89?auto=format&fit=crop&w=1200&q=80',
  },
};

const resolvePaths = (cityName) => {
  const entry = DESTINATION_IMAGES[cityName];
  if (!entry) return {};
  if (typeof entry === 'string') {
    return { storagePath: entry, fallbackUrl: null };
  }
  return entry;
};

export const getDestinationImageUrl = async (cityName) => {
  const { storagePath, fallbackUrl } = resolvePaths(cityName);
  if (!storagePath && !fallbackUrl) {
    return null;
  }

  if (storagePath) {
    try {
      return await getImageUrl(storagePath);
    } catch (error) {
      console.warn(`Failed to fetch ${cityName} image from storage, using fallback: ${error.message}`);
    }
  }

  return fallbackUrl || null;
};

export const getDestinationImageUrlSync = (cityName) => {
  const { storagePath, fallbackUrl } = resolvePaths(cityName);
  if (!storagePath && !fallbackUrl) {
    return null;
  }

  if (storagePath) {
    try {
      return getImageUrl(storagePath);
    } catch (error) {
      console.warn(`Failed to fetch ${cityName} image from storage, using fallback: ${error.message}`);
    }
  }

  return fallbackUrl || null;
};

export default DESTINATION_IMAGES;
