import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  // In production, set `VITE_API_BASE_URL` (e.g. `https://your-backend.onrender.com/api`)
  baseURL: (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/$/, ''),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle errors globally
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    console.error('API Error:', errorMessage);
    return Promise.reject(error);
  }
);

export default api;
