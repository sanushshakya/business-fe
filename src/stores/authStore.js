import { create } from 'zustand';

const STORAGE_KEY = 'auth_tokens';

const loadTokens = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { accessToken: stored?.accessToken ?? null, refreshToken: stored?.refreshToken ?? null };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
};

const saveTokens = (tokens) => {
  try {
    if (tokens) localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable (private mode); the session then lasts until reload.
  }
};

/**
 * Zustand store holding the JWT pair returned by the backend's `/auth/login/` and `/auth/token/refresh/`.
 *
 * Refresh tokens are single use, so the newest pair must always be stored via `setTokens`.
 */
const useAuthStore = create((set) => ({
  ...loadTokens(),

  setTokens: ({ access_token: accessToken, refresh_token: refreshToken }) => {
    saveTokens({ accessToken, refreshToken });
    set({ accessToken, refreshToken });
  },

  clearTokens: () => {
    saveTokens(null);
    set({ accessToken: null, refreshToken: null });
  },
}));

export default useAuthStore;
export { useAuthStore };
