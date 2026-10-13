// src/services/WebSocketService.js

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Keeps a WebSocket open to `url` for the lifetime of the component.
 *
 * @param {string} [url] - Nothing is opened until a url is given.
 * @returns {{socket: WebSocket|null, isOpen: boolean, connect: () => void, disconnect: () => void}}
 */
const useWebSocketService = (url) => {
  const [socket, setSocket] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const socketRef = useRef(null);

  const disconnect = useCallback(() => {
    socketRef.current?.close();
    socketRef.current = null;
    setSocket(null);
    setIsOpen(false);
  }, []);

  const connect = useCallback(() => {
    if (!url || socketRef.current) return;

    const next = new WebSocket(url);
    next.onopen = () => setIsOpen(true);
    next.onclose = () => {
      if (socketRef.current === next) {
        socketRef.current = null;
        setSocket(null);
      }
      setIsOpen(false);
    };
    next.onerror = (error) => console.error('WebSocket error:', error);

    socketRef.current = next;
    setSocket(next);
  }, [url]);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return { socket, isOpen, connect, disconnect };
};

export default useWebSocketService;
