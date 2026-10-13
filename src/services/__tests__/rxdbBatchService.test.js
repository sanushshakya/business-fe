import { beforeEach, describe, expect, it, vi } from 'vitest';
import service, { BATCH_SIZE } from '../rxdbBatchService';

const records = (n) => Array.from({ length: n }, (_, i) => ({ uuid: String(i) }));

beforeEach(() => service.clearPending());

describe('rxdbBatchService', () => {
  it('splits records into batches of BATCH_SIZE and emits each one', () => {
    const seen = [];
    const sub = service.observeBatches().subscribe((b) => seen.push(b.data.length));
    service.batchRecords(records(BATCH_SIZE * 2 + 3));
    sub.unsubscribe();
    expect(seen).toEqual([BATCH_SIZE, BATCH_SIZE, 3]);
    expect(service.pendingBatchCount()).toBe(3);
  });

  it('ignores empty input', () => {
    service.batchRecords([]);
    service.batchRecords(null);
    expect(service.pendingBatchCount()).toBe(0);
  });

  it('processBatch drains the queue in order', async () => {
    service.batchRecords(records(BATCH_SIZE + 1));
    const send = vi.fn().mockResolvedValue();
    await service.processBatch(send);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0][0]).toHaveLength(BATCH_SIZE);
    expect(service.pendingBatchCount()).toBe(0);
  });

  it('keeps a batch queued when sending it fails', async () => {
    service.batchRecords(records(BATCH_SIZE + 1));
    const send = vi.fn().mockRejectedValueOnce(new Error('offline'));
    await expect(service.processBatch(send)).rejects.toThrow('offline');
    expect(service.pendingBatchCount()).toBe(2);
  });

  it('sends batches over an open socket only', () => {
    const socket = { readyState: WebSocket.OPEN, send: vi.fn() };
    const sub = service.sendBatchesOverWebSocket(socket);
    service.batchRecords(records(2));
    expect(socket.send).toHaveBeenCalledTimes(1);
    expect(JSON.parse(socket.send.mock.calls[0][0]).data).toHaveLength(2);

    socket.readyState = WebSocket.CLOSED;
    service.batchRecords(records(2));
    expect(socket.send).toHaveBeenCalledTimes(1);
    sub.unsubscribe();
  });

  it('marks only UUID-confirmed records as synced', async () => {
    const syncActions = {
      confirmUUID: vi.fn(async (uuid) => uuid === 'a'),
      updateRecord: vi.fn().mockResolvedValue(),
    };
    await service.updateSyncField([{ uuid: 'a' }, { uuid: 'b' }], syncActions);
    expect(syncActions.updateRecord).toHaveBeenCalledTimes(1);
    expect(syncActions.updateRecord).toHaveBeenCalledWith({ uuid: 'a' }, { synced: true });
  });

  it('survives a failing record', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const syncActions = {
      confirmUUID: vi.fn(async (uuid) => {
        if (uuid === 'bad') throw new Error('x');
        return true;
      }),
      updateRecord: vi.fn().mockResolvedValue(),
    };
    await service.updateSyncField([{ uuid: 'bad' }, { uuid: 'ok' }], syncActions);
    expect(syncActions.updateRecord).toHaveBeenCalledWith({ uuid: 'ok' }, { synced: true });
    vi.restoreAllMocks();
  });
});
