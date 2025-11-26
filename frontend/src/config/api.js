import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/${API_VERSION}`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const currentPath = window.location.pathname;
    
    // Handle 401 Unauthorized or 403 Forbidden (token issues)
    if (error.response?.status === 401 || error.response?.status === 403) {
      const message = error.response?.data?.message || '';
      
      // Check if it's a token-related error
      if (
        message.includes('Invalid or expired token') ||
        message.includes('Authentication token required') ||
        error.response?.status === 401
      ) {
        console.warn('⚠️ Token expired or invalid - clearing session');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        
        // Only redirect if not already on login/register page
        if (currentPath !== '/login' && currentPath !== '/register') {
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;

