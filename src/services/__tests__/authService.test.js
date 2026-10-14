import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from '../../utils/axios';
import useAuthStore from '../../stores/authStore';
import { login, loginWithCode, logout } from '../authService';

vi.mock('../../utils/axios', () => ({ default: { post: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  useAuthStore.getState().clearTokens();
});

describe('authService', () => {
  it('stores the tokens after an email sign-in', async () => {
    axios.post.mockResolvedValue({ data: { access_token: 'a', refresh_token: 'r' } });
    await login('x@y.test', 'pw');
    expect(axios.post).toHaveBeenCalledWith('/auth/login/', { username: 'x@y.test', password: 'pw' });
    expect(useAuthStore.getState().refreshToken).toBe('r');
  });

  it('signs a till user in by code and stores the tokens', async () => {
    axios.post.mockResolvedValue({ data: { access_token: 'a2', refresh_token: 'r2' } });
    await loginWithCode('12345678');
    expect(axios.post).toHaveBeenCalledWith('/auth/code-login/', { code: '12345678' });
    expect(useAuthStore.getState().accessToken).toBe('a2');
  });

  it('stores nothing when the code is refused', async () => {
    axios.post.mockRejectedValue({ response: { status: 400 } });
    await expect(loginWithCode('00000000')).rejects.toBeDefined();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('clears the session on logout even if the server cannot be reached', async () => {
    useAuthStore.getState().setTokens({ access_token: 'a', refresh_token: 'r' });
    axios.post.mockRejectedValue(new Error('down'));
    await logout();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
