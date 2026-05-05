/**
 * @fileoverview System Config Service — Chatify v1
 * Manages system-wide configuration with Redis caching for high performance.
 * 
 * @module services/config.service
 */

import SystemConfig from '../models/SystemConfig.model.js';
import { getRedis } from '../config/redis.js';
import logger from '../utils/logger.js';
import { ALL_FEATURE_FLAGS } from '../utils/featureFlags.js';

const CACHE_KEY = 'system:config:features';
let localCache = {};

/**
 * Initializes feature flags. Loads from DB or .env if DB is empty.
 */
export async function initFeatureFlags() {
  try {
    let config = await SystemConfig.findOne({ key: 'FEATURE_FLAGS' });

    if (!config) {
      logger.info('[CONFIG] Initializing feature flags from environment variables...');
      const initialFlags = {};
      for (const flag of ALL_FEATURE_FLAGS) {
        initialFlags[flag] = process.env[flag] === 'true';
      }

      config = await SystemConfig.create({
        key: 'FEATURE_FLAGS',
        value: initialFlags,
        category: 'features',
        description: 'System-wide feature toggles',
      });
    } else {
      // Merge missing flags from ALL_FEATURE_FLAGS if they don't exist in DB
      let updated = false;
      for (const flag of ALL_FEATURE_FLAGS) {
        if (config.value[flag] === undefined) {
          config.value[flag] = process.env[flag] === 'true';
          updated = true;
        }
      }
      if (updated) {
        config.markModified('value');
        await config.save();
        logger.info('[CONFIG] Synced missing feature flags to database.');
      }
    }

    localCache = config.value;
    
    // Sync to Redis
    const redis = getRedis();
    await redis.set(CACHE_KEY, JSON.stringify(localCache));
    
    logger.info(`[CONFIG] Loaded ${Object.keys(localCache).length} feature flags from database.`);
    return localCache;
  } catch (err) {
    logger.error(`[CONFIG] Failed to initialize feature flags: ${err.message}`);
    // Fallback to env if DB fails
    return {};
  }
}

/**
 * Synchronously checks if a feature is enabled using local cache.
 * @param {string} flag - Flag name
 * @returns {boolean}
 */
export function isFeatureEnabled(flag) {
  // If not in local cache, fallback to env (safety)
  if (localCache[flag] !== undefined) {
    return localCache[flag];
  }
  return process.env[flag] === 'true';
}

/**
 * Updates a specific feature flag.
 * @param {string} flag - Flag name
 * @param {boolean} value - New value
 * @param {string} adminId - ID of admin making the change
 */
export async function updateFeatureFlag(flag, value, adminId) {
  if (!ALL_FEATURE_FLAGS.includes(flag)) {
    throw new Error(`Invalid feature flag: ${flag}`);
  }

  const config = await SystemConfig.findOne({ key: 'FEATURE_FLAGS' });
  if (!config) throw new Error('Feature flags config not found');

  const updatedValue = { ...config.value, [flag]: value };
  
  await SystemConfig.updateOne(
    { key: 'FEATURE_FLAGS' },
    { 
      $set: { value: updatedValue, updatedBy: adminId },
    }
  );

  // Update local and Redis cache
  localCache = updatedValue;
  const redis = getRedis();
  await redis.set(CACHE_KEY, JSON.stringify(localCache));

  logger.info(`[CONFIG] Feature flag ${flag} updated to ${value} by admin:${adminId}`);
  return updatedValue;
}

/**
 * Returns all current feature flags.
 */
export function getAllFeatureFlags() {
  return localCache;
}

export default {
  initFeatureFlags,
  isFeatureEnabled,
  updateFeatureFlag,
  getAllFeatureFlags,
};
