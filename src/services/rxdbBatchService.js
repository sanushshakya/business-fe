/**
 * @module src/services/rxdbBatchService.js
 * Service to handle batching of RxDB records and sending over WebSocket with error handling.
 */

import { Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

const BATCH_SIZE = 10;

// Subject to push batch data
const batchSubject = new Subject();

/**
 * Batches RxDB records and emits them via the batchSubject.
 *
 * @param {Array} records - Array of RxDB records to be batched.
 */
export const batchRecords = (records) => {
  if (!records || records.length === 0) return;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    batchSubject.next(batch);
  }
};

/**
 * Observable to listen for batches of RxDB records.
 *
 * @returns {Observable} - Observable emitting batches of RxDB records.
 */
export const observeBatches = () => {
  return batchSubject.pipe(
    filter((batch) => batch.length > 0),
    map((batch) => ({
      timestamp: new Date(),
      data: batch,
    }))
  );
};

/**
 * Service to send batches over WebSocket with error handling.
 *
 * @param {WebSocket} socket - WebSocket instance to use for sending batches.
 */
export const sendBatchesOverWebSocket = (socket) => {
  observeBatches().subscribe({
    next(batch) {
      if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(JSON.stringify(batch));
        } catch (error) {
          console.error('Error sending batch over WebSocket:', error);
        }
      }
    },
    error(err) {
      console.error('WebSocket error:', err);
    },
    complete() {
      console.log('Batch sending completed');
    }
  });
};