// src/utils/axios.js

import axios from 'axios';
import useAuthStore from '../stores/authStore';
import { isRejection } from './http';

const baseURL = import.meta.env?.VITE_API_URL ?? '';

const instance = axios.create({ baseURL, timeout: 10000 });

// Refresh tokens are single use, so concurrent 401s must share one refresh request.
let refreshPromise = null;

const REFRESH_TIMEOUT_MS = 10000; // a server that accepts and then hangs must not hold every later request

export const refreshTokens = () => {
  if (!refreshPromise) {
    const { refreshToken, setTokens } = useAuthStore.getState();
    if (!refreshToken) return Promise.reject(new Error('No refresh token'));
    refreshPromise = axios
      .post(`${baseURL}/auth/token/refresh/`, { refresh_token: refreshToken }, { timeout: REFRESH_TIMEOUT_MS })
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

/**
 * Refresh the tokens; only the server refusing the refresh (a 4xx) ends the session. No answer or a 5xx is an
 * outage: a till keeps its session (and its queued sales) and refreshes again when the server is back (ADR 0001).
 */
export const refreshOrSignOut = () =>
  refreshTokens().catch((error) => {
    if (isRejection(error)) useAuthStore.getState().clearTokens();
    throw error;
  });

instance.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// Sign-in calls answer 401 for a wrong or expired credential/challenge; that is never fixed by a refresh.
const SIGN_IN_URL = /^\/auth\/(login|code-login|2fa\/verify|token\/refresh)\/$/;

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || !original || original._retry) return Promise.reject(error);
    // Nothing to refresh (e.g. mid sign-in): let the caller see the real 401.
    if (original.skipAuthRefresh || SIGN_IN_URL.test(original.url) || !useAuthStore.getState().refreshToken) {
      return Promise.reject(error);
    }
    original._retry = true;

    const accessToken = await refreshOrSignOut();
    original.headers.Authorization = `Bearer ${accessToken}`;
    return instance(original);
  }
);

export default instance;
