/**
 * @fileoverview Email queue service — Redis-backed queue with retry logic.
 * Worker polls every 5s, retries 3x with exponential backoff (5s, 25s, 125s).
 * @module services/emailQueue.service
 */

import { getRedis } from '../config/redis.js';
import { getEmailService } from './email.service.js';
import logger from '../utils/logger.js';

const QUEUE_KEY = 'email:queue';
const RETRY_DELAYS = [5000, 25000, 125000]; // 5s, 25s, 125s exponential backoff
let _polling = false;

/**
 * Add an email to the queue.
 * @param {Object} emailJob - { to, subject, templateName, vars }
 * @returns {Promise<void>}
 */
export async function queueEmail(emailJob) {
  const redis = getRedis();
  const job = JSON.stringify({
    ...emailJob,
    attempts: 0,
    queuedAt: new Date().toISOString(),
  });
  await redis.rpush(QUEUE_KEY, job);
  logger.debug(`[EMAIL QUEUE] Queued: ${emailJob.to} | ${emailJob.templateName}`);
}

/**
 * Process a single email job with retry logic.
 * @param {Object} job - Parsed email job
 * @returns {Promise<boolean>} True if sent successfully
 */
export async function processJob(job) {
  const emailService = getEmailService();

  try {
    const result = await emailService.sendEmail({
      to: job.to,
      subject: job.subject,
      templateName: job.templateName,
      vars: job.vars || {},
    });
    logger.info(`[EMAIL QUEUE] Sent: ${job.to} | ${job.templateName} | provider: ${result.provider}`);
    return true;
  } catch (err) {
    job.attempts = (job.attempts || 0) + 1;
    logger.error(`[EMAIL QUEUE] Attempt ${job.attempts}/3 failed: ${job.to} | ${err.message}`);

    if (job.attempts < 3) {
      const delay = RETRY_DELAYS[job.attempts - 1] || 5000;
      logger.info(`[EMAIL QUEUE] Retrying in ${delay / 1000}s...`);
      setTimeout(async () => {
        const redis = getRedis();
        await redis.rpush(QUEUE_KEY, JSON.stringify(job));
      }, delay);
    } else {
      logger.error(`[EMAIL QUEUE] CRITICAL: All 3 retries failed for ${job.to} | ${job.templateName}`);
    }
    return false;
  }
}

/**
 * Start the email queue worker — polls every 5 seconds.
 */
export function startEmailWorker() {
  if (_polling) return;
  _polling = true;
  logger.info('[EMAIL QUEUE] Worker started (polling every 5s)');

  setInterval(async () => {
    try {
      const redis = getRedis();
      const raw = await redis.lpop(QUEUE_KEY);
      if (!raw) return;

      const job = JSON.parse(raw);
      await processJob(job);
    } catch (err) {
      logger.error(`[EMAIL QUEUE] Worker error: ${err.message}`);
    }
  }, 5000);
}

/**
 * Get the current queue depth.
 * @returns {Promise<number>}
 */
export async function getQueueDepth() {
  const redis = getRedis();
  return redis.llen(QUEUE_KEY);
}

/**
 * Get all items in the queue.
 * @returns {Promise<Array>}
 */
export async function getQueueItems() {
  const redis = getRedis();
  const rawItems = await redis.lrange(QUEUE_KEY, 0, -1);
  return rawItems.map(item => JSON.parse(item));
}

export default { queueEmail, startEmailWorker, getQueueDepth, getQueueItems, processJob };
