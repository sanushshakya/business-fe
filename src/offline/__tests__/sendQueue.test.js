import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { initRxDB } from '../../offlineDB';
import { listQueued, queueSale, voidQueued } from '../salesQueue';
import { OFFLINE_SALES_URL, sendOfflineSales, toPayload } from '../sendQueue';

let db;
beforeEach(async () => {
  db = await initRxDB({ name: `t${Math.random().toString(36).slice(2)}`, storage: getRxStorageMemory() });
});
afterEach(async () => {
  await db?.destroy();
  db = null;
});

const where = { tillId: 3, branchCode: 'HS', tillNumber: 1 };
const sale = (n, extra = {}) => ({
  client_ref: `ref-${n}`,
  created_at: new Date(Date.UTC(2026, 10, 4, 12, n)).toISOString(),
  session: 9,
  cashier: 7,
  body: {
    session: 9,
    payment_method: 'cash',
    amount_tendered: '20.00',
    client_ref: `ref-${n}`,
    items: [{ product: 1, quantity: 2 }, { barcode: '2100421005129' }],
  },
  receipt: {
    total: '9.60',
    items: [
      { product: 1, quantity: 2, line_total: '5.00', weight_kg: null },
      { product: 4, quantity: 1, line_total: '4.60', weight_kg: '0.512' },
    ],
  },
  ...extra,
});
const answer = (results) => ({ data: { results } });

describe('sending the offline queue (G28)', () => {
  it('maps a queued sale to what the server takes: charged from the receipt, the product on every line', async () => {
    const queued = await queueSale(db, { sale: sale(1, { card_auth_code: 'A1B2C3' }), ...where });
    expect(toPayload(queued)).toEqual({
      client_ref: 'ref-1',
      offline_number: queued.offline_number,
      created_at: queued.created_at,
      session: 9,
      cashier: 7,
      payment_method: 'cash',
      amount_tendered: '20.00',
      card_auth_code: 'A1B2C3',
      loyalty_barcode: '',
      items: [
        { product: 1, quantity: 2, charged: '5.00' },
        { product: 4, barcode: '2100421005129', weight_kg: '0.512', charged: '4.60' },
      ],
    });
  });

  it('sends oldest first, deletes what the server recorded and keeps what it could not', async () => {
    await queueSale(db, { sale: sale(3), ...where });
    await queueSale(db, { sale: sale(1), ...where });
    await queueSale(db, { sale: sale(2), ...where });
    const post = vi.fn().mockResolvedValue(
      answer([
        { client_ref: 'ref-1', status: 'recorded', exceptions: [] },
        { client_ref: 'ref-2', status: 'duplicate', exceptions: [] },
        { client_ref: 'ref-3', status: 'error', detail: 'Fake: no VAT rate', exceptions: [] },
      ])
    );
    expect(await sendOfflineSales(db, post)).toEqual({ sent: 2, failed: 1 });
    expect(post).toHaveBeenCalledWith(OFFLINE_SALES_URL, { sales: expect.any(Array) });
    expect(post.mock.calls[0][1].sales.map((s) => s.client_ref)).toEqual(['ref-1', 'ref-2', 'ref-3']);
    const left = await listQueued(db, 3);
    expect(left.map((s) => [s.client_ref, s.error])).toEqual([['ref-3', 'Fake: no VAT rate']]);
  });

  it('sends a sale voided offline with its void', async () => {
    await queueSale(db, { sale: sale(1), ...where });
    await voidQueued(db, 'ref-1', 'Fake: wrong item', 7);
    const post = vi.fn().mockResolvedValue(answer([{ client_ref: 'ref-1', status: 'recorded', exceptions: [] }]));
    await sendOfflineSales(db, post);
    expect(post.mock.calls[0][1].sales[0].void).toEqual({
      reason: 'Fake: wrong item',
      voided_at: expect.any(String),
      voided_by: 7,
    });
  });

  it('keeps everything when the server cannot be reached', async () => {
    await queueSale(db, { sale: sale(1), ...where });
    const post = vi.fn().mockRejectedValue(new Error('Network Error'));
    await expect(sendOfflineSales(db, post)).rejects.toThrow('Network Error');
    expect(await listQueued(db, 3)).toHaveLength(1);
    post.mockRejectedValue({ response: { status: 502 } });
    await expect(sendOfflineSales(db, post)).rejects.toEqual({ response: { status: 502 } });
    expect((await listQueued(db, 3))[0].error).toBeUndefined();
  });

  it('marks the batch when the server refuses the request itself, and skips marked sales next time', async () => {
    await queueSale(db, { sale: sale(1), ...where });
    const post = vi.fn().mockRejectedValue({ response: { status: 400 } });
    expect(await sendOfflineSales(db, post)).toEqual({ sent: 0, failed: 1 });
    expect((await listQueued(db, 3))[0].error).toBe('Refused by the server (400)');
    post.mockClear();
    expect(await sendOfflineSales(db, post)).toEqual({ sent: 0, failed: 0 });
    expect(post).not.toHaveBeenCalled();
  });

  it('sends in batches of 100', async () => {
    for (let n = 1; n <= 101; n += 1) await queueSale(db, { sale: sale(n), ...where });
    const post = vi.fn((url, { sales }) =>
      Promise.resolve(answer(sales.map((s) => ({ client_ref: s.client_ref, status: 'recorded', exceptions: [] }))))
    );
    expect(await sendOfflineSales(db, post)).toEqual({ sent: 101, failed: 0 });
    expect(post.mock.calls.map((call) => call[1].sales.length)).toEqual([100, 1]);
    expect(await listQueued(db, 3)).toEqual([]);
  });

  it('does nothing when the queue is empty', async () => {
    const post = vi.fn();
    expect(await sendOfflineSales(db, post)).toEqual({ sent: 0, failed: 0 });
    expect(post).not.toHaveBeenCalled();
  });
});
