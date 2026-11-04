// src/utils/jwt.js

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** base64url text → a string of its bytes (ASCII JSON here). Throws on a character outside the alphabet. */
function decodeBase64Url(text) {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const char of text) {
    const index = ALPHABET.indexOf(char);
    if (index < 0) throw new Error('Not base64url');
    value = (value << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out += String.fromCharCode((value >> bits) & 0xff);
    }
  }
  return out;
}

/**
 * The `user_id` claim of an access token, read without checking the signature (the server does that), or null. Used
 * offline to know whose cached data this is (G26); never to decide what someone may do.
 */
export const tokenUserId = (token) => {
  try {
    const userId = JSON.parse(decodeBase64Url(String(token).split('.')[1].replace(/=+$/, ''))).user_id;
    return Number.isInteger(userId) ? userId : null;
  } catch {
    return null;
  }
};
