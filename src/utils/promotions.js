// src/utils/promotions.js

/**
 * Till promotions (G58): a line-for-line port of the backend's `promotions/engine.py`, run against the same fixtures
 * (`promotion_fixtures.json`), so a basket gets the same discounts online (where the server prices it) and offline
 * (where this does). Money is whole pence; percents and deal prices come as the server's decimal text.
 *
 * - A line is units of one product at one price (`grossCents / quantity`); a weighed line is one unit. Scanned-label
 *   lines are never discounted, weighed lines only by `category_percent`.
 * - Each unit is used by one promotion. By priority, highest first; within a priority the one saving most goes first
 *   (then the lower id), as many times as it can. Units are matched most expensive first, then basket order; a deal
 *   applies only when it saves money.
 * - `stacks` (% off only) apply afterwards on what is left of each line, at most one per line.
 * - A deal's saving is spread over its units by price (largest remainder, ties to the earlier unit); a percent is
 *   per line, half-up.
 */
import { divideHalfUp, toUnits } from './barcodes/decimal';

const PERCENT = 'category_percent';

const unitsOf = (lines) => {
  const units = [];
  lines.forEach((line, index) => {
    if (line.label) return;
    const unit = { line: index, product: line.product, category: line.category ?? null, weighed: !!line.weighed };
    if (line.weighed) {
      units.push({ ...unit, order: units.length, pence: line.grossCents, used: false });
      return;
    }
    const each = line.quantity ? Math.floor(line.grossCents / line.quantity) : 0;
    for (let n = 0; n < line.quantity; n += 1) units.push({ ...unit, order: units.length, pence: each, used: false });
  });
  return units;
};

const byPrice = (units) => [...units].sort((a, b) => b.pence - a.pence || a.order - b.order);
const sum = (units) => units.reduce((total, unit) => total + unit.pence, 0);

/** `saving` pence over `units` by price: `[[unit, pence]]`, summing exactly to `saving`. */
const spread = (saving, units) => {
  const total = sum(units);
  const shares = units.map((unit) => ({
    unit,
    share: Math.floor((saving * unit.pence) / total),
    rest: (saving * unit.pence) % total,
  }));
  const spare = saving - shares.reduce((acc, s) => acc + s.share, 0);
  const ranked = shares
    .map((_, i) => i)
    .sort((a, b) => shares[b].rest - shares[a].rest || shares[a].unit.order - shares[b].unit.order);
  const extra = new Set(ranked.slice(0, spare));
  return shares.map((s, i) => [s.unit, s.share + (extra.has(i) ? 1 : 0)]);
};

const planSets = (promotion, units) => {
  const free = units.filter((u) => !u.used && !u.weighed && promotion.products.includes(u.product));
  const multi = promotion.kind === 'multi_buy';
  const size = multi ? promotion.buy_quantity : promotion.buy_quantity + promotion.get_quantity;
  const ranked = byPrice(free);
  const sets = [];
  for (let start = 0; start + size <= ranked.length; start += size) {
    const chosen = ranked.slice(start, start + size);
    const saving = multi
      ? sum(chosen) - toUnits(promotion.deal_price, 2)
      : sum(chosen.slice(size - promotion.get_quantity)); // the cheapest are free
    if (saving <= 0) break; // later sets are cheaper still
    sets.push([chosen, saving]);
  }
  return sets;
};

const planMealDeals = (promotion, units) => {
  const taken = new Set();
  const sets = [];
  for (;;) {
    const chosen = [];
    for (const group of promotion.groups) {
      const candidate = byPrice(units).find(
        (u) => !u.used && !u.weighed && !taken.has(u.order) && group.includes(u.product)
      );
      if (!candidate) return sets;
      chosen.push(candidate);
    }
    const saving = sum(chosen) - toUnits(promotion.deal_price, 2);
    if (saving <= 0) return sets;
    chosen.forEach((u) => taken.add(u.order));
    sets.push([chosen, saving]);
  }
};

const percentOf = (pence, percent) => divideHalfUp(pence * toUnits(percent, 2), 10000);

const planPercent = (promotion, units) => {
  const byLine = new Map();
  for (const unit of units) {
    if (!unit.used && promotion.categories.includes(unit.category)) {
      byLine.set(unit.line, [...(byLine.get(unit.line) ?? []), unit]);
    }
  }
  return [...byLine.values()]
    .map((lineUnits) => [lineUnits, percentOf(sum(lineUnits), promotion.percent)])
    .filter(([, saving]) => saving > 0);
};

const plan = (promotion, units) => {
  if (promotion.kind === PERCENT) return planPercent(promotion, units);
  if (promotion.kind === 'meal_deal') return planMealDeals(promotion, units);
  return planSets(promotion, units);
};

const savingOf = (plans) => plans.reduce((total, [, saving]) => total + saving, 0);

/**
 * @param lines `[{key, product, category, quantity, grossCents, weighed?, label?}]`
 * @param promotions the catalogue's promotions in force here today (`activePromotions`)
 * @returns `{discounts: {key: cents}, applied: [{promotion, name, kind, times, savingCents}]}`
 */
export function applyPromotions(lines, promotions = []) {
  const units = unitsOf(lines);
  const off = lines.map(() => 0);
  const applied = [];
  const stacks = (p) => p.kind === PERCENT && p.stacks;
  const plain = promotions.filter((p) => !stacks(p));
  const priorities = [...new Set(plain.map((p) => p.priority))].sort((a, b) => b - a);
  for (const priority of priorities) {
    const waiting = plain.filter((p) => p.priority === priority);
    while (waiting.length) {
      const [promotion, plans] = waiting
        .map((p) => [p, plan(p, units)])
        .sort((a, b) => savingOf(b[1]) - savingOf(a[1]) || a[0].id - b[0].id)[0];
      if (!plans.length) break;
      waiting.splice(waiting.indexOf(promotion), 1);
      for (const [chosen, saving] of plans) {
        if (promotion.kind === PERCENT) off[chosen[0].line] += saving;
        else for (const [unit, share] of spread(saving, chosen)) off[unit.line] += share;
        chosen.forEach((unit) => {
          unit.used = true;
        });
      }
      applied.push({
        promotion: promotion.id,
        name: promotion.name,
        kind: promotion.kind,
        times: plans.length,
        savingCents: savingOf(plans),
      });
    }
  }

  const stacking = promotions
    .filter(stacks)
    .sort((a, b) => b.priority - a.priority || toUnits(b.percent, 2) - toUnits(a.percent, 2) || a.id - b.id);
  const stacked = new Map();
  lines.forEach((line, index) => {
    if (line.label) return;
    const promotion = stacking.find((p) => p.categories.includes(line.category ?? null));
    if (!promotion) return;
    const saving = percentOf(line.grossCents - off[index], promotion.percent);
    if (saving <= 0) return;
    off[index] += saving;
    const [times, total] = stacked.get(promotion) ?? [0, 0];
    stacked.set(promotion, [times + 1, total + saving]);
  });
  for (const promotion of stacking) {
    if (!stacked.has(promotion)) continue;
    const [times, total] = stacked.get(promotion);
    applied.push({ promotion: promotion.id, name: promotion.name, kind: promotion.kind, times, savingCents: total });
  }

  const discounts = {};
  lines.forEach((line, index) => {
    if (off[index]) discounts[line.key] = off[index];
  });
  return { discounts, applied };
}

/** The catalogue's promotions in force at `branchId` on the UK day `day` ('YYYY-MM-DD'). */
export const activePromotions = (promotions, branchId, day) =>
  (promotions ?? []).filter(
    (p) =>
      p.starts_on <= day &&
      (p.ends_on === null || p.ends_on === undefined || p.ends_on >= day) &&
      (!p.branches?.length || p.branches.includes(branchId))
  );

/**
 * The basket's promotions (G58): `lines` are `useCart` lines, `products` the catalogue's, `promotions` those in force
 * (`activePromotions`). Returns the engine's answer keyed by `lineKey`, plus `savingCents`. Online the server prices
 * the sale again; offline this is what is charged.
 */
export function basketPromotions(lines, products, promotions) {
  if (!promotions?.length || !lines.length) return { discounts: {}, applied: [], savingCents: 0 };
  const categories = new Map((products ?? []).map((product) => [product.id, product.category ?? null]));
  const result = applyPromotions(
    lines.map((line) => ({
      key: line.key ?? line.product,
      product: line.product,
      category: categories.get(line.product) ?? null,
      quantity: line.quantity,
      grossCents: line.unitCents * line.quantity,
      weighed: line.weightKg !== undefined && line.weightKg !== null,
      label: Boolean(line.barcode),
    })),
    promotions
  );
  return { ...result, savingCents: result.applied.reduce((total, a) => total + a.savingCents, 0) };
}
