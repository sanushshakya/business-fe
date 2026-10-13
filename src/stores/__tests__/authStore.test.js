import { beforeEach, describe, expect, it } from 'vitest';
import useAuthStore from '../authStore';

beforeEach(() => {
  localStorage.clear();
  useAuthStore.getState().clearTokens();
});

describe('authStore', () => {
  it('stores and persists the token pair', () => {
    useAuthStore.getState().setTokens({ access_token: 'a', refresh_token: 'r' });
    expect(useAuthStore.getState()).toMatchObject({ accessToken: 'a', refreshToken: 'r' });
    expect(JSON.parse(localStorage.getItem('auth_tokens'))).toEqual({ accessToken: 'a', refreshToken: 'r' });
  });

  it('clears both state and storage', () => {
    useAuthStore.getState().setTokens({ access_token: 'a', refresh_token: 'r' });
    useAuthStore.getState().clearTokens();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(localStorage.getItem('auth_tokens')).toBeNull();
  });
});
