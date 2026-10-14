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
