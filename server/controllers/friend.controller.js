/**
 * @fileoverview Friend controller.
 * @module controllers/friend.controller
 */

import FriendRequest from '../models/FriendRequest.model.js';
import User from '../models/User.model.js';
import * as api from '../utils/apiResponse.js';
import { isEnabled } from '../utils/featureFlags.js';
import { queueEmail } from '../services/emailQueue.service.js';
import { getEnv } from '../config/validateEnv.js';
import logger from '../utils/logger.js';
import { io } from '../server.js';

export async function getFriends(req, res) {
  if (!isEnabled('FEATURE_FRIENDS')) return api.featureDisabled(res, 'FEATURE_FRIENDS');
  const result = await FriendRequest.getFriendsList(req.user.id, req.query.cursor, parseInt(req.query.limit) || 20);
  api.paginated(res, result.friends, { nextCursor: result.nextCursor, limit: 20, hasMore: result.hasMore });
}

export async function getRequests(req, res) {
  const requests = await FriendRequest.getPendingForUser(req.user.id);
  api.success(res, { requests });
}

export async function getSentRequests(req, res) {
  const requests = await FriendRequest.getSentByUser(req.user.id);
  api.success(res, { requests });
}

export async function sendRequest(req, res) {
  if (!isEnabled('FEATURE_FRIENDS')) return api.featureDisabled(res, 'FEATURE_FRIENDS');
  if (req.user.id === req.params.userId) return api.error(res, 'CHAT_ERR_072', 'Cannot friend yourself', 400);

  const status = await FriendRequest.getStatus(req.user.id, req.params.userId);
  if (status === 'friends') return api.error(res, 'CHAT_ERR_074', 'Already friends', 400);
  if (status === 'pending_sent') return api.error(res, 'CHAT_ERR_071', 'Request already sent', 409);
  if (status === 'blocked') return api.error(res, 'CHAT_ERR_075', 'Cannot send — user blocked', 403);

  const request = await FriendRequest.create({
    from: req.user.id,
    to: req.params.userId,
    message: req.body.message || '',
  });

  // Send email notification to recipient
  try {
    const recipient = await User.findById(req.params.userId);
    if (recipient && recipient.email && recipient.preferences.notifications.email) {
      await queueEmail({
        to: recipient.email,
        subject: `New friend request from ${req.user.username}`,
        templateName: 'friend-request',
        vars: {
          USERNAME: recipient.username,
          FROM_USERNAME: req.user.username,
          MESSAGE: request.message || 'Wants to be your friend on Chatify!',
          APP_URL: getEnv().CLIENT_URL
        }
      });
    }
  } catch (err) {
    logger.error(`[FRIEND] Failed to queue request email: ${err.message}`);
  }

  // Emit socket event to recipient
  try {
    const chatNs = io.of('/chat');
    chatNs.to(`user:${req.params.userId}`).emit('friend:request', {
      from: req.user.id,
      request: request,
    });
    
    // Also emit a count update
    const unseenCount = await FriendRequest.getUnseenCount(req.params.userId);
    chatNs.to(`user:${req.params.userId}`).emit('friend:request_count_update', { count: unseenCount });
  } catch (err) {
    logger.error(`[FRIEND] Failed to emit request socket: ${err.message}`);
  }

  api.created(res, { request });
}

export async function acceptRequest(req, res) {
  const request = await FriendRequest.findById(req.params.reqId);
  if (!request) return api.notFound(res, 'Request not found');
  if (request.to.toString() !== req.user.id) return api.forbidden(res);
  await request.accept();
  api.success(res, { request });
}

export async function rejectRequest(req, res) {
  const request = await FriendRequest.findById(req.params.reqId);
  if (!request) return api.notFound(res, 'Request not found');
  if (request.to.toString() !== req.user.id) return api.forbidden(res);
  await request.reject();
  api.success(res, { request });
}

export async function cancelRequest(req, res) {
  const request = await FriendRequest.findOne({
    from: req.user.id,
    to: req.params.userId,
    status: 'pending',
  });
  if (!request) return api.notFound(res, 'Request not found');
  await request.cancel();

  // Notify recipient
  try {
    const chatNs = io.of('/chat');
    chatNs.to(`user:${req.params.userId}`).emit('friend:request_cancelled', {
      from: req.user.id,
    });
    
    // Update count for recipient
    const unseenCount = await FriendRequest.getUnseenCount(req.params.userId);
    chatNs.to(`user:${req.params.userId}`).emit('friend:request_count_update', { count: unseenCount });
  } catch (err) {
    logger.error(`[FRIEND] Failed to emit cancel socket: ${err.message}`);
  }

  api.success(res, { message: 'Request cancelled' });
}

export async function removeFriend(req, res) {
  const user = await User.findById(req.user.id);
  const friend = await User.findById(req.params.userId);
  if (!user || !friend) return api.notFound(res);
  user.friends.pull(friend._id);
  friend.friends.pull(user._id);
  await Promise.all([user.save(), friend.save()]);
  api.success(res, { message: 'Friend removed' });
}

export async function getUnseenCount(req, res) {
  const count = await FriendRequest.getUnseenCount(req.user.id);
  api.success(res, { count });
}

export async function markAllSeen(req, res) {
  await FriendRequest.updateMany(
    { to: req.user.id, status: 'pending', seenByReceiver: false },
    { $set: { seenByReceiver: true, seenAt: new Date() } }
  );
  api.success(res, { message: 'All friend requests marked as seen' });
}

export default { 
  getFriends, getRequests, getSentRequests, sendRequest, 
  acceptRequest, rejectRequest, removeFriend, 
  getUnseenCount, markAllSeen, cancelRequest 
};
