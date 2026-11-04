import { describe, expect, it } from 'vitest';
import { tokenUserId } from '../jwt';

const token = (payload) => `x.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.y`;

describe('tokenUserId', () => {
  it('reads the user id claim without a server', () => {
    expect(tokenUserId(token({ user_id: 7, exp: 1 }))).toBe(7);
  });

  it('is null for anything else', () => {
    expect(tokenUserId(null)).toBeNull();
    expect(tokenUserId('junk')).toBeNull();
    expect(tokenUserId('a.!!!.b')).toBeNull();
    expect(tokenUserId(token({ sub: 'x' }))).toBeNull();
  });
});
