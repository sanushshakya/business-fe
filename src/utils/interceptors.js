// src/utils/interceptors.js

import axios from 'axios';

/**
 * Creates an Axios instance with a base URL configured from environment variables and a JWT interceptor.
 * The interceptor attaches the access token to requests and handles 401 Unauthorized errors by refreshing the token.
 *
 * @returns {AxiosInstance} - An Axios instance configured with interceptors.
 */
export const createAxiosInstance = () => {
  // Create an axios instance
  const instance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  });

  // Add a request interceptor to attach the access token
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      Promise.reject(error);
    }
  );

  // Add a response interceptor to handle 401 errors
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If the error is due to an invalid token and not already attempting to refresh, attempt to refresh
      if (
        error.response.status === 401 &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true;

        try {
          const response = await axios.post(
            `${process.env.REACT_APP_API_URL}/auth/refresh`,
            { token: localStorage.getItem('refreshToken') }
          );

          // Store the new tokens in localStorage and retry the original request
          localStorage.setItem('accessToken', response.data.accessToken);
          localStorage.setItem('refreshToken', response.data.refreshToken);

          return instance(originalRequest);
        } catch (refreshError) {
          // If refreshing fails, clear tokens and redirect to login or show error message
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login'; // Adjust based on your authentication flow

          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};