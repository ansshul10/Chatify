/**
 * @fileoverview Presence service — Redis-based online/away/offline tracking.
 * @module services/presence.service
 */
import { getRedis } from '../config/redis.js';

export async function setOnline(userId) {
  const redis = getRedis();
  await redis.setex(`presence:${userId}`, 300, 'online');
}

export async function setAway(userId) {
  const redis = getRedis();
  await redis.setex(`presence:${userId}`, 300, 'away');
}

export async function setOffline(userId) {
  const redis = getRedis();
  await redis.del(`presence:${userId}`);
}

export async function getStatus(userId) {
  const redis = getRedis();
  return (await redis.get(`presence:${userId}`)) || 'offline';
}

export async function getMultipleStatuses(userIds) {
  const redis = getRedis();
  const pipeline = redis.pipeline();
  userIds.forEach((id) => pipeline.get(`presence:${id}`));
  const results = await pipeline.exec();
  const statuses = {};
  userIds.forEach((id, i) => { statuses[id] = results[i]?.[1] || 'offline'; });
  return statuses;
}

export default { setOnline, setAway, setOffline, getStatus, getMultipleStatuses };
