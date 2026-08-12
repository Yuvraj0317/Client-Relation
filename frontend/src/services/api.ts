import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Extract standard API payload & handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    let message = 'An unexpected network error occurred';

    if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.response?.data?.error?.message) {
      message = error.response.data.error.message;
    } else if (error.response?.status === 404) {
      message = 'Backend API server unavailable (HTTP 404). Please ensure backend process is running.';
    } else if (typeof error.response?.data === 'string' && error.response.data.includes('could not be found')) {
      message = 'Backend API endpoint not found. Please verify backend server is running.';
    } else if (error.message) {
      message = error.message;
    }

    return Promise.reject({ message });
  }
);

export default api;
