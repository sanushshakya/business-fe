// src/offline/salesQueue.js

/**
 * Sales made while the server could not be reached (G27, ADR 0001), kept in RxDB until G28 sends them.
 *
 * Each gets an offline receipt number `<branch code>-T<till>-<run>-<counter>` (e.g. `HS-T02-QK-000417`): the
 * counter is per till and only goes up; the run is two letters chosen when this device first numbers sales for that
 * till, so a wiped browser never reuses a number. A sale is keyed by its `client_ref`, the same one its online
 * attempt used, so the server can never book it twice.
 */

const RUN_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I or O (read as 1 and 0 on a receipt)
const queues = new WeakMap();

function oneAtATime(db, task) {
  const next = (queues.get(db) ?? Promise.resolve()).then(task, task);
  queues.set(
    db,
    next.catch(() => {})
  );
  return next;
}

const randomRun = () => {
  const values = new Uint32Array(2);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => RUN_LETTERS[value % RUN_LETTERS.length]).join('');
};

/** The branch part of an offline number: its code, or `B<id>` when it has none. */
export const branchPrefix = (branch) => branch?.code || `B${branch?.id ?? 0}`;

async function takeNumber(db, { tillId, branchCode, tillNumber }) {
  const id = String(tillId);
  let counter = await db.tillCounters.findOne(id).exec();
  if (!counter) counter = await db.tillCounters.insert({ id, next: 1, run: randomRun() });
  const { next, run } = counter.toJSON();
  await counter.patch({ next: next + 1 });
  return `${branchCode}-T${String(tillNumber).padStart(2, '0')}-${run}-${String(next).padStart(6, '0')}`;
}

/** The next offline receipt number for a till (taken: it is never handed out again). */
export const nextOfflineNumber = (db, where) => oneAtATime(db, () => takeNumber(db, where));

const asSale = (doc) => {
  const { data, status } = doc.toJSON();
  return { ...data, status };
};

/**
 * Queue `sale` (`{client_ref, created_at, session, cashier, body, receipt, ...}`) for till `tillId`; returns it with
 * its `offline_number` and `status: 'queued'`. A `client_ref` already queued returns the sale already there.
 */
export const queueSale = (db, { sale, ...where }) =>
  oneAtATime(db, async () => {
    const existing = await db.offlineSales.findOne(sale.client_ref).exec();
    if (existing) return asSale(existing);
    const offline_number = await takeNumber(db, where);
    const created_at = sale.created_at ?? new Date().toISOString();
    const doc = await db.offlineSales.insert({
      id: sale.client_ref,
      till: Number(where.tillId),
      createdAt: created_at,
      status: 'queued',
      data: { ...sale, created_at, offline_number },
    });
    return asSale(doc);
  });

/** This till's offline sales, newest first. */
export async function listQueued(db, tillId) {
  const docs = await db.offlineSales.find({ selector: { till: Number(tillId) } }).exec();
  return docs.map(asSale).sort((a, b) => b.created_at.localeCompare(a.created_at)); // ISO times sort as text
}

/** Void a sale still waiting to be sent: it stays in the queue, marked voided (G28 sends the sale, then the void). */
export const voidQueued = (db, clientRef, reason) =>
  oneAtATime(db, async () => {
    if (!String(reason ?? '').trim()) throw new Error('Say why it is being voided (a reason is needed).');
    const doc = await db.offlineSales.findOne(clientRef).exec();
    if (!doc) throw new Error('That sale is not waiting to be sent.');
    if (doc.status !== 'queued') throw new Error('That sale is already voided.');
    const voided_at = new Date().toISOString();
    await doc.patch({
      status: 'voided',
      data: { ...doc.toJSON().data, void_reason: String(reason).trim(), voided_at },
    });
  });

/** Ask the browser to keep this site's storage (true/false), or null when it can't be asked. */
export async function askPersistentStorage() {
  try {
    if (!navigator.storage?.persist) return null;
    if (await navigator.storage.persisted?.()) return true;
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}
