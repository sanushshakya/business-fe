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
    const line = { product: item.product ?? printed.product, ...item, charged: printed.line_total };
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

/** @returns {Promise<{sent: number, failed: number}>} — rejects when the server can't be reached (nothing lost). */
export async function sendOfflineSales(db, post) {
  const docs = (await db.offlineSales.find().exec())
    .filter((doc) => !doc.toJSON().data.error)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  let sent = 0;
  let failed = 0;
  for (let start = 0; start < docs.length; start += BATCH) {
    const batch = docs.slice(start, start + BATCH);
    const byRef = Object.fromEntries(batch.map((doc) => [doc.id, doc]));
    let results;
    try {
      ({ results } = (
        await post(OFFLINE_SALES_URL, {
          sales: batch.map((doc) => toPayload({ ...doc.toJSON().data, status: doc.status })),
        })
      ).data);
    } catch (error) {
      // Offline, server trouble, or not signed in (401/403: the sender's problem, not the sales'): keep everything
      // unmarked for next time.
      if (!isRejection(error) || [401, 403].includes(error.response.status)) throw error;
      await Promise.all(batch.map((doc) => markError(doc, `Refused by the server (${error.response.status})`)));
      failed += batch.length;
      continue;
    }
    for (const result of results) {
      const doc = byRef[result.client_ref];
      if (!doc) continue;
      if (result.status === 'error') {
        await markError(doc, result.detail || 'Not recorded');
        failed += 1;
      } else {
        await doc.remove();
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
