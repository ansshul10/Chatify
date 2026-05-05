/**
 * @fileoverview User controller — profile, preferences, search, block.
 * @module controllers/user.controller
 */

import User from '../models/User.model.js';
import Report from '../models/Report.model.js';
import Notification from '../models/Notification.model.js';
import Conversation from '../models/Conversation.model.js';
import FriendRequest from '../models/FriendRequest.model.js';
import { isEnabled } from '../utils/featureFlags.js';
import * as api from '../utils/apiResponse.js';
import { io } from '../server.js';

export async function getUser(req, res) {
  if (!isEnabled('FEATURE_USER_PROFILES')) return api.featureDisabled(res, 'FEATURE_USER_PROFILES');
  const user = await User.findById(req.params.userId)
    .select('-passwordHash -twoFactorSecret -loginAttempts -lockUntil')
    .populate('closeFriends', 'displayName username avatar');
  if (!user) return api.notFound(res, 'User not found');

  let friendshipStatus = 'none';
  if (req.user.id !== req.params.userId) {
    friendshipStatus = await FriendRequest.getStatus(req.user.id, req.params.userId);
  } else {
    friendshipStatus = 'self';
  }

  api.success(res, { user: user.toSafeObject(), friendshipStatus });
}

export async function updateProfile(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return api.notFound(res);
  
  const { displayName, bio, gender, username } = req.body;
  
  // Username Change Logic (7-day rule)
  if (username && username !== user.username) {
    if (user.isAnonymous) return api.error(res, 'CHAT_ERR_037', 'Anonymous users cannot change username directly. Use upgrade.', 400);
    
    const now = new Date();
    const lastChange = user.lastUsernameChangeAt;
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    
    if (lastChange && (now - lastChange < sevenDaysInMs)) {
      const daysLeft = Math.ceil((sevenDaysInMs - (now - lastChange)) / (24 * 60 * 60 * 1000));
      return api.error(res, 'CHAT_ERR_038', `Username can only be changed once every 7 days. Please wait ${daysLeft} more day(s).`, 400);
    }
    
    // Check if username taken
    const existing = await User.findOne({ username });
    if (existing) return api.conflict(res, 'Username already taken');
    
    user.username = username;
    user.lastUsernameChangeAt = now;
  }

  if (displayName !== undefined) user.displayName = displayName;
  if (bio !== undefined && isEnabled('FEATURE_USER_BIO')) user.bio = bio;
  if (gender !== undefined) user.gender = gender;
  
  await user.save();
  api.success(res, { user: user.toSafeObject() });
}

/**
 * PATCH /api/users/me/privacy
 */
export async function togglePrivacy(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return api.notFound(res);
  
  user.preferences.privacy.isPrivate = !user.preferences.privacy.isPrivate;
  await user.save();
  
  api.success(res, { isPrivate: user.preferences.privacy.isPrivate });
}

/**
 * POST /api/users/me/close-friends/:userId
 */
export async function addCloseFriend(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return api.notFound(res);
  
  user.closeFriends.addToSet(req.params.userId);
  await user.save();
  
  api.success(res, { message: 'Added to close friends' });
}

/**
 * DELETE /api/users/me/close-friends/:userId
 */
export async function removeCloseFriend(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return api.notFound(res);
  
  user.closeFriends.pull(req.params.userId);
  await user.save();
  
  api.success(res, { message: 'Removed from close friends' });
}

/**
 * GET /api/users/me/sessions
 */
export async function getSessions(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return api.notFound(res);
  
  api.success(res, { sessions: user.sessions });
}

/**
 * DELETE /api/users/me/sessions/:sessionId
 */
export async function terminateSession(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return api.notFound(res);
  
  user.sessions = user.sessions.filter(s => s._id.toString() !== req.params.sessionId);
  await user.save();
  
  api.success(res, { message: 'Session terminated' });
}

/**
 * DELETE /api/users/me/account
 */
export async function deleteAccount(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return api.notFound(res);
  
  // Mark as inactive and clear sensitive data instead of hard delete (industry standard)
  user.isActive = false;
  user.isBanned = true;
  user.banReason = 'Account deleted by user';
  user.email = `deleted_${Date.now()}_${user.email}`;
  user.username = `deleted_${Date.now()}_${user.username}`;
  user.passwordHash = 'DELETED';
  
  await user.save();
  
  api.success(res, { message: 'Account deleted successfully' });
}

export async function uploadAvatar(req, res) {
  if (!isEnabled('FEATURE_AVATAR_UPLOAD')) return api.featureDisabled(res, 'FEATURE_AVATAR_UPLOAD');
  // Cloudinary upload would go here — for now store placeholder
  const user = await User.findById(req.user.id);
  if (!user) return api.notFound(res);
  user.avatar = req.body.avatarUrl || '';
  await user.save();
  api.success(res, { user: user.toSafeObject() });
}

export async function updatePreferences(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return api.notFound(res);
  
  const prefs = req.body;

  // Guard: skip empty requests to avoid overwriting stored preferences
  if (!prefs || Object.keys(prefs).length === 0) {
    return api.success(res, { preferences: user.preferences });
  }

  const privacyChanged = prefs.privacy && 
    prefs.privacy.showLastSeen !== undefined && 
    prefs.privacy.showLastSeen !== user.preferences.privacy.showLastSeen;

  if (prefs.notifications) Object.assign(user.preferences.notifications, prefs.notifications);
  if (prefs.privacy) Object.assign(user.preferences.privacy, prefs.privacy);
  if (prefs.sounds) Object.assign(user.preferences.sounds, prefs.sounds);
  if (prefs.theme) user.preferences.theme = prefs.theme;
  if (prefs.accentColor) user.preferences.accentColor = prefs.accentColor;
  if (prefs.chatBackground) user.preferences.chatBackground = prefs.chatBackground;

  // Ensure Mongoose tracks changes to nested preferences
  user.markModified('preferences');

  // If privacy changed and user is online, update onlineStatus and notify others
  if (privacyChanged && user.isOnline) {
    const hideStatus = user.preferences.privacy.showLastSeen === false && isEnabled('FEATURE_HIDE_ONLINE_STATUS');
    user.onlineStatus = hideStatus ? 'offline' : 'online';
    
    // Broadcast status change to everyone
    const chatNs = io.of('/chat');
    chatNs.emit('presence:online', { 
      userId: user._id, 
      status: user.onlineStatus 
    });
  }

  await user.save();
  api.success(res, { preferences: user.preferences });
}

export async function blockUser(req, res) {
  if (!isEnabled('FEATURE_BLOCKING')) return api.featureDisabled(res, 'FEATURE_BLOCKING');
  const user = await User.findById(req.user.id);
  if (!user) return api.notFound(res);
  if (req.user.id === req.params.userId) return api.error(res, 'CHAT_ERR_034', 'Cannot block yourself', 400);
  user.blockedUsers.addToSet(req.params.userId);
  await user.save();

  // Notify relevant conversations via socket
  const chatNs = io.of('/chat');
  chatNs.to(`user:${req.params.userId}`).to(`user:${req.user.id}`).emit('user:block_update', {
    blockerId: req.user.id,
    blockedId: req.params.userId,
    isBlocked: true
  });

  api.success(res, { message: 'User blocked' });
}

export async function unblockUser(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return api.notFound(res);
  user.blockedUsers.pull(req.params.userId);
  await user.save();

  // Notify relevant conversations via socket
  const chatNs = io.of('/chat');
  chatNs.to(`user:${req.params.userId}`).to(`user:${req.user.id}`).emit('user:block_update', {
    blockerId: req.user.id,
    blockedId: req.params.userId,
    isBlocked: false
  });

  api.success(res, { message: 'User unblocked' });
}

export async function getBlocked(req, res) {
  const user = await User.findById(req.user.id).populate('blockedUsers', 'username displayName avatar');
  if (!user) return api.notFound(res);
  api.success(res, { blocked: user.blockedUsers });
}

export async function searchUsers(req, res) {
  if (!isEnabled('FEATURE_USER_SEARCH')) return api.featureDisabled(res, 'FEATURE_USER_SEARCH');
  const users = await User.searchUsers(req.query.q, req.user.id);
  api.success(res, { users });
}

/**
 * GET /api/users/online — Fetch all currently online users.
 */
export async function getOnlineUsers(req, res) {
  const users = await User.find({
    _id: { $ne: req.user.id },
    isActive: true,
    isBanned: false,
    role: { $ne: 'admin' },
    $or: [
      { isAnonymous: false },
      { isAnonymous: true, isOnline: true }
    ]
  })
    .select('username displayName avatar isOnline onlineStatus lastSeenAt bio preferences.privacy.isPrivate')
    .limit(100)
    .sort({ isOnline: -1, lastSeenAt: -1 });
  api.success(res, { users });
}

/**
 * POST /api/users/:userId/report
 */
export async function reportUser(req, res) {
  if (!isEnabled('FEATURE_REPORTING')) return api.featureDisabled(res, 'FEATURE_REPORTING');
  const { reason } = req.body;
  const { userId } = req.params;

  if (!reason) return api.error(res, 'CHAT_ERR_046', 'Report reason is required', 400);

  // 1. Check for duplicate report from same user
  const existingReport = await Report.findOne({
    reporterId: req.user.id,
    reportedId: userId,
    status: { $in: ['pending', 'reviewed'] } // Check if there's an active report
  });

  if (existingReport) {
    return api.conflict(res, 'You have already reported this user. Our team is investigating.');
  }

  // 2. Create the report
  const report = await Report.create({
    reporterId: req.user.id,
    reportedId: userId,
    reason,
  });

  // 2. Count total reports for this user
  const reportCount = await Report.countDocuments({ reportedId: userId });

  // 3. Automated Notifications based on report count
  let notifType = 'system';
  let notifTitle = '';
  let notifBody = '';
  let priority = 'normal';

  if (reportCount === 1) {
    notifTitle = '⚠️ Community Guidelines Warning';
    notifBody = 'We have received a report regarding your account. Please ensure you follow our community guidelines to avoid further action.';
    priority = 'normal';
  } else if (reportCount === 2) {
    notifTitle = '🚨 Final Warning: Multiple Reports';
    notifBody = 'Your account has been reported multiple times. Continued violations will result in immediate suspension.';
    priority = 'high';
  } else if (reportCount === 3) {
    notifTitle = '⛔ Account Under Investigation';
    notifBody = 'Due to repeated reports, your account is now under administrative review. Action may be taken shortly.';
    priority = 'critical';
    notifType = 'security';
  }

  if (notifTitle) {
    await Notification.create({
      userId: userId,
      type: notifType,
      title: notifTitle,
      body: notifBody,
      priority,
      actor: {
        userId: req.user.id, // Or use a system user ID
        username: 'System'
      }
    });

    // Emit socket event to the reported user
    const chatNs = io.of('/chat');
    chatNs.to(`user:${userId}`).emit('notification:new', {
      title: notifTitle,
      body: notifBody,
      type: notifType
    });
  }

  // 4. Notify Admins
  const chatNs = io.of('/chat');
  chatNs.to('admin_room').emit('admin:report_new', {
    reportId: report._id,
    reportedId: userId,
    count: reportCount
  });

  api.success(res, { message: 'User reported successfully', reportId: report._id, reportCount }, 201);
}

export default {
  getUser, updateProfile, uploadAvatar, updatePreferences, 
  blockUser, unblockUser, getBlocked, searchUsers, 
  getOnlineUsers, reportUser, togglePrivacy,
  addCloseFriend, removeCloseFriend, getSessions,
  terminateSession, deleteAccount
};
