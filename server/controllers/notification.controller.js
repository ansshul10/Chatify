/**
 * @fileoverview Notification controller.
 * @module controllers/notification.controller
 */

import Notification from '../models/Notification.model.js';
import * as api from '../utils/apiResponse.js';
import { io } from '../server.js';

export async function getNotifications(req, res) {
  const result = await Notification.getForUser(req.user.id, req.query.cursor, parseInt(req.query.limit) || 20);
  api.paginated(res, result.notifications, { nextCursor: result.nextCursor, limit: 20, hasMore: result.hasMore });
}

export async function markRead(req, res) {
  const notif = await Notification.findById(req.params.notifId);
  if (!notif) return api.notFound(res);
  if (notif.userId.toString() !== req.user.id) return api.forbidden(res);
  await notif.markRead();
  
  // Emit updated count
  const count = await Notification.getUnreadCount(req.user.id);
  io.of('/chat').to(`user:${req.user.id}`).emit('notification:count_update', { count });

  api.success(res, { notification: notif });
}

export async function markAllRead(req, res) {
  await Notification.markAllRead(req.user.id);
  io.of('/chat').to(`user:${req.user.id}`).emit('notification:count_update', { count: 0 });
  api.success(res, { message: 'All notifications marked as read' });
}

export async function markAllSeen(req, res) {
  await Notification.markAllSeen(req.user.id);
  // We don't necessarily need a socket event for seen unless other devices need to clear badge
  api.success(res, { message: 'All notifications marked as seen' });
}

export async function subscribePush(req, res) {
  // Push subscription storage would go here
  api.success(res, { message: 'Push subscription saved' });
}

export async function unsubscribePush(req, res) {
  api.success(res, { message: 'Push subscription removed' });
}

export async function getUnreadCount(req, res) {
  const count = await Notification.getUnreadCount(req.user.id);
  api.success(res, { count });
}

export default { 
  getNotifications, markRead, markAllRead, 
  subscribePush, unsubscribePush, getUnreadCount,
  markAllSeen 
};
