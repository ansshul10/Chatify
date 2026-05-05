/**
 * @fileoverview Admin controller — stats, user management, logs.
 * @module controllers/admin.controller
 */

import User from '../models/User.model.js';
import Message from '../models/Message.model.js';
import Report from '../models/Report.model.js';
import Notification from '../models/Notification.model.js';
import Conversation from '../models/Conversation.model.js';
import { getQueueDepth, queueEmail, getQueueItems, processJob } from '../services/emailQueue.service.js';
import { getRedis } from '../config/redis.js';
import { getEmailService } from '../services/email.service.js';
import * as api from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import { io } from '../server.js';

import configService from '../services/config.service.js';

export async function getStats(req, res) {
  const [totalUsers, activeUsers, messagesLast24h, emailsQueued] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isOnline: true }),
    Message.countDocuments({ createdAt: { $gte: new Date(Date.now() - 86400000) } }),
    getQueueDepth(),
  ]);
  api.success(res, { totalUsers, activeUsers, messagesLast24h, emailsQueued, dmsToday: messagesLast24h });
}

export async function getFeatureFlags(req, res) {
  const flags = configService.getAllFeatureFlags();
  api.success(res, { flags });
}

export async function updateFeatureFlag(req, res) {
  const { flag, value } = req.body;
  if (typeof value !== 'boolean') return api.badRequest(res, 'Value must be a boolean');
  
  try {
    const updatedFlags = await configService.updateFeatureFlag(flag, value, req.user._id);
    api.success(res, { flags: updatedFlags });
  } catch (err) {
    api.badRequest(res, err.message);
  }
}

export async function getUsers(req, res) {
  const users = await User.findActiveUsers(parseInt(req.query.limit) || 50, parseInt(req.query.skip) || 0);
  api.success(res, { users });
}

export async function banUser(req, res) {
  const user = await User.findById(req.params.userId);
  if (!user) return api.notFound(res);
  
  const wasBanned = user.isBanned;
  const isUnbanning = wasBanned;
  
  if (isUnbanning) {
    user.isBanned = false;
    user.banExpiresAt = null;
    await user.save();
    return api.success(res, { message: 'User unbanned successfully', user: user.toSafeObject() });
  }

  // 1. Calculate Progressive Ban Duration
  user.banCount = (user.banCount || 0) + 1;
  user.isBanned = true;
  user.banReason = req.body.reason || 'Violation of terms of service';
  
  let durationMs = 0;
  switch (user.banCount) {
    case 1: durationMs = 1 * 60 * 60 * 1000; break; // 1 hour
    case 2: durationMs = 3 * 60 * 60 * 1000; break; // 3 hours
    case 3: durationMs = 6 * 60 * 60 * 1000; break; // 6 hours
    case 4: durationMs = 9 * 60 * 60 * 1000; break; // 9 hours
    case 5: durationMs = 12 * 60 * 60 * 1000; break; // 12 hours
    case 6: durationMs = 24 * 60 * 60 * 1000; break; // 1 day
    case 7: durationMs = 7 * 24 * 60 * 60 * 1000; break; // 7 days
    case 8: durationMs = 30 * 24 * 60 * 60 * 1000; break; // 30 days
    default: durationMs = 0; // Permanent
  }

  if (durationMs > 0) {
    user.banExpiresAt = new Date(Date.now() + durationMs);
  } else {
    user.banExpiresAt = null; // Permanent
  }

  await user.save();

  // 2. Notify Reporters
  const reports = await Report.find({ reportedId: user._id, status: 'pending' });
  const chatNs = io.of('/chat');

  for (const report of reports) {
    report.status = 'resolved';
    report.adminNotes = `User banned for ${durationMs > 0 ? (durationMs / (60 * 60 * 1000)).toFixed(0) + ' hours' : 'permanently'}.`;
    await report.save();

    const notifTitle = '🛡️ Action Taken on Your Report';
    const notifBody = `The user "${user.displayName || user.username}" you reported has been banned following our investigation. Thank you for helping keep the community safe.`;

    await Notification.create({
      userId: report.reporterId,
      type: 'system',
      title: notifTitle,
      body: notifBody,
      actor: {
        userId: req.user.id,
        username: 'System'
      }
    });

    // Emit socket to reporter
    chatNs.to(`user:${report.reporterId}`).emit('notification:new', {
      title: notifTitle,
      body: notifBody,
      type: 'system'
    });
  }

  // 3. Send email to Banned User
  if (user.email) {
    const durationStr = user.banExpiresAt 
      ? `until ${new Date(user.banExpiresAt).toLocaleString()}` 
      : 'Permanent';
      
    await queueEmail({
      to: user.email,
      subject: 'Account Suspended - Chatify',
      templateName: 'account-banned',
      vars: { 
        USERNAME: user.username, 
        BAN_REASON: user.banReason, 
        BAN_DURATION: durationStr 
      },
    }).catch(err => logger.error(`[ADMIN] Failed to queue ban email: ${err.message}`));
  }

  api.success(res, { 
    message: 'User banned successfully', 
    banCount: user.banCount, 
    expiresAt: user.banExpiresAt,
    user: user.toSafeObject() 
  });
}

export async function getLogs(req, res) {
  // In production, this would read from winston file transport
  api.success(res, { logs: ['Log viewer not yet implemented — check server console'] });
}

export async function getReports(req, res) {
  const reports = await Report.find()
    .populate('reporterId', 'username displayName avatar')
    .populate('reportedId', 'username displayName avatar')
    .sort({ createdAt: -1 })
    .limit(100);
  api.success(res, { reports });
}

export async function sendNotification(req, res) {
  const { userId, title, body, priority = 'normal', type = 'system' } = req.body;
  if (!userId || !title) return api.badRequest(res, 'User ID and Title are required');

  const notification = await Notification.create({
    userId,
    title,
    body,
    priority,
    type,
    actor: {
      userId: req.user.id,
      username: 'Admin'
    }
  });

  // Emit socket event
  const chatNs = io.of('/chat');
  chatNs.to(`user:${userId}`).emit('notification:new', {
    title,
    body,
    type
  });

  api.success(res, { notification });
}

export async function getEmailQueue(req, res) {
  try {
    const queue = await getQueueItems();
    api.success(res, { queue });
  } catch (err) {
    api.serverError(res, err);
  }
}

export async function sendManualEmail(req, res) {
  const { to, subject, body } = req.body;
  if (!to || !subject || !body) return api.badRequest(res, 'Target, Subject and Body are required');

  try {
    const emailService = getEmailService();
    // Manual emails use a special 'manual-admin' template or just raw text if supported
    // For now we'll use a generic template or add logic to handle raw body
    await emailService.sendEmail({
      to,
      subject,
      templateName: 'admin-manual', // You'll need to create this template or handle raw
      vars: { CONTENT: body, ADMIN_NAME: req.user.username }
    });
    
    api.success(res, { message: 'Email sent successfully' });
  } catch (err) {
    api.serverError(res, err);
  }
}

export async function resendQueueJob(req, res) {
  const { job } = req.body;
  if (!job) return api.badRequest(res, 'Job data is required');

  try {
    const success = await processJob(job);
    if (success) {
      // Remove from Redis queue so the worker doesn't process it again
      const redis = getRedis();
      await redis.lrem('email:queue', 1, JSON.stringify(job));
      api.success(res, { message: 'Job processed successfully' });
    } else {
      api.error(res, 'CHAT_ERR_091', 'Failed to process job manually', 500);
    }
  } catch (err) {
    api.serverError(res, err);
  }
}

export default { 
  getStats, getUsers, banUser, getLogs, 
  getFeatureFlags, updateFeatureFlag,
  getReports, sendNotification, getEmailQueue, sendManualEmail,
  resendQueueJob
};
