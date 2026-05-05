/**
 * @fileoverview MongoDB connection via Mongoose with retry logic and query logging plugin.
 * @module config/db
 */

import mongoose from 'mongoose';
import { getEnv } from './validateEnv.js';
import logger from '../utils/logger.js';

/** Maximum number of connection retries */
const MAX_RETRIES = 5;
/** Delay between retries in ms */
const RETRY_DELAY = 5000;

/**
 * Mongoose query logging plugin.
 * Logs collection, operation, filter, and duration for every query.
 * Only active when FEATURE_QUERY_LOGGING is enabled.
 * @param {mongoose.Schema} schema - The schema to apply the plugin to
 */
function queryLoggingPlugin(schema) {
  const env = getEnv();
  if (!env.FEATURE_QUERY_LOGGING) return;

  schema.pre(/^(find|findOne|findOneAndUpdate|findOneAndDelete|countDocuments|aggregate)/, function () {
    this._startTime = Date.now();
  });

  schema.post(/^(find|findOne|findOneAndUpdate|findOneAndDelete|countDocuments|aggregate)/, function () {
    if (this._startTime) {
      const duration = Date.now() - this._startTime;
      const collection = this.mongooseCollection?.name || this._collection?.collectionName || 'unknown';
      const op = this.op || 'query';
      const filter = JSON.stringify(this.getFilter?.() || {});
      logger.debug(`[DB] ${collection}.${op} ${filter} (${duration}ms)`);
    }
  });
}

/**
 * Connects to MongoDB with retry logic.
 * Sets global Mongoose config: bufferCommands = false, strict query mode.
 * @returns {Promise<mongoose.Connection>}
 */
export async function connectDB() {
  const env = getEnv();

  // Global Mongoose settings
  mongoose.set('bufferCommands', false);
  mongoose.set('strictQuery', true);

  // Apply query logging plugin globally
  mongoose.plugin(queryLoggingPlugin);

  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      const conn = await mongoose.connect(env.MONGODB_URI, {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 5000,
        heartbeatFrequencyMS: 10000,
        retryWrites: true,
        w: 'majority',
      });

      logger.info(`[DB] MongoDB connected → ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);

      // Connection event listeners
      mongoose.connection.on('error', (err) => {
        logger.error(`[DB] MongoDB connection error: ${err.message}`);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('[DB] MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('[DB] MongoDB reconnected');
      });

      return conn.connection;
    } catch (err) {
      retries++;
      logger.error(`[DB] Connection attempt ${retries}/${MAX_RETRIES} failed: ${err.message}`);

      if (retries >= MAX_RETRIES) {
        logger.error('[DB] Max retries reached. Exiting process.');
        process.exit(1);
      }

      logger.info(`[DB] Retrying in ${RETRY_DELAY / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }
}

/**
 * Gracefully disconnects from MongoDB.
 * @returns {Promise<void>}
 */
export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    logger.info('[DB] MongoDB disconnected gracefully');
  } catch (err) {
    logger.error(`[DB] Error during disconnect: ${err.message}`);
  }
}

/**
 * Returns the current MongoDB connection status.
 * @returns {'connected'|'disconnected'|'connecting'|'error'}
 */
export function getDBStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'error',
  };
  return states[mongoose.connection.readyState] || 'error';
}

export default connectDB;
