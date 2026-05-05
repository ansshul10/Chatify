/**
 * @fileoverview Socket.io authentication middleware — verifies JWT on handshake.
 * @module middlewares/socketAuth.middleware
 */

import jwt from 'jsonwebtoken';
import { getEnv } from '../config/validateEnv.js';
import { logSocketError } from '../utils/socketLogger.js';

/**
 * Socket.io middleware that verifies JWT from handshake auth or cookies.
 * On success, attaches decoded user to `socket.user`.
 * On failure, disconnects with error.
 */
export function socketAuthMiddleware(socket, next) {
  const env = getEnv();
  const token = socket.handshake.auth?.token
    || socket.handshake.headers?.cookie?.match(/accessToken=([^;]+)/)?.[1];

  if (!token) {
    logSocketError('handshake', 'unknown', 'No token provided');
    return next(new Error('CHAT_ERR_092: Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    logSocketError('handshake', 'unknown', `Invalid token: ${err.message}`);
    return next(new Error('CHAT_ERR_092: Invalid or expired token'));
  }
}

export default socketAuthMiddleware;
