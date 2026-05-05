/**
 * @fileoverview Socket.io real-time messaging engine — Chatify v1.
 * Handles all real-time events: messages, typing, presence, reactions,
 * read receipts, pins, friend events. All 1-to-1 DM only.
 * 
 * @module socket
 */

import Message from './models/Message.model.js';
import Conversation from './models/Conversation.model.js';
import User from './models/User.model.js';
import Notification from './models/Notification.model.js';
import { isEnabled } from './utils/featureFlags.js';
import {
  logSocketIn, logSocketOut, logSocketConnect,
  logSocketDisconnect, logSocketError,
} from './utils/socketLogger.js';
import logger from './utils/logger.js';

/**
 * Initialize all socket event handlers on the /chat namespace.
 * @param {import('socket.io').Namespace} chatNs - The /chat namespace
 */
export function initSocketHandlers(chatNs) {
  chatNs.on('connection', (socket) => {
    const userId = socket.user?.id;
    if (!userId) {
      socket.disconnect(true);
      return;
    }

    // ── Join personal room ──
    socket.join(`user:${userId}`);
    
    // ── Join admin room if applicable ──
    if (socket.user?.role === 'admin') {
      socket.join('admin_room');
      logger.info(`[SOCKET] Admin joined admin_room: ${userId}`);
    }
    
    logSocketConnect(socket.id, userId);

    // ── Update online status ──
    handleConnect(chatNs, socket, userId);

    // ═══════════════════════════════════════════════════
    // MESSAGE EVENTS
    // ═══════════════════════════════════════════════════

    /**
     * message:send — Create and broadcast a new message.
     * Payload: { conversationId, content, isEncrypted, replyTo?, clientId }
     */
    socket.on('message:send', async (data) => {
      try {
        logSocketIn('message:send', userId, `conv:${data.conversationId}`);

        const { conversationId, content, isEncrypted, replyTo, clientId } = data;

        // Validate
        if (!conversationId || !content || !clientId) {
          return emitError(socket, 'CHAT_ERR_091', 'Missing required fields');
        }

        if (content.length > 4000) {
          return emitError(socket, 'CHAT_ERR_054', 'Message too long');
        }

        // Check conversation exists and user is participant
        const conv = await Conversation.findById(conversationId);
        if (!conv) return emitError(socket, 'CHAT_ERR_040', 'Conversation not found');
        if (!conv.participantIds.includes(userId)) {
          return emitError(socket, 'CHAT_ERR_041', 'Not a participant');
        }
        if (conv.isBlocked()) {
          return emitError(socket, 'CHAT_ERR_043', 'Conversation is blocked');
        }

        const sender = await User.findById(userId).select('blockedUsers');
        const other = conv.getOtherParticipant(userId);
        if (!other) return emitError(socket, 'CHAT_ERR_040', 'Other participant not found');
        const receiverId = other.userId;
        const receiver = await User.findById(receiverId).select('blockedUsers preferences');

        // Check if sender blocked receiver
        if (sender.blockedUsers?.some(id => id.toString() === receiverId.toString())) {
          return emitError(socket, 'CHAT_ERR_043', 'You have blocked this user');
        }
        // Check if receiver blocked sender
        if (receiver.blockedUsers?.some(id => id.toString() === userId.toString())) {
          return emitError(socket, 'CHAT_ERR_044', 'This user has blocked you');
        }

        // Dedup by clientId
        const existing = await Message.findOne({ clientId });
        if (existing) {
          socket.emit('message:ack', {
            clientId,
            _id: existing._id,
            createdAt: existing.createdAt,
          });
          return;
        }


        // Check receiver presence and visibility
        const receiverSockets = await chatNs.in(`user:${other.userId}`).fetchSockets();
        const isReceiverOnline = receiverSockets.length > 0;
        const receiverRooms = chatNs.adapter.rooms.get(`conv:${conversationId}`);
        const isReceiverViewing = receiverSockets.some(s => receiverRooms?.has(s.id));

        let initialStatus = 'sent';
        if (isReceiverViewing) initialStatus = 'read';
        else if (isReceiverOnline) initialStatus = 'delivered';

        // Create message
        const message = await Message.create({
          conversationId,
          senderId: userId,
          receiverId: other.userId,
          content,
          isEncrypted: isEncrypted || false,
          replyTo: replyTo || null,
          clientId,
          status: initialStatus,
          readAt: isReceiverViewing ? new Date() : null,
          deliveredAt: (isReceiverViewing || isReceiverOnline) ? new Date() : null,
          selfDestructAt: data.selfDestructMinutes
            ? new Date(Date.now() + data.selfDestructMinutes * 60000)
            : null,
        });

        // Populate sender for broadcast
        await message.populate('senderId', 'username displayName avatar');
        if (replyTo) {
          await message.populate('replyTo', 'content senderId isDeleted');
        }

        // Acknowledge to sender (for clientId deduplication)
        socket.emit('message:ack', {
          clientId,
          _id: message._id,
          createdAt: message.createdAt,
        });

        // Send full message back to sender so their UI updates
        socket.emit('message:new', message.toClientObject(userId));

        // Update conversation unread count for the other participant ONLY if they are not currently viewing it
        if (!isReceiverViewing) {
          await conv.incrementUnread(userId);
        }

        // Broadcast to the other user
        chatNs.to(`user:${other.userId}`).emit('message:new', message.toClientObject(other.userId.toString()));
        logSocketOut('message:new', other.userId.toString(), `msg:${message._id}`);

        // Update conversation list for both users (to sync unread counts/last message)
        const updatedConv = await Conversation.findById(conversationId)
          .populate('participants.userId', 'username displayName avatar isOnline onlineStatus lastSeenAt isAnonymous blockedUsers');
        
        if (updatedConv) {
          chatNs.to(`user:${userId}`).emit('conversation:updated', updatedConv.toClientObject(userId));
          chatNs.to(`user:${other.userId}`).emit('conversation:updated', updatedConv.toClientObject(other.userId.toString()));
        }

        // Create notification for recipient if allowed
        if (isEnabled('FEATURE_IN_APP_NOTIFICATIONS')) {
          try {
            // 1. Skip if receiver is already viewing the chat
            if (isReceiverViewing) return;

            // 2. Respect push notification setting
            if (receiver?.preferences?.notifications?.push === false) {
              return; // User disabled notifications
            }

            // Determine a single valid channel string for the model enum
            let channelValue = 'in_app';
            const pushEnabled = receiver?.preferences?.notifications?.push !== false;
            const emailEnabled = receiver?.preferences?.notifications?.email !== false;

            if (pushEnabled && emailEnabled) {
              channelValue = 'all';
            } else if (pushEnabled) {
              channelValue = 'push';
            } else if (emailEnabled) {
              channelValue = 'email';
            }

            const notif = await Notification.createFromTemplate(
              'message', other.userId, userId,
              { type: 'conversation', id: conversationId },
              channelValue
            );
            chatNs.to(`user:${other.userId}`).emit('notification:new', notif);
          } catch (err) {
            logger.error(`[SOCKET] Notification creation failed: ${err.message}`);
          }
        }

      } catch (err) {
        logSocketError('message:send', userId, err);
        emitError(socket, 'CHAT_ERR_500', 'Failed to send message');
      }
    });

    /**
     * message:edit — Edit an existing message.
     * Payload: { messageId, content, isEncrypted }
     */
    socket.on('message:edit', async (data) => {
      try {
        logSocketIn('message:edit', userId, `msg:${data.messageId}`);

        if (!isEnabled('FEATURE_MESSAGE_EDIT')) {
          return emitError(socket, 'CHAT_ERR_010', 'Message editing is disabled');
        }

        const msg = await Message.findById(data.messageId);
        if (!msg) return emitError(socket, 'CHAT_ERR_050', 'Message not found');
        if (!msg.canEdit(userId)) {
          return emitError(socket, 'CHAT_ERR_052', 'Cannot edit this message');
        }

        msg._original = { content: msg.content };
        msg.content = data.content;
        msg.isEncrypted = data.isEncrypted || false;
        await msg.save();

        // Broadcast update to both users in the conversation
        chatNs.to(`user:${msg.senderId}`).to(`user:${msg.receiverId}`)
          .emit('message:updated', msg.toClientObject(userId));

        logSocketOut('message:updated', msg.receiverId.toString());
      } catch (err) {
        logSocketError('message:edit', userId, err);
        emitError(socket, 'CHAT_ERR_500', 'Failed to edit message');
      }
    });

    /**
     * message:delete — Soft-delete a message.
     * Payload: { messageId }
     */
    socket.on('message:delete', async (data) => {
      try {
        logSocketIn('message:delete', userId, `msg:${data.messageId}`);

        if (!isEnabled('FEATURE_MESSAGE_DELETE')) {
          return emitError(socket, 'CHAT_ERR_010', 'Message deletion is disabled');
        }

        const msg = await Message.findById(data.messageId);
        if (!msg) return emitError(socket, 'CHAT_ERR_050', 'Message not found');
        if (!msg.canDelete(userId, socket.user?.role)) {
          return emitError(socket, 'CHAT_ERR_053', 'Cannot delete this message');
        }

        await msg.softDelete(userId);

        chatNs.to(`user:${msg.senderId}`).to(`user:${msg.receiverId}`)
          .emit('message:deleted', { messageId: msg._id });

        logSocketOut('message:deleted', msg.receiverId.toString());
      } catch (err) {
        logSocketError('message:delete', userId, err);
        emitError(socket, 'CHAT_ERR_500', 'Failed to delete message');
      }
    });

    /**
     * message:react — Toggle reaction on a message.
     * Payload: { messageId, emoji }
     */
    socket.on('message:react', async (data) => {
      try {
        logSocketIn('message:react', userId, `${data.emoji} on ${data.messageId}`);

        if (!isEnabled('FEATURE_REACTIONS')) {
          return emitError(socket, 'CHAT_ERR_010', 'Reactions are disabled');
        }

        const msg = await Message.findById(data.messageId);
        if (!msg) return emitError(socket, 'CHAT_ERR_050', 'Message not found');

        await msg.addReaction(userId, data.emoji);

        chatNs.to(`user:${msg.senderId}`).to(`user:${msg.receiverId}`)
          .emit('message:reaction', {
            messageId: msg._id,
            reactions: msg.reactions,
          });

        logSocketOut('message:reaction', msg.receiverId.toString());
      } catch (err) {
        logSocketError('message:react', userId, err);
        emitError(socket, 'CHAT_ERR_500', 'Failed to react');
      }
    });

    /**
     * message:read — Mark a message as read.
     * Payload: { messageId, conversationId }
     */
    socket.on('message:read', async (data) => {
      try {
        logSocketIn('message:read', userId, `msg:${data.messageId}`);

        if (!isEnabled('FEATURE_READ_RECEIPTS')) return;

        const msg = await Message.findById(data.messageId);
        if (!msg) return;
        if (msg.receiverId.toString() !== userId) return;

        await msg.markRead(userId);

        if (data.conversationId) {
          const conv = await Conversation.findById(data.conversationId);
          if (conv) {
            await conv.markRead(userId);
            // Clear in-app notifications
            await Notification.markRelatedRead(userId, 'conversation', data.conversationId);
            const newNotifCount = await Notification.getUnreadCount(userId);
            chatNs.to(`user:${userId}`).emit('notification:count_update', { count: newNotifCount });

            chatNs.to(`user:${userId}`).emit('conversation:updated', conv.toClientObject(userId));
          }
        }

        // Notify sender of read receipt ONLY if both parties allow it
        const sender = await User.findById(msg.senderId).select('preferences.privacy.showReadReceipts');
        const receiver = await User.findById(userId).select('preferences.privacy.showReadReceipts');
        
        const canNotify = sender?.preferences?.privacy?.showReadReceipts !== false && 
                          receiver?.preferences?.privacy?.showReadReceipts !== false;

        if (canNotify) {
          chatNs.to(`user:${msg.senderId}`).emit('message:read', {
            messageId: msg._id,
            readAt: msg.readAt,
          });
          logSocketOut('message:read', msg.senderId.toString());
        }
      } catch (err) {
        logSocketError('message:read', userId, err);
      }
    });

    /**
     * message:pin — Toggle pin on a message.
     * Payload: { messageId }
     */
    socket.on('message:pin', async (data) => {
      try {
        logSocketIn('message:pin', userId, `msg:${data.messageId}`);

        if (!isEnabled('FEATURE_MESSAGE_PIN')) {
          return emitError(socket, 'CHAT_ERR_010', 'Pinning is disabled');
        }

        const msg = await Message.findById(data.messageId);
        if (!msg) return emitError(socket, 'CHAT_ERR_050', 'Message not found');

        msg.isPinned = !msg.isPinned;
        msg.pinnedAt = msg.isPinned ? new Date() : null;
        msg.pinnedBy = msg.isPinned ? userId : null;
        await msg.save();

        chatNs.to(`user:${msg.senderId}`).to(`user:${msg.receiverId}`)
          .emit('message:pinned', {
            messageId: msg._id,
            isPinned: msg.isPinned,
          });

        logSocketOut('message:pinned', msg.receiverId.toString());
      } catch (err) {
        logSocketError('message:pin', userId, err);
        emitError(socket, 'CHAT_ERR_500', 'Failed to pin');
      }
    });

    // ═══════════════════════════════════════════════════
    // TYPING EVENTS
    // ═══════════════════════════════════════════════════

    /**
     * typing:start — Broadcast typing indicator to other participant.
     * Payload: { conversationId }
     */
    socket.on('typing:start', async (data) => {
      try {
        if (!isEnabled('FEATURE_TYPING_INDICATORS')) return;

        const conv = await Conversation.findById(data.conversationId);
        if (!conv) return;

        const other = conv.getOtherParticipant(userId);
        if (!other) return;

        // Check if user allows typing visibility
        const user = await User.findById(userId).select('preferences.privacy.showTyping');
        if (user?.preferences?.privacy?.showTyping === false && isEnabled('FEATURE_TYPING_PRIVACY')) return;

        chatNs.to(`user:${other.userId}`).emit('typing:update', {
          conversationId: data.conversationId,
          userId,
          isTyping: true,
        });
      } catch (err) {
        logSocketError('typing:start', userId, err);
      }
    });

    /**
     * typing:stop — Clear typing indicator.
     * Payload: { conversationId }
     */
    socket.on('typing:stop', async (data) => {
      try {
        if (!isEnabled('FEATURE_TYPING_INDICATORS')) return;

        const conv = await Conversation.findById(data.conversationId);
        if (!conv) return;

        const other = conv.getOtherParticipant(userId);
        if (!other) return;

        chatNs.to(`user:${other.userId}`).emit('typing:update', {
          conversationId: data.conversationId,
          userId,
          isTyping: false,
        });
      } catch (err) {
        logSocketError('typing:stop', userId, err);
      }
    });

    // ═══════════════════════════════════════════════════
    // PRESENCE EVENTS
    // ═══════════════════════════════════════════════════

    /**
     * presence:away — Set user status to away.
     */
    socket.on('presence:away', async () => {
      try {
        if (!isEnabled('FEATURE_ONLINE_STATUS')) return;

        await User.findByIdAndUpdate(userId, {
          onlineStatus: 'away',
          lastSeenAt: new Date(),
        });

        // Broadcast to all friends
        const user = await User.findById(userId).select('friends');
        if (user?.friends) {
          for (const friendId of user.friends) {
            chatNs.to(`user:${friendId}`).emit('presence:update', {
              userId,
              status: 'away',
            });
          }
        }

        logSocketIn('presence:away', userId);
      } catch (err) {
        logSocketError('presence:away', userId, err);
      }
    });

    /**
     * presence:active — Set user status back to online.
     */
    socket.on('presence:active', async () => {
      try {
        if (!isEnabled('FEATURE_ONLINE_STATUS')) return;

        await User.findByIdAndUpdate(userId, {
          onlineStatus: 'online',
          isOnline: true,
          lastSeenAt: new Date(),
        });

        const user = await User.findById(userId).select('friends');
        if (user?.friends) {
          for (const friendId of user.friends) {
            chatNs.to(`user:${friendId}`).emit('presence:update', {
              userId,
              status: 'online',
            });
          }
        }

        logSocketIn('presence:active', userId);
      } catch (err) {
        logSocketError('presence:active', userId, err);
      }
    });

    // ═══════════════════════════════════════════════════
    // CONVERSATION EVENTS
    // ═══════════════════════════════════════════════════

    /**
     * conversation:open — Mark messages as delivered, join conv room.
     * Payload: { conversationId }
     */
    socket.on('conversation:open', async (data) => {
      try {
        logSocketIn('conversation:open', userId, `conv:${data.conversationId}`);

        socket.join(`conv:${data.conversationId}`);

        // Mark undelivered messages as delivered
        const undelivered = await Message.find({
          conversationId: data.conversationId,
          receiverId: userId,
          status: 'sent',
        }).select('_id');

        if (undelivered.length > 0) {
          const ids = undelivered.map((m) => m._id);
          await Message.bulkMarkDelivered(ids);

          // Mark conversation as read
          const conv = await Conversation.findById(data.conversationId);
          if (conv) {
            await conv.markRead(userId);

            // Clear in-app notifications for this conversation
            await Notification.markRelatedRead(userId, 'conversation', data.conversationId);
            const newNotifCount = await Notification.getUnreadCount(userId);
            chatNs.to(`user:${userId}`).emit('notification:count_update', { count: newNotifCount });
            
            // Notify user's all sockets to clear their unread badge locally
            chatNs.to(`user:${userId}`).emit('conversation:updated', conv.toClientObject(userId));

            const other = conv.getOtherParticipant(userId);
            if (other) {
              const otherId = other.userId.toString();
              const canShow = await canShowReadReceipts(userId, otherId);
              
              if (canShow) {
                // Get all unread messages from other user in this conversation
                const unreadMessages = await Message.find({
                  conversationId: data.conversationId,
                  senderId: otherId,
                  receiverId: userId,
                  status: { $in: ['sent', 'delivered'] }
                });

                for (const msg of unreadMessages) {
                  chatNs.to(`user:${otherId}`).emit('message:read', {
                    messageId: msg._id,
                    conversationId: data.conversationId,
                    readAt: new Date(),
                  });
                }
              }

              // Also handle delivery for messages that were just 'sent'
              for (const id of ids) {
                chatNs.to(`user:${otherId}`).emit('message:delivered', {
                  messageId: id,
                });
              }
            }
          }
        }
      } catch (err) {
        logSocketError('conversation:open', userId, err);
      }
    });

    /**
     * conversation:leave — Leave conv room (but keep notifications).
     * Payload: { conversationId }
     */
    socket.on('conversation:leave', (data) => {
      logSocketIn('conversation:leave', userId, `conv:${data.conversationId}`);
      socket.leave(`conv:${data.conversationId}`);
    });

    // ═══════════════════════════════════════════════════
    // FRIEND EVENTS
    // ═══════════════════════════════════════════════════

    /**
     * friend:request — Real-time notification when friend request is sent.
     * This is called from the REST API via a helper, not directly from client.
     * Payload: { to, from, request }
     */
    socket.on('friend:request', (data) => {
      try {
        if (!isEnabled('FEATURE_FRIENDS')) return;
        chatNs.to(`user:${data.to}`).emit('friend:request', {
          from: data.from,
          request: data.request,
        });
        logSocketOut('friend:request', data.to);
      } catch (err) {
        logSocketError('friend:request', userId, err);
      }
    });

    /**
     * friend:accepted — Notify requester that their request was accepted.
     * Payload: { to, by }
     */
    socket.on('friend:accepted', (data) => {
      try {
        if (!isEnabled('FEATURE_FRIENDS')) return;
        chatNs.to(`user:${data.to}`).emit('friend:accepted', {
          by: data.by,
        });
        logSocketOut('friend:accepted', data.to);
      } catch (err) {
        logSocketError('friend:accepted', userId, err);
      }
    });

    // ═══════════════════════════════════════════════════
    // DISCONNECT
    // ═══════════════════════════════════════════════════

    socket.on('disconnect', (reason) => {
      handleDisconnect(chatNs, socket, userId, reason);
    });
  });

  logger.info('[SOCKET] Handlers initialized on /chat namespace');
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Handle user connection — set online, broadcast presence.
 * @param {import('socket.io').Namespace} chatNs
 * @param {import('socket.io').Socket} socket
 * @param {string} userId
 */
async function handleConnect(chatNs, socket, userId) {
  try {
    if (!isEnabled('FEATURE_ONLINE_STATUS')) return;

    const user = await User.findById(userId).select('friends preferences.privacy');
    if (!user) return;

    const hideStatus = user.preferences?.privacy?.showLastSeen === false && isEnabled('FEATURE_HIDE_ONLINE_STATUS');

    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      onlineStatus: hideStatus ? 'offline' : 'online',
      lastSeenAt: new Date(),
    });

    const status = hideStatus ? 'offline' : 'online';

    // Broadcast to ALL connected users
    socket.broadcast.emit('presence:online', { 
      userId, 
      status 
    });

    // Also broadcast to friends specifically (kept for compatibility)
    if (user.friends) {
      for (const friendId of user.friends) {
        chatNs.to(`user:${friendId}`).emit('presence:online', { 
          userId, 
          status 
        });
      }
    }
  } catch (err) {
    logSocketError('connect', userId, err);
  }
}

/**
 * Handle user disconnection — set offline, broadcast presence.
 * @param {import('socket.io').Namespace} chatNs
 * @param {import('socket.io').Socket} socket
 * @param {string} userId
 * @param {string} reason
 */
async function handleDisconnect(chatNs, socket, userId, reason) {
  logSocketDisconnect(socket.id, userId, reason);

  try {
    if (!isEnabled('FEATURE_ONLINE_STATUS')) return;

    // Check if user has other active sockets
    const rooms = chatNs.adapter.rooms.get(`user:${userId}`);
    if (rooms && rooms.size > 0) return; // Still has connections

    const now = new Date();
    await User.findByIdAndUpdate(userId, {
      isOnline: false,
      onlineStatus: 'offline',
      lastSeenAt: now,
    });

    // Broadcast to ALL connected users
    chatNs.emit('presence:offline', { userId, lastSeen: now });

    // Also broadcast to friends specifically (kept for compatibility)
    const user = await User.findById(userId).select('friends');
    if (user?.friends) {
      for (const friendId of user.friends) {
        chatNs.to(`user:${friendId}`).emit('presence:offline', {
          userId,
          lastSeen: now,
        });
      }
    }
  } catch (err) {
    logSocketError('disconnect', userId, err);
  }
}

/**
 * Emit an error event to a specific socket.
 * @param {import('socket.io').Socket} socket
 * @param {string} code
 * @param {string} message
 */
function emitError(socket, code, message) {
  socket.emit('error', { code, message });
}

export default { initSocketHandlers };
