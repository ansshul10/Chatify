/**
 * @fileoverview Scheduled tasks — TTL cleanup, stale session purge.
 * @module utils/schedules
 */

import logger from './logger.js';

/**
 * Run a task on an interval with error handling.
 * @param {string} name - Task name for logging
 * @param {Function} fn - Async function to execute
 * @param {number} intervalMs - Interval in milliseconds
 * @returns {NodeJS.Timeout} Timer reference for cleanup
 */
export function scheduleTask(name, fn, intervalMs) {
  logger.info(`[SCHEDULE] Registered: ${name} (every ${intervalMs / 1000}s)`);
  return setInterval(async () => {
    try {
      await fn();
      logger.debug(`[SCHEDULE] ${name} completed`);
    } catch (err) {
      logger.error(`[SCHEDULE] ${name} failed: ${err.message}`);
    }
  }, intervalMs);
}

/**
 * Initialize all scheduled tasks.
 * @param {object} deps - Dependencies (models, redis, etc.)
 */
export function initSchedules(deps = {}) {
  // Clean expired self-destruct messages every 60 seconds
  scheduleTask('self-destruct-cleanup', async () => {
    if (deps.Message) {
      await deps.Message.deleteMany({ selfDestructAt: { $lte: new Date() } });
    }
  }, 60_000);

  // Purge old read notifications every hour
  scheduleTask('notification-cleanup', async () => {
    if (deps.Notification) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      await deps.Notification.deleteMany({ isRead: true, createdAt: { $lte: thirtyDaysAgo } });
    }
  }, 3_600_000);

  // Update stale online statuses every 30 seconds
  scheduleTask('stale-presence-cleanup', async () => {
    if (deps.User) {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      await deps.User.updateMany(
        { isOnline: true, lastSeenAt: { $lte: fiveMinAgo } },
        { $set: { isOnline: false, onlineStatus: 'offline' } }
      );
    }
  }, 30_000);

  logger.info('[SCHEDULE] All tasks initialized');
}

export default { scheduleTask, initSchedules };
