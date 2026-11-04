import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useAuthStore from '../../stores/authStore';
import instance, { refreshOrSignOut } from '../axios';

const respond = (status, data = {}) => Promise.resolve({ status, data, statusText: '', headers: {}, config: {} });
const reject = (config, status) =>
  Promise.reject(Object.assign(new Error(`HTTP ${status}`), { config, response: { status } }));

beforeEach(() => {
  vi.restoreAllMocks();
  useAuthStore.getState().setTokens({ access_token: 'old', refresh_token: 'r1' });
});

describe('axios instance', () => {
  it('sends the bearer token', async () => {
    let seen;
    instance.defaults.adapter = async (config) => {
      seen = config.headers.Authorization;
      return respond(200);
    };
    await instance.get('/x');
    expect(seen).toBe('Bearer old');
  });

  it('refreshes once on 401 (shared across concurrent requests) and retries', async () => {
    const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: { access_token: 'new', refresh_token: 'r2' } });
    const auth = [];
    instance.defaults.adapter = async (config) => {
      auth.push(config.headers.Authorization);
      return config.headers.Authorization === 'Bearer new' ? respond(200, { ok: true }) : reject(config, 401);
    };

    const results = await Promise.all([instance.get('/a'), instance.get('/b')]);

    expect(results.map((r) => r.data.ok)).toEqual([true, true]);
    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0][1]).toEqual({ refresh_token: 'r1' });
    expect(useAuthStore.getState().refreshToken).toBe('r2');
  });

  it('clears the session when the server refuses the refresh', async () => {
    vi.spyOn(axios, 'post').mockRejectedValue(Object.assign(new Error('expired'), { response: { status: 401 } }));
    instance.defaults.adapter = async (config) => reject(config, 401);
    await expect(instance.get('/a')).rejects.toThrow('expired');
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it("keeps the session when the refresh can't reach the server (G26: a till must not lose its queue)", async () => {
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('Network Error'));
    instance.defaults.adapter = async (config) => reject(config, 401);
    await expect(instance.get('/a')).rejects.toThrow('Network Error');
    expect(useAuthStore.getState().refreshToken).toBe('r1');
  });

  it('refreshOrSignOut (the status socket) follows the same rule', async () => {
    vi.spyOn(axios, 'post').mockRejectedValueOnce(new Error('Network Error'));
    await expect(refreshOrSignOut()).rejects.toThrow('Network Error');
    expect(useAuthStore.getState().refreshToken).toBe('r1');
    vi.spyOn(axios, 'post').mockRejectedValueOnce(Object.assign(new Error('gone'), { response: { status: 401 } }));
    await expect(refreshOrSignOut()).rejects.toThrow('gone');
    expect(useAuthStore.getState().refreshToken).toBeNull();
  });

  it('gives up on a refresh that hangs', async () => {
    const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: { access_token: 'new', refresh_token: 'r2' } });
    await refreshOrSignOut();
    expect(post.mock.calls[0][2]).toEqual(expect.objectContaining({ timeout: expect.any(Number) }));
  });

  it('keeps the session when the refresh gets a server error', async () => {
    vi.spyOn(axios, 'post').mockRejectedValue(Object.assign(new Error('HTTP 502'), { response: { status: 502 } }));
    instance.defaults.adapter = async (config) => reject(config, 401);
    await expect(instance.get('/a')).rejects.toThrow('HTTP 502');
    expect(useAuthStore.getState().refreshToken).toBe('r1');
  });

  it('does not refresh for non-401 errors', async () => {
    const post = vi.spyOn(axios, 'post');
    instance.defaults.adapter = async (config) => reject(config, 500);
    await expect(instance.get('/a')).rejects.toThrow('HTTP 500');
    expect(post).not.toHaveBeenCalled();
  });

  it('passes a 401 straight through when there is no session to refresh', async () => {
    useAuthStore.getState().clearTokens();
    const post = vi.spyOn(axios, 'post');
    instance.defaults.adapter = async (config) => reject(config, 401);
    const error = await instance.post('/auth/2fa/verify/', { challenge: 'c' }).catch((e) => e);
    expect(error.response.status).toBe(401);
    expect(post).not.toHaveBeenCalled();
  });

  it('never refreshes for sign-in calls, even with an older session stored', async () => {
    const post = vi.spyOn(axios, 'post');
    instance.defaults.adapter = async (config) => reject(config, 401);
    for (const call of [
      () => instance.post('/auth/login/', {}),
      () => instance.post('/auth/2fa/verify/', {}),
      () => instance.post('/auth/2fa/enrol/', { challenge: 'c' }, { skipAuthRefresh: true }),
    ]) {
      const error = await call().catch((e) => e);
      expect(error.response.status).toBe(401);
    }
    expect(post).not.toHaveBeenCalled();
    expect(useAuthStore.getState().refreshToken).toBe('r1');
  });
});
