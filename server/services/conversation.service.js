/**
 * @fileoverview Conversation service — DM management.
 * @module services/conversation.service
 */
import Conversation from '../models/Conversation.model.js';

export async function findOrCreate(userId1, userId2) {
  return Conversation.findOrCreate(userId1, userId2);
}

export async function getUserInbox(userId, cursor, limit) {
  return Conversation.getUserConversations(userId, cursor, limit);
}

export async function getTotalUnread(userId) {
  return Conversation.getTotalUnreadCount(userId);
}

export default { findOrCreate, getUserInbox, getTotalUnread };
