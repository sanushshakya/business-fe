// src/services/rxdbBatchService.js

import { Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export const BATCH_SIZE = 10;

const batchSubject = new Subject();
let pending = [];

/**
 * Splits records into batches of BATCH_SIZE, emits them on the batch stream and queues them
 * until `processBatch` drains the queue.
 */
export const batchRecords = (records) => {
  if (!records || records.length === 0) return;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    pending.push(batch);
    batchSubject.next(batch);
  }
};

/** Observable of `{timestamp, data}` for every non-empty batch. */
export const observeBatches = () =>
  batchSubject.pipe(
    filter((batch) => batch.length > 0),
    map((batch) => ({ timestamp: new Date(), data: batch }))
  );

/**
 * Hands every queued batch to `send(batch)` in order. A batch whose send fails stays queued
 * (with everything after it) and the error is rethrown.
 */
export const processBatch = async (send = async () => {}) => {
  while (pending.length > 0) {
    await send(pending[0]);
    pending.shift();
  }
};

export const pendingBatchCount = () => pending.length;

export const clearPending = () => {
  pending = [];
};

/** Forwards every batch to an open WebSocket. Returns the subscription so callers can unsubscribe. */
export const sendBatchesOverWebSocket = (socket) =>
  observeBatches().subscribe({
    next(batch) {
      if (socket.readyState !== WebSocket.OPEN) return;
      try {
        socket.send(JSON.stringify(batch));
      } catch (error) {
        console.error('Error sending batch over WebSocket:', error);
      }
    },
    error(err) {
      console.error('Batch stream error:', err);
    },
  });

/**
 * For each record whose UUID the server confirms, marks it synced.
 * Resolves once every record has been handled; failures are logged per record.
 */
export const updateSyncField = async (records, syncActions) => {
  if (!records?.length || !syncActions?.updateRecord || !syncActions?.confirmUUID) return;

  await Promise.all(
    records.map(async (record) => {
      try {
        if (await syncActions.confirmUUID(record.uuid)) {
          await syncActions.updateRecord(record, { synced: true });
        }
      } catch (error) {
        console.error('Error updating sync field for record', record.uuid, error);
      }
    })
  );
};

export default {
  batchRecords,
  observeBatches,
  processBatch,
  pendingBatchCount,
  clearPending,
  sendBatchesOverWebSocket,
  updateSyncField,
};
