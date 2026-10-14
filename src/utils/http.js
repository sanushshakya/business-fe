/**
 * True when the server understood the request and refused it (a 4xx), so sending it again unchanged
 * cannot help. Everything else — no response at all, a gateway/proxy error, a 5xx, a timeout (408) or
 * rate limit (429) — is worth retrying later.
 */
export const isRejection = (error) => {
  const status = error?.response?.status;
  return status >= 400 && status < 500 && status !== 408 && status !== 429;
};

/**
 * A sentence for an API error. Understands DRF's per-field validation errors, the backend's
 * `{code, message}` shape and plain `detail`, and falls back to `fallback` for anything else
 * (including network failures).
 */
export const apiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  const data = error?.response?.data;
  if (!data || typeof data !== 'object') return fallback;
  if (typeof data.message === 'string') return data.message;
  const parts = [];
  for (const value of Object.values(data)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (typeof item === 'string') parts.push(item);
    }
  }
  return parts.length ? parts.join(' ') : fallback;
};
