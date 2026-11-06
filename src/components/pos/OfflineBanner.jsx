import React from 'react';
import { Button } from '@/components/ui';

const hhmm = (ms) => new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
const sales = (n) => `${n} ${n === 1 ? 'sale' : 'sales'}`;

/**
 * The till's offline state (G29, ADR 0001): offline since when (the last time the server answered), how many of this
 * till's sales wait to be sent, progress while they are sent, and Retry for ones the server could not record.
 * `serverOnly`: the browser is online but the server can't be reached (card sales then need the terminal's code).
 */
const OfflineBanner = ({
  online,
  serverOnly = false,
  since = null,
  waiting = 0,
  failed = 0,
  sending = false,
  onRetry,
}) => {
  if (online && waiting === 0 && failed === 0) return null;
  let message;
  if (!online) {
    message = `Offline${since ? ` since ${hhmm(since)}` : ''}${waiting ? ` · ${sales(waiting)} waiting to send` : ''}.`;
  } else if (waiting && sending) {
    message = `Sending ${waiting} offline ${waiting === 1 ? 'sale' : 'sales'}…`;
  } else if (waiting) {
    message = `Back online · ${waiting} offline ${waiting === 1 ? 'sale' : 'sales'} waiting to send.`;
  }
  return (
    <div
      role="status"
      className={`space-y-1 rounded-md p-3 text-sm ${online ? 'bg-blue-50 text-blue-900' : 'bg-yellow-50 text-yellow-800'}`}
    >
      {message && <p className="font-medium">{message}</p>}
      {!online && (
        <p>
          Sales are kept on this till and sent when it reconnects.
          {serverOnly && " The server can't be reached; card sales go on with the terminal's auth code."}
        </p>
      )}
      {failed > 0 && (
        <p className="flex flex-wrap items-center gap-2 text-red-700">
          {failed} offline {failed === 1 ? 'sale' : 'sales'} could not be sent.
          {onRetry && (
            <Button variant="secondary" className="px-3 py-1" onClick={onRetry}>
              Retry
            </Button>
          )}
        </p>
      )}
    </div>
  );
};

export default OfflineBanner;
