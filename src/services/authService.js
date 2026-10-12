// src/services/authService.js

import axios from '../utils/axios';
import useAuthStore from '../stores/authStore';

/**
 * Logs in with an email and password and stores the returned token pair.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<void>}
 */
export const login = async (email, password) => {
  const response = await axios.post('/auth/login/', { username: email, password });
  useAuthStore.getState().setTokens(response.data);
};

/**
 * Revokes the session on the server (best effort) and clears local tokens.
 */
export const logout = async () => {
  const { refreshToken, clearTokens } = useAuthStore.getState();
  try {
    if (refreshToken) await axios.post('/auth/logout/', { refresh_token: refreshToken });
  } catch {
    // The session is cleared locally regardless.
  } finally {
    clearTokens();
  }
};

export const isAuthenticated = () => Boolean(useAuthStore.getState().accessToken);

export default { login, logout, isAuthenticated };
