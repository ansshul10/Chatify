/**
 * @fileoverview Cache service — Redis wrapper helpers with TTL management.
 * @module services/cache.service
 */
import { getRedis } from '../config/redis.js';

export async function get(key) {
  const redis = getRedis();
  const val = await redis.get(key);
  return val ? JSON.parse(val) : null;
}

export async function set(key, value, ttlSeconds = 120) {
  const redis = getRedis();
  await redis.setex(key, ttlSeconds, JSON.stringify(value));
}

export async function del(key) {
  const redis = getRedis();
  await redis.del(key);
}

export async function invalidatePattern(pattern) {
  const redis = getRedis();
  const keys = await redis.keys(pattern);
  if (keys.length > 0) await redis.del(...keys);
}

export default { get, set, del, invalidatePattern };
