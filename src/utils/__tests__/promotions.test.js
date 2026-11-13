import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import FIXTURES from '../promotion_fixtures.json';
import { activePromotions, applyPromotions } from '../promotions';
import { toUnits } from '../barcodes/decimal';

// The promotion fixtures are shared with the backend (business-iq `promotions/promotion_fixtures.json`); both repos
// pin the same SHA-256, so changing one copy fails here until the other is updated too.
const FIXTURES_SHA256 = '6d7bdc634267230fd9446c919bdb280dadd7ed62d7751a2830e0a773bf0ca171';
const FILE = resolve('src/utils/promotion_fixtures.json');
const BACKEND_COPY = resolve('../config/promotions/promotion_fixtures.json');

const pounds = (cents) => `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
const toLine = (row) => ({ ...row, grossCents: toUnits(row.gross, 2) });

describe('promotion engine (shared fixtures)', () => {
  it.each(FIXTURES.cases.map((c) => [c.name, c]))('%s', (_name, fixture) => {
    const result = applyPromotions(fixture.lines.map(toLine), fixture.promotions);
    const discounts = Object.fromEntries(Object.entries(result.discounts).map(([key, cents]) => [key, pounds(cents)]));
    expect(discounts).toEqual(fixture.expected.discounts);
    expect(
      result.applied.map((a) => ({ promotion: a.promotion, times: a.times, saving: pounds(a.savingCents) }))
    ).toEqual(fixture.expected.applied);
  });

  it('reports names and kinds', () => {
    const fixture = FIXTURES.cases.find((c) => c.name === 'meal_deal_one');
    const [applied] = applyPromotions(fixture.lines.map(toLine), fixture.promotions).applied;
    expect([applied.name, applied.kind]).toEqual(['Meal deal', 'meal_deal']);
  });

  it('match the pinned checksum', () => {
    const digest = createHash('sha256').update(readFileSync(FILE)).digest('hex');
    expect(
      digest,
      'promotion_fixtures.json changed: copy it from config/promotions/ and update both pinned hashes ' +
        `(this test and config promotions/tests/test_fixtures_checksum.py) to ${digest}.`
    ).toBe(FIXTURES_SHA256);
  });

  it.skipIf(!existsSync(BACKEND_COPY))('match the backend copy byte for byte', () => {
    expect(
      readFileSync(FILE).equals(readFileSync(BACKEND_COPY)),
      'copy config/promotions/promotion_fixtures.json here'
    ).toBe(true);
  });
});

describe('activePromotions', () => {
  const make = (id, fields) => ({ id, starts_on: '2026-06-01', ends_on: null, branches: [], ...fields });
  it('keeps the ones in force at this branch on this UK day', () => {
    const all = [
      make(1),
      make(2, { branches: [7] }),
      make(3, { branches: [8] }),
      make(4, { starts_on: '2026-06-11' }),
      make(5, { ends_on: '2026-06-09' }),
      make(6, { ends_on: '2026-06-10' }),
    ];
    expect(activePromotions(all, 7, '2026-06-10').map((p) => p.id)).toEqual([1, 2, 6]);
    expect(activePromotions(undefined, 7, '2026-06-10')).toEqual([]);
  });
});
