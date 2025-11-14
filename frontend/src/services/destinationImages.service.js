import { getImageUrl } from './image.service.js';

const DESTINATION_IMAGES = {
  'Los Angeles': 'kayak/destinations/los-angeles.jpg',
  'Las Vegas': 'kayak/destinations/las-vegas.jpg',
  'San Diego': 'kayak/destinations/san-diego.jpg',
  'Reno': 'kayak/destinations/reno.jpg',
  'New York': 'kayak/destinations/new-york.jpg',
  'Miami': 'kayak/destinations/miami.jpg',
  'London': 'kayak/destinations/london.jpg',
  'Paris': 'kayak/destinations/paris.jpg',
  'Tokyo': 'kayak/destinations/tokyo.jpg',
  'Rome': 'kayak/destinations/rome.jpg',
  'Dubai': 'kayak/destinations/dubai.jpg',
  'Sydney': 'kayak/destinations/sydney.jpg',
};

export const getDestinationImageUrl = async (cityName) => {
  const imagePath = DESTINATION_IMAGES[cityName];
  if (!imagePath) {
    return null;
  }
  return await getImageUrl(imagePath);
};

export const getDestinationImageUrlSync = (cityName) => {
  const imagePath = DESTINATION_IMAGES[cityName];
  if (!imagePath) {
    return null;
  }
  return getImageUrl(imagePath);
};

export default DESTINATION_IMAGES;

