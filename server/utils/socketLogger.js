/**
 * @fileoverview Socket event logger with direction indicators.
 * Logs all socket emissions and receptions with color coding.
 * @module utils/socketLogger
 */

import logger from './logger.js';

/**
 * Log an incoming socket event (client → server).
 * @param {string} event - Event name
 * @param {string} [userId] - User ID associated with the socket
 * @param {string} [summary] - Brief summary of event payload
 */
export function logSocketIn(event, userId = 'unknown', summary = '') {
  const summaryStr = summary ? ` | ${summary}` : '';
  logger.info(`[SOCKET ↓] ${event} | user:${userId}${summaryStr}`);
}

/**
 * Log an outgoing socket event (server → client).
 * @param {string} event - Event name
 * @param {string} [userId] - Target user ID
 * @param {string} [summary] - Brief summary of event payload
 */
export function logSocketOut(event, userId = 'unknown', summary = '') {
  const summaryStr = summary ? ` | ${summary}` : '';
  logger.info(`[SOCKET ↑] ${event} | user:${userId}${summaryStr}`);
}

/**
 * Log a socket connection event.
 * @param {string} socketId - Socket instance ID
 * @param {string} userId - Authenticated user ID
 */
export function logSocketConnect(socketId, userId) {
  logger.info(`[SOCKET ✓] Connected | socket:${socketId} | user:${userId}`);
}

/**
 * Log a socket disconnection event.
 * @param {string} socketId - Socket instance ID
 * @param {string} userId - User ID
 * @param {string} reason - Disconnect reason
 */
export function logSocketDisconnect(socketId, userId, reason) {
  logger.info(`[SOCKET ✗] Disconnected | socket:${socketId} | user:${userId} | reason:${reason}`);
}

/**
 * Log a socket error event.
 * @param {string} event - Event that caused the error
 * @param {string} userId - User ID
 * @param {Error|string} error - Error object or message
 */
export function logSocketError(event, userId, error) {
  const msg = error instanceof Error ? error.message : error;
  logger.error(`[SOCKET ✗] Error in ${event} | user:${userId} | ${msg}`);
}

/**
 * Log a socket rate limit trigger.
 * @param {string} socketId - Socket instance ID
 * @param {string} userId - User ID
 * @param {number} count - Current event count
 */
export function logSocketRateLimit(socketId, userId, count) {
  logger.warn(`[SOCKET RATE] Limit hit | socket:${socketId} | user:${userId} | count:${count}`);
}

export default {
  logSocketIn,
  logSocketOut,
  logSocketConnect,
  logSocketDisconnect,
  logSocketError,
  logSocketRateLimit,
};
