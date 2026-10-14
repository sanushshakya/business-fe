import { describe, expect, it } from 'vitest';
import { apiErrorMessage, isRejection } from '../http';

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

const failure = (data) => ({ response: { status: 400, data } });

describe('apiErrorMessage', () => {
  it('joins DRF field errors', () => {
    expect(
      apiErrorMessage(failure({ items: ['Dates: only 2 in date, 5 requested.'], amount_tendered: 'Too low.' }))
    ).toBe('Dates: only 2 in date, 5 requested. Too low.');
  });

  it('uses the backend message and detail shapes', () => {
    expect(
      apiErrorMessage(failure({ code: 'forbidden', message: 'Only staff can change this.', status_code: 403 }))
    ).toBe('Only staff can change this.');
    expect(apiErrorMessage(failure({ detail: 'This session is already closed.' }))).toBe(
      'This session is already closed.'
    );
  });

  it('falls back when there is nothing to show', () => {
    expect(apiErrorMessage(new Error('Network Error'), 'Offline?')).toBe('Offline?');
    expect(apiErrorMessage(failure({}), 'Nope')).toBe('Nope');
    expect(apiErrorMessage(failure('<html>'), 'Nope')).toBe('Nope');
    expect(apiErrorMessage(undefined)).toMatch(/something went wrong/i);
  });
});
