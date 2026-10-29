import { useEffect, useRef, useState } from 'react';

const MAX_DELAY_MS = 30000;
const SIGN_IN_AGAIN = 4401; // the server refused or retired the token

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
 * A dropped socket is reopened after 1 s, 2 s, 4 s … (at most 30 s); a new token reopens it at once. When the
 * server closes with 4401 (token refused or expired) it calls `onSignInAgain` instead of retrying the same token.
 * A status older (`as_of`) than the one shown is ignored: the server's broadcasts can arrive out of order.
 *
 * @param {string|null} token - Nothing is opened without one.
 * @param {() => void} [onSignInAgain] - Should refresh the token (which reopens the socket).
 * @returns {{status: object|null, disconnected: boolean}}
 */
const useStorefrontSync = (token, onSignInAgain) => {
  const [status, setStatus] = useState(null);
  const [disconnected, setDisconnected] = useState(false);
  const signInAgain = useRef(onSignInAgain);
  signInAgain.current = onSignInAgain;

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
          if (message.type !== 'sync.status') return;
          setStatus((shown) => (shown?.as_of && message.as_of && message.as_of < shown.as_of ? shown : message));
        } catch {
          // ignore anything that is not a status message
        }
      };
      socket.onclose = (event) => {
        if (stopped) return;
        setDisconnected(true);
        if (event?.code === SIGN_IN_AGAIN) {
          signInAgain.current?.();
          return;
        }
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
