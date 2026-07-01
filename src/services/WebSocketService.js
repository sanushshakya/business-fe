/**
 * WebSocketService.js
 *
 * Service for handling WebSocket connections.
 */

import { useEffect, useState } from 'react';

/**
 * Establishes a WebSocket connection and manages its lifecycle.
 *
 * @param {string} url - The URL of the WebSocket server.
 * @returns {{ socket: WebSocket | null, connect: () => void, disconnect: () => void }}
 */
const useWebSocketService = (url) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!url) return;

    const newSocket = new WebSocket(url);

    newSocket.onopen = () => {
      console.log('WebSocket connection established');
    };

    newSocket.onmessage = (event) => {
      console.log('Message from server:', event.data);
    };

    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    newSocket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [url]);

  const connect = () => {
    if (socket && socket.readyState === WebSocket.CLOSED) {
      socket.reconnect();
    } else {
      console.log('WebSocket is already connected');
    }
  };

  const disconnect = () => {
    if (socket) {
      socket.close();
    } else {
      console.log('No WebSocket connection to close');
    }
  };

  return { socket, connect, disconnect };
};

export default useWebSocketService;