/**
 * @fileoverview Redis connection via ioredis with retry strategy and health check.
 * Falls back to an in-memory stub when Redis is unavailable (development).
 * @module config/redis
 */

import Redis from 'ioredis';
import { getEnv } from './validateEnv.js';
import logger from '../utils/logger.js';

/** @type {Redis|object} */
let redisClient = null;
let isStubMode = false;

// ── In-memory stub for when Redis is unavailable ──
const memoryStore = new Map();
const redisStub = {
  get: async (key) => memoryStore.get(key) || null,
  set: async (key, value) => { memoryStore.set(key, value); return 'OK'; },
  setex: async (key, _ttl, value) => { memoryStore.set(key, value); return 'OK'; },
  del: async (...keys) => { keys.forEach((k) => memoryStore.delete(k)); return keys.length; },
  keys: async (pattern) => {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return [...memoryStore.keys()].filter((k) => regex.test(k));
  },
  hset: async (key, field, value) => { const m = memoryStore.get(key) || {}; m[field] = value; memoryStore.set(key, m); return 1; },
  hget: async (key, field) => { const m = memoryStore.get(key); return m ? m[field] || null : null; },
  hdel: async (key, ...fields) => { const m = memoryStore.get(key); if (m) fields.forEach((f) => delete m[f]); return fields.length; },
  hgetall: async (key) => memoryStore.get(key) || {},
  incr: async (key) => { const v = parseInt(memoryStore.get(key) || '0') + 1; memoryStore.set(key, String(v)); return v; },
  expire: async () => 1,
  pexpire: async () => 1,
  ttl: async () => -1,
  exists: async (key) => memoryStore.has(key) ? 1 : 0,
  // List operations
  lpush: async (key, ...values) => { const arr = memoryStore.get(key) || []; arr.unshift(...values); memoryStore.set(key, arr); return arr.length; },
  rpush: async (key, ...values) => { const arr = memoryStore.get(key) || []; arr.push(...values); memoryStore.set(key, arr); return arr.length; },
  lpop: async (key) => { const arr = memoryStore.get(key) || []; return arr.shift() || null; },
  rpop: async (key) => { const arr = memoryStore.get(key) || []; return arr.pop() || null; },
  llen: async (key) => (memoryStore.get(key) || []).length,
  lrange: async (key, start, stop) => (memoryStore.get(key) || []).slice(start, stop === -1 ? undefined : stop + 1),
  // Sorted set operations
  zadd: async (key, score, member) => {
    const ss = memoryStore.get(key) || [];
    const idx = ss.findIndex((e) => e.member === member);
    if (idx >= 0) { ss[idx].score = score; } else { ss.push({ score, member }); }
    ss.sort((a, b) => a.score - b.score);
    memoryStore.set(key, ss);
    return idx >= 0 ? 0 : 1;
  },
  zremrangebyscore: async (key, min, max) => {
    const ss = memoryStore.get(key) || [];
    const before = ss.length;
    const filtered = ss.filter((e) => e.score < min || e.score > max);
    memoryStore.set(key, filtered);
    return before - filtered.length;
  },
  zcard: async (key) => (memoryStore.get(key) || []).length,
  // Set operations
  sadd: async (key, ...members) => { const s = memoryStore.get(key) || new Set(); members.forEach((m) => s.add(m)); memoryStore.set(key, s); return members.length; },
  srem: async (key, ...members) => { const s = memoryStore.get(key) || new Set(); members.forEach((m) => s.delete(m)); return members.length; },
  smembers: async (key) => [...(memoryStore.get(key) || new Set())],
  sismember: async (key, member) => (memoryStore.get(key) || new Set()).has(member) ? 1 : 0,
  ping: async () => 'PONG',
  multi: () => {
    const cmds = [];
    const handler = {
      get(target, prop) {
        if (prop === 'exec') {
          return async () => {
            const results = [];
            for (const [cmd, ...args] of cmds) {
              try {
                const result = await redisStub[cmd]?.(...args);
                results.push([null, result]);
              } catch (err) {
                results.push([err, null]);
              }
            }
            return results;
          };
        }
        // Proxy any Redis command — add it to the queue and return the proxy for chaining
        return (...args) => {
          cmds.push([prop, ...args]);
          return new Proxy({}, handler);
        };
      },
    };
    return new Proxy({}, handler);
  },
  pipeline: () => {
    const cmds = [];
    const handler = {
      get(target, prop) {
        if (prop === 'exec') {
          return async () => {
            const results = [];
            for (const [cmd, ...args] of cmds) {
              try {
                const result = await redisStub[cmd]?.(...args);
                results.push([null, result]);
              } catch (err) {
                results.push([err, null]);
              }
            }
            return results;
          };
        }
        return (...args) => {
          cmds.push([prop, ...args]);
          return new Proxy({}, handler);
        };
      },
    };
    return new Proxy({}, handler);
  },
  on: () => {},
  status: 'ready',
};

/**
 * Creates and configures the Redis client with retry strategy.
 * Falls back to in-memory stub if connection fails.
 * @returns {Redis|object}
 */
export function createRedisClient() {
  const env = getEnv();

  try {
    redisClient = new Redis(env.REDIS_URL, {
      // Default behavior is to queue commands while disconnected.
      // Setting maxRetriesPerRequest to null ensures commands don't fail immediately during reconnection.
      maxRetriesPerRequest: null, 
      retryStrategy(times) {
        const isDev = process.env.NODE_ENV !== 'production';
        const maxRetries = isDev ? 3 : 20;
        const delay = Math.min(times * 200, 10000);
        
        if (times > maxRetries) {
          if (!isStubMode) {
            logger.warn(`[REDIS] Max retries (${maxRetries}) exceeded. Falling back to in-memory stub.`);
            isStubMode = true;
            redisClient = redisStub;
          }
          return null; 
        }

        if (times % 5 === 0 || times === 1) {
          logger.warn(`[REDIS] Connection attempt ${times}...`);
        }
        return delay;
      },
      reconnectOnError(err) {
        const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
        return targetErrors.some((e) => err.message.includes(e));
      },
      enableReadyCheck: true,
      lazyConnect: false,
      connectTimeout: 10000,
    });

    redisClient.on('connect', () => {
      logger.info('[REDIS] Connected');
    });

    redisClient.on('ready', () => {
      isStubMode = false;
      logger.info('[REDIS] Ready to accept commands');
    });

    redisClient.on('error', (err) => {
      if (!isStubMode) {
        const msg = err?.message || (typeof err === 'string' ? err : 'Unknown connection error');
        if (msg.includes('ECONNREFUSED')) {
          logger.error(`[REDIS] Connection refused at ${env.REDIS_URL}. (Redis is likely not running)`);
        } else {
          logger.error(`[REDIS] Error: ${msg}`);
        }
      }
    });

    redisClient.on('close', () => {
      if (!isStubMode) {
        logger.warn('[REDIS] Connection closed');
      }
    });

  } catch (err) {
    logger.warn(`[REDIS] Failed to create client: ${err.message}. Using in-memory stub.`);
    isStubMode = true;
    redisClient = redisStub;
  }

  return redisClient;
}

/**
 * Performs a health check on the Redis connection.
 * @returns {Promise<'connected'|'stub'|'error'>}
 */
export async function checkRedisHealth() {
  if (isStubMode) return 'stub (in-memory)';
  if (!redisClient) return 'error (not initialized)';
  
  const status = redisClient.status;
  if (status === 'connecting' || status === 'reconnecting') {
    return `connecting... (${status})`;
  }

  try {
    if (typeof redisClient.ping !== 'function') return 'error (invalid client)';
    // Use a timeout for the ping to avoid hanging the health check
    const pong = await Promise.race([
      redisClient.ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000))
    ]);
    return pong === 'PONG' ? 'connected' : 'error (ping failed)';
  } catch (err) {
    if (isStubMode) return 'stub (in-memory)';
    return `error (${err.message || 'connection failed'})`;
  }
}

/**
 * Returns the Redis client instance (or stub).
 * @returns {Redis|object}
 */
export function getRedis() {
  if (!redisClient) {
    logger.warn('[REDIS] Client not initialized, using in-memory stub.');
    isStubMode = true;
    redisClient = redisStub;
  }
  return redisClient;
}

/**
 * Gracefully disconnects Redis.
 * @returns {Promise<void>}
 */
export async function disconnectRedis() {
  if (redisClient && !isStubMode && redisClient.quit) {
    await redisClient.quit();
    logger.info('[REDIS] Disconnected gracefully');
  }
}

export default createRedisClient;
