// src/utils/axios.js

import axios from 'axios';

/**
 * Creates an Axios instance with a base URL from environment variables and JWT interceptor.
 *
 * @returns {AxiosInstance} - The configured Axios instance.
 */
const createAxiosInstance = () => {
  // Create an Axios instance
  const instance = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    timeout: 10000, // Set a default timeout for requests
  });

  /**
   * Interceptor to attach the JWT access token to the request headers.
   */
  instance.interceptors.request.use(
    (config) => {
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  /**
   * Interceptor to handle 401 responses by refreshing the token and retrying the request.
   */
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Check if the request is already being retried
      if (originalRequest._retry) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token found.');
        }

        // Refresh the access token using a custom endpoint (e.g., /api/auth/refresh)
        const response = await axios.post(
          process.env.REACT_APP_API_URL + '/api/auth/refresh',
          { refreshToken },
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );

        // Update the access token in local storage
        localStorage.setItem('access_token', response.data.accessToken);

        // Retry the original request with the new access token
        originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
        return instance(originalRequest);
      } catch (refreshError) {
        // Handle refresh error, e.g., redirect to login page or show error message
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
  );

  return instance;
};

// Export the configured Axios instance
export default createAxiosInstance();