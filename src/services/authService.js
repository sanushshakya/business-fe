// src/services/authService.js

/**
 * @module authService
 * @description Service for handling authentication actions like login and refresh token.
 */

import axios from '../utils/axios';

/**
 * Logs in a user and stores the access token in memory and the refresh token in an httpOnly cookie.
 *
 * @async
 * @function login
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 * @returns {Promise<Object>} A promise that resolves with the response from the server or rejects with an error.
 */
export const login = async (email, password) => {
  try {
    const response = await axios.post('/api/auth/login', { email, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Refreshes the access token using the refresh token stored in an httpOnly cookie.
 *
 * @async
 * @function refreshToken
 * @returns {Promise<Object>} A promise that resolves with the new access token or rejects with an error.
 */
export const refreshToken = async () => {
  try {
    const response = await axios.post('/api/auth/refresh-token');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Logs out a user by clearing the memory and cookie storage.
 *
 * @function logout
 */
export const logout = () => {
  // Clearing memory store
  localStorage.removeItem('accessToken');

  // Clearing httpOnly cookie
  document.cookie.split(';').forEach((cookie) => {
    document.cookie = cookie.replace(/^ +/, '').replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
  });
};

/**
 * Registers a new user.
 *
 * @async
 * @function register
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 * @param {string} [name] - The user's name (optional).
 * @returns {Promise<Object>} A promise that resolves with the response from the server or rejects with an error.
 */
export const register = async (email, password, name) => {
  try {
    const response = await axios.post('/api/auth/register', { email, password, name });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Fetches inventory data from the API.
 *
 * @async
 * @function fetchInventoryData
 * @param {number} [page=1] - The current page number for pagination.
 * @param {number} [pageSize=10] - The number of items per page.
 * @returns {Promise<Object>} A promise that resolves with the inventory data or rejects with an error.
 */
export const fetchInventoryData = async (page = 1, pageSize = 10) => {
  try {
    const response = await axios.get('/api/inventory/stock/levels', {
      params: { page, pageSize },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};