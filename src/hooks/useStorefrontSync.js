import { useEffect, useState } from 'react';

const MAX_DELAY_MS = 30000;

/** `ws(s)://<api host>/ws/sync/`: the API's host when `VITE_API_URL` is set, otherwise this page's (Vite proxies it). */
export const socketUrl = (apiUrl = import.meta.env?.VITE_API_URL ?? '', page = window.location) => {
  const base = apiUrl ? new URL(apiUrl) : page;
  const scheme = base.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${scheme}//${base.host}/ws/sync/`;
};

/**
 * Live storefront sync status from the backend's `/ws/sync/` (`sync.status` messages).
 *
 * The access token goes in the subprotocols (`['bearer', token]`): browsers cannot set headers on a websocket.
 * A dropped socket is reopened after 1 s, 2 s, 4 s … (at most 30 s); a new token reopens it at once.
 *
 * @param {string|null} token - Nothing is opened without one.
 * @returns {{status: object|null, disconnected: boolean}}
 */
const useStorefrontSync = (token) => {
  const [status, setStatus] = useState(null);
  const [disconnected, setDisconnected] = useState(false);

  useEffect(() => {
    if (!token) return undefined;
    let socket = null;
    let timer = null;
    let attempts = 0;
    let stopped = false;

    const open = () => {
      socket = new WebSocket(socketUrl(), ['bearer', token]);
      socket.onopen = () => {
        attempts = 0;
        setDisconnected(false);
      };
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'sync.status') setStatus(message);
        } catch {
          // ignore anything that is not a status message
        }
      };
      socket.onclose = () => {
        if (stopped) return;
        setDisconnected(true);
        timer = setTimeout(open, Math.min(1000 * 2 ** attempts, MAX_DELAY_MS));
        attempts += 1;
      };
    };

    open();
    return () => {
      stopped = true;
      clearTimeout(timer);
      socket?.close();
    };
  }, [token]);

  return { status, disconnected };
};

export default useStorefrontSync;
