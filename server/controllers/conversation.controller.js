/**
 * @fileoverview Conversation controller.
 * @module controllers/conversation.controller
 */

import Conversation from '../models/Conversation.model.js';
import * as api from '../utils/apiResponse.js';
import { isEnabled } from '../utils/featureFlags.js';

export async function getConversations(req, res) {
  const { cursor, limit } = req.query;
  const result = await Conversation.getUserConversations(req.user.id, cursor, parseInt(limit) || 20);
  api.paginated(res, result.conversations, { nextCursor: result.nextCursor, limit: parseInt(limit) || 20, hasMore: result.hasMore });
}

export async function createConversation(req, res) {
  const { userId } = req.body;
  if (req.user.id === userId) return api.error(res, 'CHAT_ERR_045', 'Cannot create DM with yourself', 400);
  const { conversation, created } = await Conversation.findOrCreate(req.user.id, userId);
  const populated = await conversation.populate('participants.userId', 'username displayName avatar isOnline isAnonymous blockedUsers');
  api.success(res, { conversation: populated.toClientObject(req.user.id) }, created ? 201 : 200);
}

export async function getConversation(req, res) {
  const conv = await Conversation.findById(req.params.convId).populate('participants.userId', 'username displayName avatar isOnline onlineStatus lastSeenAt isAnonymous blockedUsers');
  if (!conv) return api.notFound(res, 'Conversation not found');
  if (!conv.participantIds.includes(req.user.id)) return api.forbidden(res, 'Not a participant');
  api.success(res, { conversation: conv.toClientObject(req.user.id) });
}

export async function archiveConversation(req, res) {
  if (!isEnabled('FEATURE_CONVERSATION_ARCHIVE')) return api.featureDisabled(res, 'FEATURE_CONVERSATION_ARCHIVE');
  const conv = await Conversation.findById(req.params.convId);
  if (!conv) return api.notFound(res);
  await conv.archive(req.user.id);
  api.success(res, { message: 'Conversation archived' });
}

export async function unarchiveConversation(req, res) {
  const conv = await Conversation.findById(req.params.convId);
  if (!conv) return api.notFound(res);
  await conv.unarchive(req.user.id);
  api.success(res, { message: 'Conversation unarchived' });
}

export async function setDisappearing(req, res) {
  if (!isEnabled('FEATURE_DISAPPEARING_MESSAGES')) return api.featureDisabled(res, 'FEATURE_DISAPPEARING_MESSAGES');
  const conv = await Conversation.findById(req.params.convId)
    .populate('participants.userId', 'username displayName avatar isOnline onlineStatus lastSeenAt isAnonymous blockedUsers');
  if (!conv) return api.notFound(res);
  
  await conv.toggleDisappearing(req.user.id, req.body.duration);
  
  // Broadcast to both participants
  const { io } = await import('../server.js');
  if (io) {
    conv.participantIds.forEach(id => {
      io.of('/chat').to(`user:${id}`).emit('conversation:updated', conv.toClientObject(id));
    });
  }

  api.success(res, { conversation: conv.toClientObject(req.user.id) });
}

export async function muteConversation(req, res) {
  const conv = await Conversation.findById(req.params.convId);
  if (!conv) return api.notFound(res);
  if (req.body.duration > 0) await conv.mute(req.user.id, req.body.duration);
  else await conv.unmute(req.user.id);
  api.success(res, { message: req.body.duration > 0 ? 'Muted' : 'Unmuted' });
}

export async function deleteConversation(req, res) {
  const conv = await Conversation.findById(req.params.convId);
  if (!conv) return api.notFound(res);
  await conv.softDelete(req.user.id);
  api.success(res, { message: 'Conversation deleted' });
}

export default { getConversations, createConversation, getConversation, archiveConversation, unarchiveConversation, setDisappearing, muteConversation, deleteConversation };
