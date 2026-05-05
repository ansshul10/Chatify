/**
 * @fileoverview SystemConfig Model — Chatify v1
 * Stores system-wide configuration settings including feature flags,
 * maintenance mode, and dynamic limits.
 * 
 * @module models/SystemConfig.model
 * @requires mongoose
 */

import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const systemConfigSchema = new Schema(
  {
    /** Unique key for the config entry (e.g., 'FEATURE_FLAGS') */
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    /** Configuration value (can be object, boolean, string, etc.) */
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    /** Optional description of what this config does */
    description: {
      type: String,
      default: '',
    },
    /** Category for grouping (e.g., 'features', 'limits', 'security') */
    category: {
      type: String,
      default: 'general',
      index: true,
    },
    /** Last updated by which admin */
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'system_configs',
  }
);

const SystemConfig = model('SystemConfig', systemConfigSchema);

export default SystemConfig;
