import apiClient from '../../config/api';

export const listingsApi = {
  searchFlights: async (params = {}) => {
    const { data } = await apiClient.get('/flights/search', { params });
    return data;
  },

  getFlight: async (flightId) => {
    const { data } = await apiClient.get(`/flights/${flightId}`);
    return data;
  },

  searchHotels: async (params = {}) => {
    const { data } = await apiClient.get('/hotels/search', { params });
    return data;
  },

  getHotel: async (hotelId) => {
    const { data } = await apiClient.get(`/hotels/${hotelId}`);
    return data;
  },

  searchCars: async (params = {}) => {
    const { data } = await apiClient.get('/cars/search', { params });
    return data;
  },

  getCar: async (carId) => {
    const { data } = await apiClient.get(`/cars/${carId}`);
    return data;
  },
};

