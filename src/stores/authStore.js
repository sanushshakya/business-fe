import create from 'zustand';
import axios from '../utils/axios';

/**
 * Zustand store for managing authentication state.
 *
 * @returns {Object} The authentication state and actions.
 */
const useAuthStore = create((set) => ({
  /**
   * JWT access token, stored in memory.
   *
   * @type {string|null}
   */
  accessToken: null,

  /**
   * JWT refresh token, stored in an httpOnly cookie.
   *
   * @type {string|null}
   */
  refreshToken: null,

  /**
   * Set the access token.
   *
   * @param {string} token - The new access token.
   */
  setAccessToken: (token) => {
    set({ accessToken: token });
  },

  /**
   * Set the refresh token.
   *
   * @param {string} token - The new refresh token.
   */
  setRefreshToken: (token) => {
    document.cookie = `refreshToken=${token}; path=/; SameSite=Strict`;
    set({ refreshToken: token });
  },

  /**
   * Remove both the access and refresh tokens.
   */
  clearTokens: () => {
    set({ accessToken: null, refreshToken: null });
    document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  },

  /**
   * Fetch a new access token using the refresh token.
   *
   * @returns {Promise} A promise that resolves when the new token is fetched.
   */
  refreshToken: async () => {
    try {
      const response = await axios.post('/api/auth/refresh-token');
      const newAccessToken = response.data.accessToken;
      set({ accessToken: newAccessToken });
      return Promise.resolve(newAccessToken);
    } catch (error) {
      set({ accessToken: null, refreshToken: null });
      document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      return Promise.reject(error);
    }
  },
}));

export default useAuthStore;