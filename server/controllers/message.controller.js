/**
 * @fileoverview Message controller.
 * @module controllers/message.controller
 */

import Message from '../models/Message.model.js';
import Conversation from '../models/Conversation.model.js';
import * as api from '../utils/apiResponse.js';
import { isEnabled } from '../utils/featureFlags.js';

export async function getMessages(req, res) {
  const { cursor, limit } = req.query;
  const conv = await Conversation.findById(req.params.convId);
  if (!conv) return api.notFound(res, 'Conversation not found');
  if (!conv.participantIds.includes(req.user.id)) return api.forbidden(res);
  const result = await Message.getConversationMessages(req.params.convId, cursor, parseInt(limit) || 30);
  api.paginated(res, result.messages, { nextCursor: result.nextCursor, limit: parseInt(limit) || 30, hasMore: result.hasMore });
}

export async function sendMessage(req, res) {
  const conv = await Conversation.findById(req.params.convId).populate('participants.userId', 'blockedUsers');
  if (!conv) return api.notFound(res, 'Conversation not found');
  if (conv.isBlocked()) return api.error(res, 'CHAT_ERR_043', 'Conversation is blocked', 403);
  
  const myParticipant = conv.getParticipant(req.user.id);
  const otherParticipant = conv.getOtherParticipant(req.user.id);
  
  const myUser = myParticipant.userId;
  const otherUser = otherParticipant.userId;

  // I blocked them
  if (myUser.blockedUsers?.some(id => id.toString() === otherUser._id.toString())) {
    return api.error(res, 'CHAT_ERR_043', 'You have blocked this user', 403);
  }
  // They blocked me
  if (otherUser.blockedUsers?.some(id => id.toString() === myUser._id.toString())) {
    return api.error(res, 'CHAT_ERR_044', 'This user has blocked you', 403);
  }

  const message = await Message.create({
    conversationId: req.params.convId,
    senderId: req.user.id,
    receiverId: otherUser._id,
    content: req.body.content,
    isEncrypted: req.body.isEncrypted || false,
    replyTo: req.body.replyTo || null,
    clientId: req.body.clientId,
    selfDestructAt: req.body.selfDestructMinutes ? new Date(Date.now() + req.body.selfDestructMinutes * 60000) : null,
  });
  api.created(res, { message: message.toClientObject(req.user.id) });
}

export async function editMessage(req, res) {
  if (!isEnabled('FEATURE_MESSAGE_EDIT')) return api.featureDisabled(res, 'FEATURE_MESSAGE_EDIT');
  const msg = await Message.findById(req.params.msgId);
  if (!msg) return api.notFound(res);
  if (!msg.canEdit(req.user.id)) return api.error(res, 'CHAT_ERR_052', 'Cannot edit this message', 403);
  msg._original = { content: msg.content };
  msg.content = req.body.content;
  msg.isEncrypted = req.body.isEncrypted || false;
  await msg.save();
  api.success(res, { message: msg.toClientObject(req.user.id) });
}

export async function deleteMessage(req, res) {
  if (!isEnabled('FEATURE_MESSAGE_DELETE')) return api.featureDisabled(res, 'FEATURE_MESSAGE_DELETE');
  const msg = await Message.findById(req.params.msgId);
  if (!msg) return api.notFound(res);
  if (!msg.canDelete(req.user.id, req.user.role)) return api.error(res, 'CHAT_ERR_053', 'Cannot delete this message', 403);
  await msg.softDelete(req.user.id);
  api.success(res, { message: 'Message deleted' });
}

export async function reactToMessage(req, res) {
  if (!isEnabled('FEATURE_REACTIONS')) return api.featureDisabled(res, 'FEATURE_REACTIONS');
  const msg = await Message.findById(req.params.msgId);
  if (!msg) return api.notFound(res);
  await msg.addReaction(req.user.id, req.body.emoji);
  api.success(res, { reactions: msg.reactions });
}

export async function bookmarkMessage(req, res) {
  if (!isEnabled('FEATURE_MESSAGE_BOOKMARKS')) return api.featureDisabled(res, 'FEATURE_MESSAGE_BOOKMARKS');
  const msg = await Message.findById(req.params.msgId);
  if (!msg) return api.notFound(res);
  await msg.toggleBookmark(req.user.id);
  api.success(res, { bookmarked: msg.bookmarkedBy.includes(req.user.id) });
}

export async function pinMessage(req, res) {
  if (!isEnabled('FEATURE_MESSAGE_PIN')) return api.featureDisabled(res, 'FEATURE_MESSAGE_PIN');
  const msg = await Message.findById(req.params.msgId);
  if (!msg) return api.notFound(res);
  msg.isPinned = !msg.isPinned;
  msg.pinnedAt = msg.isPinned ? new Date() : null;
  msg.pinnedBy = msg.isPinned ? req.user.id : null;
  await msg.save();
  api.success(res, { isPinned: msg.isPinned });
}

export async function searchMessages(req, res) {
  if (!isEnabled('FEATURE_MESSAGE_SEARCH')) return api.featureDisabled(res, 'FEATURE_MESSAGE_SEARCH');
  const results = await Message.searchMessages(req.query.q, req.user.id);
  api.success(res, { messages: results });
}

export async function getBookmarked(req, res) {
  const messages = await Message.getBookmarked(req.user.id);
  api.success(res, { messages });
}

export default { getMessages, sendMessage, editMessage, deleteMessage, reactToMessage, bookmarkMessage, pinMessage, searchMessages, getBookmarked };
