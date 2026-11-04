// src/offline/catalogue.js

/**
 * The till catalogue in RxDB (G26, ADR 0001): what `GET /sales/catalogue/` sent, kept so the till finds and prices
 * products when the server can't be reached.
 *
 * - A full answer replaces every product; a delta upserts the changed ones and drops `removed`.
 * - An answer whose cursor is older than the one stored is ignored (a slow refresh must not roll the cache back).
 * - The cache belongs to one user of one company (`owner`): an answer for anyone else wipes it first, and a delta
 *   that can't be applied (wiped, or nothing cached) returns `needsFull` so the caller asks for everything.
 */

const META = 'catalogue';
const sessionKey = (tillId) => `session:${tillId}`;
const time = (cursor) => Date.parse(cursor);

async function readMeta(db, key) {
  const doc = await db.catalogueMeta.findOne(key).exec();
  return doc ? doc.toJSON().value ?? null : null;
}

/** Drop the whole catalogue and the cached sessions. */
export async function clearCatalogue(db) {
  await db.catalogueProducts.find().remove();
  await db.catalogueMeta.find().remove();
}

/** @returns {Promise<{applied: boolean, needsFull: boolean}>} */
export async function applyCatalogue(db, body) {
  const owner = { user: body.user, company: body.company };
  let meta = await readMeta(db, META);
  if (meta && (meta.owner?.user !== owner.user || meta.owner?.company !== owner.company)) {
    await clearCatalogue(db);
    meta = null;
  }
  if (meta && time(body.cursor) < time(meta.cursor)) return { applied: false, needsFull: false };
  if (!body.full && !meta) return { applied: false, needsFull: true };

  const docs = body.products.map((product) => ({ id: String(product.id), data: product }));
  if (body.full) {
    const keep = new Set(docs.map((doc) => doc.id));
    const existing = await db.catalogueProducts.find().exec();
    await db.catalogueProducts.bulkRemove(existing.map((doc) => doc.id).filter((id) => !keep.has(id)));
  } else if (body.removed.length) {
    await db.catalogueProducts.bulkRemove(body.removed.map(String));
  }
  if (docs.length) await db.catalogueProducts.bulkUpsert(docs);
  await db.catalogueMeta.upsert({
    key: META,
    value: {
      cursor: body.cursor,
      refreshedAt: Date.now(),
      owner,
      vatRates: body.vat_rates,
      barcodeRules: body.barcode_rules,
      tills: body.tills,
      branches: body.branches,
      settings: body.settings,
    },
  });
  return { applied: true, needsFull: false };
}

/** @returns {Promise<{products: object[], meta: object|null}>} */
export async function readCatalogue(db) {
  const docs = await db.catalogueProducts.find().exec();
  return { products: docs.map((doc) => doc.toJSON().data), meta: await readMeta(db, META) };
}

/** The open session last seen for a till (null: none open), for when the server can't be asked. */
export async function saveSession(db, tillId, session) {
  await db.catalogueMeta.upsert({ key: sessionKey(tillId), value: session ?? null });
}

export const readSession = (db, tillId) => readMeta(db, sessionKey(tillId));
