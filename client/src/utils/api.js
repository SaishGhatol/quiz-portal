import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL,
});

// Improved request interceptor with better token validation
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // Basic token validation - check if it exists and has a reasonable format
    if (token && token.split('.').length === 3) { // Simple JWT structure check
      config.headers.Authorization = `Bearer ${token}`;
    } else if (token) {
      // If token exists but doesn't look valid, clear it
      console.warn('Invalid token format detected, clearing token');
      localStorage.removeItem('token');
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Enhanced response interceptor with more detailed handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle token expiration or authentication issues
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        console.log('Authentication error:', data.message || 'Unknown auth error');
        
        // Clear token on any 401 error
        localStorage.removeItem('token');
        
        // Only redirect for specific cases to avoid redirect loops
        if (
          !window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/register')
        ) {
          // Use timeout to allow current code to finish execution
          setTimeout(() => {
            window.location.href = '/login?reason=session_expired';
          }, 100);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;