import { describe, expect, it } from 'vitest';
import { isRejection } from '../http';

const withStatus = (status) => ({ response: { status } });

describe('isRejection', () => {
  it('treats 4xx as a refusal', () => {
    for (const status of [400, 401, 403, 404, 409, 422]) expect(isRejection(withStatus(status))).toBe(true);
  });

  it('treats timeouts, rate limits and 5xx as retryable', () => {
    for (const status of [408, 429, 500, 502, 503, 504]) expect(isRejection(withStatus(status))).toBe(false);
  });

  it('treats a missing response (network failure) as retryable', () => {
    expect(isRejection(new Error('Network Error'))).toBe(false);
    expect(isRejection(undefined)).toBe(false);
  });
});
