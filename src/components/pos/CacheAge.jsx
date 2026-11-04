import React from 'react';

const hhmm = (ms) => new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

/**
 * When the till's copy of products and prices was last refreshed (G26). Amber once it is older than the company's
 * `offline_warn_hours`; `failing` says the last refresh could not reach the server. The full offline banner is G29.
 */
const CacheAge = ({ refreshedAt, warnHours = 4, failing = false, now = Date.now() }) => {
  if (!refreshedAt) return null;
  const stale = now - refreshedAt > (warnHours ?? 4) * 3_600_000;
  return (
    <p role="status" className={`text-xs ${stale ? 'font-medium text-amber-700' : 'text-gray-500'}`}>
      Prices updated {hhmm(refreshedAt)}
      {stale && ' · may be out of date'}
      {failing && !stale && ' · server not reachable, using this copy'}
    </p>
  );
};

export default CacheAge;
