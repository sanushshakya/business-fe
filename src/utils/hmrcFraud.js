/**
 * What the browser reports about itself for HMRC's fraud-prevention headers (G56, WEB_APP_VIA_SERVER). Sent in the
 * body of every request that reaches HMRC; the server adds the IP, port, two-factor and vendor details.
 */

const DEVICE_KEY = 'hmrc-device-id';

const newUuid = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

/** A UUID kept in this browser and never expiring; made again if it was cleared (HMRC's Gov-Client-Device-ID). */
const deviceId = () => {
  try {
    const stored = window.localStorage.getItem(DEVICE_KEY);
    if (stored) return stored;
    const made = newUuid();
    window.localStorage.setItem(DEVICE_KEY, made);
    return made;
  } catch {
    return newUuid(); // storage blocked: a fresh id each time is the best this browser allows
  }
};

/** `Date#getTimezoneOffset()` minutes (positive west of UTC) as HMRC's `UTC±hh:mm`. */
export const timezoneOffset = (minutes) => {
  const east = -minutes;
  const sign = east >= 0 ? '+' : '-';
  const total = Math.abs(east);
  const pad = (value) => String(value).padStart(2, '0');
  return `UTC${sign}${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
};

export const clientInfo = () => {
  const { screen } = window;
  return {
    device_id: deviceId(),
    user_agent: window.navigator.userAgent,
    screens: [
      {
        width: Math.max(1, Math.round(screen?.width || 1)),
        height: Math.max(1, Math.round(screen?.height || 1)),
        scaling_factor: window.devicePixelRatio || 1,
        colour_depth: Math.max(1, screen?.colorDepth || 24),
      },
    ],
    window: { width: Math.max(1, window.innerWidth || 1), height: Math.max(1, window.innerHeight || 1) },
    timezone: timezoneOffset(new Date().getTimezoneOffset()),
    web_version: import.meta.env.VITE_APP_VERSION || 'dev',
  };
};
