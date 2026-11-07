import { describe, expect, it } from 'vitest';
import { canOpen, navItemsFor, ROLE_HOME, ROLES } from '../roles';

describe('roles', () => {
  it('has a home inside its own area for every role', () => {
    for (const { value } of ROLES) {
      expect(canOpen(value, ROLE_HOME[value]), value).toBe(true);
    }
  });

  it('keeps each role to its own screens', () => {
    expect(canOpen('till', '/dashboard/pos')).toBe(true);
    expect(canOpen('till', '/dashboard/freight')).toBe(false);
    expect(canOpen('freight', '/dashboard/freight/')).toBe(true);
    expect(canOpen('freight', '/dashboard/team')).toBe(false);
    expect(canOpen('supplier', '/dashboard/pov/supplier')).toBe(true);
    expect(canOpen('demand', '/dashboard/pov/supplier')).toBe(false);
    expect(canOpen('stock', '/dashboard/team')).toBe(false);
  });

  it('gives stock controllers (and only them among operators) the transfer and requisition screens', () => {
    for (const path of ['/dashboard/transfers', '/dashboard/requisitions']) {
      expect(canOpen('stock', path)).toBe(true);
      expect(canOpen('', path)).toBe(true);
      for (const role of ['till', 'demand', 'freight', 'supplier'])
        expect(canOpen(role, path), `${role} ${path}`).toBe(false);
    }
  });

  it('gives stock controllers the butchery, write-off and yield-waste screens (G24)', () => {
    for (const path of ['/dashboard/breakdowns', '/dashboard/write-offs', '/dashboard/yield-waste']) {
      expect(canOpen('stock', path)).toBe(true);
      expect(canOpen('', path)).toBe(true);
      for (const role of ['till', 'demand', 'freight', 'supplier'])
        expect(canOpen(role, path), `${role} ${path}`).toBe(false);
    }
  });

  it('keeps the sync exceptions review for staff (G29)', () => {
    expect(canOpen('', '/dashboard/sync-exceptions')).toBe(true);
    for (const { value } of ROLES) expect(canOpen(value, '/dashboard/sync-exceptions'), value).toBe(false);
  });

  it('keeps the B2B office screens for staff (G46a)', () => {
    const paths = ['customers', 'price-lists', 'orders', 'invoices', 'credit-notes'].map((p) => `/dashboard/b2b/${p}`);
    for (const path of paths) {
      expect(canOpen('', path), path).toBe(true);
      for (const { value } of ROLES) expect(canOpen(value, path), `${value} ${path}`).toBe(false);
    }
  });

  it('opens everything for users without a role', () => {
    expect(canOpen('', '/dashboard/team')).toBe(true);
    expect(canOpen(undefined, '/dashboard/pos')).toBe(true);
    expect(navItemsFor('').length).toBeGreaterThan(10);
  });

  it('never lets an operator reach the admin screens', () => {
    for (const { value } of ROLES) {
      for (const path of ['/dashboard/team', '/dashboard/settings', '/dashboard/branches']) {
        expect(canOpen(value, path), `${value} ${path}`).toBe(false);
      }
    }
  });
});
