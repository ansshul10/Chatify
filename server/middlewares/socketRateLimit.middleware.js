/**
 * @fileoverview Socket rate limiter — Redis sliding window, 60 events/10s per socket.
 * @module middlewares/socketRateLimit.middleware
 */

import { getRedis } from '../config/redis.js';
import { logSocketRateLimit } from '../utils/socketLogger.js';
import { isEnabled } from '../utils/featureFlags.js';

const WINDOW_MS = 10_000;
const MAX_EVENTS = 60;

/**
 * Socket.io middleware that rate-limits events per connection.
 * @param {import('socket.io').Socket} socket
 * @param {Function} next
 */
export function socketRateLimitMiddleware(socket, next) {
  if (!isEnabled('FEATURE_RATE_LIMITING')) return next();

  const originalEmit = socket.onevent;
  socket.onevent = async function (packet) {
    try {
      const redis = getRedis();
      const key = `srl:${socket.user?.id || socket.id}`;
      const now = Date.now();
      const multi = redis.multi();
      multi.zremrangebyscore(key, 0, now - WINDOW_MS);
      multi.zadd(key, now, `${now}:${Math.random()}`);
      multi.zcard(key);
      multi.pexpire(key, WINDOW_MS);
      const results = await multi.exec();
      const count = results[2][1];

      if (count > MAX_EVENTS) {
        logSocketRateLimit(socket.id, socket.user?.id, count);
        socket.emit('error', { code: 'CHAT_ERR_090', message: 'Socket rate limit exceeded' });
        return;
      }
    } catch { /* fail open */ }
    originalEmit.call(socket, packet);
  };
  next();
}

export default socketRateLimitMiddleware;
