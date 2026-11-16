import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clientInfo, timezoneOffset } from '../hmrcFraud';

describe('hmrcFraud', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('keeps one device id per browser, and makes a new one when it is cleared', () => {
    const first = clientInfo().device_id;
    expect(first).toMatch(/^[0-9a-f-]{36}$/);
    expect(clientInfo().device_id).toBe(first);
    window.localStorage.clear();
    expect(clientInfo().device_id).not.toBe(first);
  });

  it('writes the time zone as UTC±hh:mm', () => {
    expect(timezoneOffset(-60)).toBe('UTC+01:00');
    expect(timezoneOffset(0)).toBe('UTC+00:00');
    expect(timezoneOffset(75)).toBe('UTC-01:15');
    expect(timezoneOffset(-330)).toBe('UTC+05:30');
  });

  it('reports the screen, window and user agent', () => {
    vi.spyOn(window, 'screen', 'get').mockReturnValue({ width: 2560, height: 1440, colorDepth: 30 });
    vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(2);
    const info = clientInfo();
    expect(info.screens).toEqual([{ width: 2560, height: 1440, scaling_factor: 2, colour_depth: 30 }]);
    expect(info.window.width).toBeGreaterThan(0);
    expect(info.user_agent).toBe(window.navigator.userAgent);
    expect(info.timezone).toMatch(/^UTC[+-]\d\d:\d\d$/);
    expect(info.web_version).toBeTruthy();
  });

  it('rounds a zoomed scaling factor to 3 places', () => {
    vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(1.100000023841858);
    expect(clientInfo().screens[0].scaling_factor).toBe(1.1);
  });

  it('still works when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(clientInfo().device_id).toMatch(/^[0-9a-f-]{36}$/);
  });
});
