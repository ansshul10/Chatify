/**
 * @fileoverview Notification service — in-app + push notification creation.
 * @module services/notification.service
 */
import Notification from '../models/Notification.model.js';
import { isEnabled } from '../utils/featureFlags.js';

export async function createNotification(type, userId, actorId, relatedEntity) {
  if (!isEnabled('FEATURE_IN_APP_NOTIFICATIONS')) return null;
  // Try to collapse first
  const groupKey = relatedEntity ? `${type}:${relatedEntity.id}` : '';
  if (groupKey) {
    const collapsed = await Notification.collapseGroup(userId, groupKey);
    if (collapsed) return collapsed;
  }
  return Notification.createFromTemplate(type, userId, actorId, relatedEntity);
}

export async function getUnreadCount(userId) {
  return Notification.getUnreadCount(userId);
}

export default { createNotification, getUnreadCount };
