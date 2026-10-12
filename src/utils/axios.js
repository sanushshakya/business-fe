// src/utils/axios.js

import axios from 'axios';
import useAuthStore from '../stores/authStore';

const baseURL = import.meta.env?.VITE_API_URL ?? '';

const instance = axios.create({ baseURL, timeout: 10000 });

// Refresh tokens are single use, so concurrent 401s must share one refresh request.
let refreshPromise = null;

const refreshTokens = () => {
  if (!refreshPromise) {
    const { refreshToken, setTokens } = useAuthStore.getState();
    if (!refreshToken) return Promise.reject(new Error('No refresh token'));
    refreshPromise = axios
      .post(`${baseURL}/auth/token/refresh/`, { refresh_token: refreshToken })
      .then((response) => {
        setTokens(response.data);
        return response.data.access_token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

instance.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || !original || original._retry) return Promise.reject(error);
    original._retry = true;

    try {
      const accessToken = await refreshTokens();
      original.headers.Authorization = `Bearer ${accessToken}`;
      return instance(original);
    } catch (refreshError) {
      useAuthStore.getState().clearTokens();
      return Promise.reject(refreshError);
    }
  }
);

export default instance;
