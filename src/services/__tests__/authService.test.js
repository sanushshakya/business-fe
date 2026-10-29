import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from '../../utils/axios';
import useAuthStore from '../../stores/authStore';
import { confirmEnrolment, login, loginWithCode, logout } from '../authService';

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

describe('authService two-factor', () => {
  it('returns the challenge and stores no tokens when a second step is needed', async () => {
    axios.post.mockResolvedValue({ data: { two_factor: 'verify', challenge: 'ch', expires_in: 300 } });
    expect(await login('x@y.test', 'pw')).toEqual({ step: 'verify', challenge: 'ch' });
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('returns null after a plain sign-in', async () => {
    axios.post.mockResolvedValue({ data: { access_token: 'a', refresh_token: 'r' } });
    expect(await login('x@y.test', 'pw')).toBeNull();
  });

  it('stores tokens from a confirmed enrolment only when the server sends them', async () => {
    axios.post.mockResolvedValue({ data: { recovery_codes: ['a'] } });
    expect(await confirmEnrolment('123456')).toEqual(['a']);
    expect(axios.post).toHaveBeenCalledWith('/auth/2fa/enrol/confirm/', { code: '123456' });
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
