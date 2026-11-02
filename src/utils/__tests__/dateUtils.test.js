import { describe, expect, it } from 'vitest';
import { ukToday } from '../dateUtils';

describe('ukToday', () => {
  it('is the UK calendar day, not the UTC one', () => {
    expect(ukToday(new Date('2026-07-01T23:30:00Z'))).toBe('2026-07-02'); // BST: already tomorrow in London
    expect(ukToday(new Date('2026-12-01T23:30:00Z'))).toBe('2026-12-01'); // GMT
  });
});
