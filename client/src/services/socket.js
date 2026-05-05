/**
 * Socket.io client wrapper with auto-reconnect and dev logging
 */
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants.js';

let socket = null;

export function connectSocket(token) {
  if (socket?.connected) return socket;

  socket = io(`${SOCKET_URL}/chat`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });

  socket.on('connect', () => {
    console.log('[SOCKET] Connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[SOCKET] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('[SOCKET] Connection error:', err.message);
  });

  socket.on('error', (err) => {
    console.error('[SOCKET] Error:', err);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default { connectSocket, getSocket, disconnectSocket };
