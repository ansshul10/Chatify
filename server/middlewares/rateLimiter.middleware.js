/**
 * @fileoverview Redis-backed sliding window rate limiter middleware.
 * @module middlewares/rateLimiter.middleware
 */

import { getRedis } from '../config/redis.js';
import { isEnabled } from '../utils/featureFlags.js';
import { rateLimited } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

/**
 * Create a rate limiter middleware with specified window and max attempts.
 * @param {object} options
 * @param {string} options.prefix - Redis key prefix (e.g., 'rl:auth')
 * @param {number} options.windowMs - Window duration in milliseconds
 * @param {number} options.max - Max requests per window
 * @param {string} [options.keyFn] - 'ip' | 'user' | 'both'
 * @returns {Function} Express middleware
 */
export function createRateLimiter({ prefix, windowMs, max, keyFn = 'ip' }) {
  return async (req, res, next) => {
    if (!isEnabled('FEATURE_RATE_LIMITING')) return next();

    try {
      const redis = getRedis();
      let key;
      if (keyFn === 'user' && req.user) key = `${prefix}:${req.user.id}`;
      else if (keyFn === 'both' && req.user) key = `${prefix}:${req.ip}:${req.user.id}`;
      else key = `${prefix}:${req.ip}`;

      const now = Date.now();
      const windowStart = now - windowMs;

      const multi = redis.multi();
      multi.zremrangebyscore(key, 0, windowStart);
      multi.zadd(key, now, `${now}:${Math.random()}`);
      multi.zcard(key);
      multi.pexpire(key, windowMs);

      const results = await multi.exec();
      const count = results[2][1];

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count));
      res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

      if (count > max) {
        logger.warn(`[RATE] Limit exceeded | ${key} | ${count}/${max}`);
        return rateLimited(res);
      }
      next();
    } catch (err) {
      logger.error(`[RATE] Redis error: ${err.message}`);
      next(); // Fail open — don't block requests if Redis is down
    }
  };
}

/** Auth rate limiter: 5 attempts per 15 minutes per IP */
export const authLimiter = createRateLimiter({ prefix: 'rl:auth', windowMs: 15 * 60 * 1000, max: 50 });
/** Message send rate limiter: 60 per minute per user */
export const messageLimiter = createRateLimiter({ prefix: 'rl:msg', windowMs: 60 * 1000, max: 60, keyFn: 'user' });
/** Profile update rate limiter: 10 per hour per user */
export const profileLimiter = createRateLimiter({ prefix: 'rl:profile', windowMs: 60 * 60 * 1000, max: 10, keyFn: 'user' });
/** Search rate limiter: 30 per minute per user */
export const searchLimiter = createRateLimiter({ prefix: 'rl:search', windowMs: 60 * 1000, max: 30, keyFn: 'user' });
/** Friend request rate limiter: 20 per day per user */
export const friendLimiter = createRateLimiter({ prefix: 'rl:friend', windowMs: 24 * 60 * 60 * 1000, max: 20, keyFn: 'user' });

export default { createRateLimiter, authLimiter, messageLimiter, profileLimiter, searchLimiter, friendLimiter };
