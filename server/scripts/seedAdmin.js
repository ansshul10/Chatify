/**
 * @fileoverview Seed Admin Script — Chatify v1
 * Creates a default superuser account if none exists.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.model.js';
import logger from '../utils/logger.js';

const ADMIN_CREDENTIALS = {
  username: 'admin',
  email: 'admin@chatify.app',
  passwordHash: 'Admin@123', // This will be hashed by the model pre-save hook
  role: 'admin',
  isEmailVerified: true,
  displayName: 'System Administrator',
};

async function seedAdmin() {
  try {
    logger.info('[SEED] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('[SEED] Connection established.');

    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      logger.info(`[SEED] Admin already exists: ${adminExists.username} (${adminExists.email})`);
      process.exit(0);
    }

    logger.info('[SEED] Creating superuser account...');
    const admin = await User.create(ADMIN_CREDENTIALS);

    logger.info('══════════════════════════════════════════════');
    logger.info('  ✅ ADMIN SEEDED SUCCESSFULLY');
    logger.info('══════════════════════════════════════════════');
    logger.info(`  Username : ${admin.username}`);
    logger.info(`  Email    : ${admin.email}`);
    logger.info(`  Password : Admin@123 (Please change after login)`);
    logger.info('══════════════════════════════════════════════');

    process.exit(0);
  } catch (err) {
    logger.error(`[SEED] Failed to seed admin: ${err.message}`);
    process.exit(1);
  }
}

seedAdmin();
