// src/offline/sendQueue.js

/**
 * Sends the sales this browser kept offline (G27) to `POST /sales/offline-sales/` (G28), oldest first, 100 at a time.
 * What the server recorded (or already had) is deleted here, so no loyalty barcode or auth code stays in the browser;
 * a sale it could not record keeps its reason in `error` and is skipped until retried. No answer or a 5xx stops the
 * run and keeps everything for next time.
 */
import { isRejection } from '../utils/http';

export const OFFLINE_SALES_URL = '/sales/offline-sales/';
const BATCH = 100;

/** A queued sale as the server takes it: what was scanned or typed, the product read, and what was charged. */
export function toPayload(sale) {
  const { body, receipt } = sale;
  const items = body.items.map((item, index) => {
    const printed = receipt?.items?.[index] ?? {};
    const line = { ...item, product: item.product ?? printed.product, charged: printed.line_total };
    if (item.barcode && printed.weight_kg) line.weight_kg = printed.weight_kg; // the kg the till read off the label
    return line;
  });
  return {
    client_ref: sale.client_ref,
    offline_number: sale.offline_number,
    created_at: sale.created_at,
    session: sale.session,
    cashier: sale.cashier ?? null,
    payment_method: body.payment_method,
    ...(body.payment_method === 'cash' ? { amount_tendered: body.amount_tendered } : {}),
    card_auth_code: sale.card_auth_code ?? '',
    loyalty_barcode: body.loyalty_barcode ?? '',
    ...(sale.confirmed_at ? { confirmed_at: sale.confirmed_at } : {}),
    items,
    ...(sale.status === 'voided'
      ? { void: { reason: sale.void_reason ?? '', voided_at: sale.voided_at, voided_by: sale.voided_by ?? null } }
      : {}),
  };
}

const markError = (doc, error) => doc.patch({ data: { ...doc.toJSON().data, error } });

async function post100(post, docs) {
  return (
    await post(OFFLINE_SALES_URL, {
      sales: docs.map((doc) => toPayload({ ...doc.toJSON().data, status: doc.status })),
    })
  ).data.results;
}

/**
 * Send ``docs`` (one batch); a 400 for several sales is retried one by one, so only the bad sale is marked.
 * @returns {Promise<Array<{doc, result}>>} — each doc with its result, or with `refused` (the request's status).
 */
async function sendBatch(post, docs) {
  try {
    const results = await post100(post, docs);
    const byRef = Object.fromEntries(results.map((result) => [result.client_ref, result]));
    return docs.map((doc) => ({ doc, result: byRef[doc.id] }));
  } catch (error) {
    // Offline, server trouble, or not signed in (401/403: the sender's problem, not the sales'): keep everything
    // unmarked for next time.
    if (!isRejection(error) || [401, 403].includes(error.response.status)) throw error;
    if (docs.length > 1) {
      const answers = [];
      for (const doc of docs) answers.push(...(await sendBatch(post, [doc])));
      return answers;
    }
    return [{ doc: docs[0], refused: error.response.status }];
  }
}

/** @returns {Promise<{sent: number, failed: number}>} — rejects when the server can't be reached (nothing lost). */
export async function sendOfflineSales(db, post) {
  const docs = (await db.offlineSales.find().exec())
    .filter((doc) => !doc.toJSON().data.error)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  let sent = 0;
  let failed = 0;
  for (let start = 0; start < docs.length; start += BATCH) {
    for (const { doc, result, refused } of await sendBatch(post, docs.slice(start, start + BATCH))) {
      // Re-read it: the cashier may have voided it while it was being sent. Then it stays, and the void goes next.
      const now = await db.offlineSales.findOne(doc.id).exec();
      if (!now) continue;
      if (refused) {
        await markError(now, `Refused by the server (${refused})`);
        failed += 1;
      } else if (!result) {
        continue; // no answer for it: sent again next time (a duplicate then)
      } else if (result.status === 'error') {
        await markError(now, result.detail || 'Not recorded');
        failed += 1;
      } else if (now.revision === doc.revision) {
        await now.remove();
        sent += 1;
      }
    }
  }
  return { sent, failed };
}

/** Clear the error marks so those sales are sent again (after the problem has been fixed, e.g. a VAT rate added). */
export async function retrySalesWithErrors(db) {
  const docs = await db.offlineSales.find().exec();
  await Promise.all(
    docs
      .filter((doc) => doc.toJSON().data.error)
      .map((doc) => {
        const data = { ...doc.toJSON().data };
        delete data.error;
        return doc.patch({ data });
      })
  );
}
