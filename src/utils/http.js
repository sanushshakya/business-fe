/**
 * True when the server understood the request and refused it (a 4xx), so sending it again unchanged
 * cannot help. Everything else — no response at all, a gateway/proxy error, a 5xx, a timeout (408) or
 * rate limit (429) — is worth retrying later.
 */
export const isRejection = (error) => {
  const status = error?.response?.status;
  return status >= 400 && status < 500 && status !== 408 && status !== 429;
};
