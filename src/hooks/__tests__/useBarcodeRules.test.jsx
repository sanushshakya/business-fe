import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from '../../utils/axios';
import useBarcodeRules, { RULES_URL } from '../useBarcodeRules';

vi.mock('../../utils/axios', () => ({ default: { get: vi.fn() } }));

const ROW = {
  id: 1,
  name: 'Fake price labels',
  prefix: '20',
  item_code_length: 5,
  value_type: 'price',
  decimals: 2,
  value_check_digit: false,
  value_length: 5,
  is_active: true,
};
const RULE = {
  prefix: '20',
  itemCodeLength: 5,
  valueType: 'price',
  decimals: 2,
  valueCheckDigit: false,
  isActive: true,
};
const KEY = 'barcodeRules:user-7';

const serve = ({ rules = [ROW], fail = false } = {}) =>
  axios.get.mockImplementation((url) => {
    if (url === '/auth/me/') return Promise.resolve({ data: { id: 7, company: 'Fake Foods Ltd' } });
    if (fail) return Promise.reject(new Error('Network Error'));
    return Promise.resolve({ data: { count: rules.length, next: null, previous: null, results: rules } });
  });

const render = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderHook(() => useBarcodeRules(), {
    wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('useBarcodeRules', () => {
  it('loads the active rules and keeps a copy for the company', async () => {
    serve();
    const { result } = render();
    await waitFor(() => expect(result.current.rules).toEqual([RULE]));
    expect(axios.get).toHaveBeenCalledWith(RULES_URL, expect.anything());
    expect(RULES_URL).toBe('/inventory/barcode-rules/?active=true');
    expect(JSON.parse(localStorage.getItem(KEY))).toEqual([ROW]);
    expect(result.current.fromCache).toBe(false);
  });

  it('uses the saved copy while the server is unreachable', async () => {
    localStorage.setItem(KEY, JSON.stringify([ROW]));
    serve({ fail: true });
    const { result } = render();
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.rules).toEqual([RULE]);
    expect(result.current.fromCache).toBe(true);
  });

  it('skips saved rows that are not rules', async () => {
    localStorage.setItem(KEY, JSON.stringify([null, 'x', ROW]));
    serve({ fail: true });
    const { result } = render();
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.rules).toEqual([RULE]);
  });

  it('ignores a corrupt saved copy', async () => {
    localStorage.setItem(KEY, '{not json');
    serve();
    const { result } = render();
    await waitFor(() => expect(result.current.rules).toEqual([RULE]));
  });

  it("never uses another user's saved copy (company names are not unique)", async () => {
    localStorage.setItem('barcodeRules:user-8', JSON.stringify([{ ...ROW, prefix: '29' }]));
    serve({ fail: true });
    const { result } = render();
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.rules).toEqual([]);
  });

  it('waits for who is signed in before asking for rules', async () => {
    let answerMe;
    axios.get.mockImplementation((url) =>
      url === '/auth/me/'
        ? new Promise((resolve) => {
            answerMe = resolve;
          })
        : Promise.resolve({ data: { results: [ROW], next: null } })
    );
    const { result } = render();
    expect(result.current.rules).toEqual([]);
    expect(axios.get).not.toHaveBeenCalledWith(RULES_URL, expect.anything());
    answerMe({ data: { id: 7, company: 'Fake Foods Ltd' } });
    await waitFor(() => expect(result.current.rules).toEqual([RULE]));
  });

  it('keeps working when storage is blocked', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    serve();
    const { result } = render();
    await waitFor(() => expect(result.current.rules).toEqual([RULE]));
    setItem.mockRestore();
  });
});
