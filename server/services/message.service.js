/**
 * @fileoverview Message service — business logic layer for message operations.
 * @module services/message.service
 */
import Message from '../models/Message.model.js';
import Conversation from '../models/Conversation.model.js';

export async function createMessage(data) {
  const message = await Message.create(data);
  await message.populate('senderId', 'username displayName avatar');
  if (data.replyTo) await message.populate('replyTo', 'content senderId isDeleted');
  return message;
}

export async function getMessages(convId, cursor, limit) {
  return Message.getConversationMessages(convId, cursor, limit);
}

export async function editMessage(messageId, userId, content, isEncrypted) {
  const msg = await Message.findById(messageId);
  if (!msg) throw new Error('Message not found');
  if (!msg.canEdit(userId)) throw new Error('Cannot edit this message');
  msg._original = { content: msg.content };
  msg.content = content;
  msg.isEncrypted = isEncrypted;
  await msg.save();
  return msg;
}

export async function deleteMessage(messageId, userId, userRole) {
  const msg = await Message.findById(messageId);
  if (!msg) throw new Error('Message not found');
  if (!msg.canDelete(userId, userRole)) throw new Error('Cannot delete');
  await msg.softDelete(userId);
  return msg;
}

export default { createMessage, getMessages, editMessage, deleteMessage };
