/**
 * @fileoverview Message Model — Chatify v1
 * Complete Mongoose schema for 1-to-1 direct messages with encryption support,
 * reactions, replies, pinning, bookmarking, self-destruct, and edit history.
 * 
 * @module models/Message.model
 * @requires mongoose
 */

import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const { Schema, model, Types } = mongoose;

/** @constant {number} MAX_CONTENT_LENGTH - Maximum message content length */
const MAX_CONTENT_LENGTH = 4000;

/** @constant {number} MAX_EDIT_HISTORY - Maximum number of edit history entries kept */
const MAX_EDIT_HISTORY = 5;

/** @constant {number} EDIT_WINDOW_MS - Time window for editing messages (5 minutes) */
const EDIT_WINDOW_MS = 5 * 60 * 1000;

/** @constant {number} PREVIEW_LENGTH - Length of content preview for conversation lastMessage */
const PREVIEW_LENGTH = 50;

/**
 * Edit history entry sub-schema.
 * Stores previous versions of edited messages.
 * @type {Schema}
 */
const editHistorySchema = new Schema({
  /** @type {string} Previous message content */
  content: {
    type: String,
    required: true,
  },
  /** @type {Date} When this edit was made */
  editedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

/**
 * Reaction sub-schema.
 * Tracks emoji reactions with the users who reacted.
 * @type {Schema}
 */
const reactionSchema = new Schema({
  /** @type {string} Emoji character or shortcode */
  emoji: {
    type: String,
    required: true,
    maxlength: 8,
  },
  /** @type {Types.ObjectId[]} Users who used this reaction */
  users: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  /** @type {number} Cached count of users */
  count: {
    type: Number,
    default: 0,
  },
}, { _id: false });

// ═══════════════════════════════════════════════════════════════
// MAIN MESSAGE SCHEMA
// ═══════════════════════════════════════════════════════════════

/**
 * Message schema definition.
 * Handles text messages, system messages, encrypted messages,
 * reactions, replies, pins, bookmarks, and self-destructing messages.
 * @type {Schema}
 */
const messageSchema = new Schema(
  {
    /**
     * Reference to the parent conversation.
     * @type {Types.ObjectId}
     */
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Conversation ID is required'],
      index: true,
    },

    /**
     * User who sent this message.
     * @type {Types.ObjectId}
     */
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
    },

    /**
     * User who should receive this message.
     * @type {Types.ObjectId}
     */
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver ID is required'],
    },

    /**
     * Message content — either plaintext or encrypted ciphertext.
     * When isDeleted=true, content is cleared to "[deleted]".
     * @type {string}
     */
    content: {
      type: String,
      required: [true, 'Message content is required'],
      maxlength: [MAX_CONTENT_LENGTH, `Message cannot exceed ${MAX_CONTENT_LENGTH} characters`],
      trim: true,
    },

    /**
     * Whether the content is AES-256 encrypted.
     * @type {boolean}
     */
    isEncrypted: {
      type: Boolean,
      default: false,
    },

    /**
     * Encryption version identifier for future migration support.
     * @type {string}
     */
    encryptionVersion: {
      type: String,
      default: 'v1',
    },

    /**
     * Message type — text for regular messages, system for automated ones.
     * @type {string}
     */
    type: {
      type: String,
      enum: {
        values: ['text', 'system'],
        message: 'Type must be text or system',
      },
      default: 'text',
    },

    /**
     * Delivery/read status of the message.
     * @type {string}
     */
    status: {
      type: String,
      enum: {
        values: ['sending', 'sent', 'delivered', 'read'],
        message: 'Status must be sending, sent, delivered, or read',
      },
      default: 'sent',
    },

    /**
     * Timestamp when the message was delivered to the recipient's device.
     * @type {Date}
     */
    deliveredAt: {
      type: Date,
      default: null,
    },

    /**
     * Timestamp when the recipient read the message.
     * @type {Date}
     */
    readAt: {
      type: Date,
      default: null,
    },

    /**
     * Whether this message has been edited.
     * @type {boolean}
     */
    isEdited: {
      type: Boolean,
      default: false,
    },

    /**
     * Timestamp of the last edit.
     * @type {Date}
     */
    editedAt: {
      type: Date,
      default: null,
    },

    /**
     * History of previous edits (last 5 stored).
     * @type {Array<{content: string, editedAt: Date}>}
     */
    editHistory: {
      type: [editHistorySchema],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= MAX_EDIT_HISTORY;
        },
        message: `Edit history cannot exceed ${MAX_EDIT_HISTORY} entries`,
      },
    },

    /**
     * Whether this message has been soft-deleted.
     * @type {boolean}
     */
    isDeleted: {
      type: Boolean,
      default: false,
    },

    /**
     * Timestamp of deletion.
     * @type {Date}
     */
    deletedAt: {
      type: Date,
      default: null,
    },

    /**
     * User who deleted this message.
     * @type {Types.ObjectId}
     */
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    /**
     * Reference to the message this is a reply to.
     * @type {Types.ObjectId}
     */
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },

    /**
     * Emoji reactions on this message.
     * @type {Array<{emoji: string, users: Types.ObjectId[], count: number}>}
     */
    reactions: {
      type: [reactionSchema],
      default: [],
    },

    /**
     * Timestamp at which this message should be auto-deleted (TTL).
     * @type {Date}
     */
    selfDestructAt: {
      type: Date,
      default: null,
    },

    /**
     * Whether this message is pinned in the conversation.
     * @type {boolean}
     */
    isPinned: {
      type: Boolean,
      default: false,
    },

    /**
     * Timestamp of when the message was pinned.
     * @type {Date}
     */
    pinnedAt: {
      type: Date,
      default: null,
    },

    /**
     * User who pinned this message.
     * @type {Types.ObjectId}
     */
    pinnedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    /**
     * Array of user IDs who have bookmarked this message.
     * @type {Types.ObjectId[]}
     */
    bookmarkedBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],

    /**
     * Array of user IDs mentioned in this message (@username).
     * @type {Types.ObjectId[]}
     */
    mentionedUsers: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],

    /**
     * Whether this is a system-generated message.
     * @type {boolean}
     */
    isSystemMessage: {
      type: Boolean,
      default: false,
    },

    /**
     * Type of system event for system messages.
     * @type {string}
     */
    systemEventType: {
      type: String,
      enum: {
        values: ['joined', 'left', 'upgraded', 'friend-accepted', null],
        message: 'Invalid system event type',
      },
      default: null,
    },

    /**
     * Client-generated unique ID for optimistic UI deduplication.
     * @type {string}
     */
    clientId: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
    collection: 'messages',
  }
);

// ═══════════════════════════════════════════════════════════════
// INDEXES
// ═══════════════════════════════════════════════════════════════

/** Compound index for fetching conversation messages in order */
messageSchema.index({ conversationId: 1, createdAt: -1 });
/** TTL index for self-destructing messages */
messageSchema.index({ selfDestructAt: 1 }, { expireAfterSeconds: 0 });
/** Text index for full-text search */
messageSchema.index({ content: 'text' });
/** Compound index for pinned messages per conversation */
messageSchema.index({ isPinned: 1, conversationId: 1 });

// ═══════════════════════════════════════════════════════════════
// PRE-SAVE HOOKS
// ═══════════════════════════════════════════════════════════════

/**
 * Pre-save hook: Enforce maximum content length.
 */
messageSchema.pre('save', function (next) {
  if (this.content && this.content.length > MAX_CONTENT_LENGTH) {
    return next(new Error(`Message content exceeds ${MAX_CONTENT_LENGTH} characters`));
  }
  next();
});

/**
 * Pre-save hook: Push to editHistory when content changes on existing doc.
 * Keeps only the last MAX_EDIT_HISTORY entries.
 */
messageSchema.pre('save', function (next) {
  if (!this.isNew && this.isModified('content') && !this.isDeleted) {
    const previousContent = this._original?.content || '';
    if (previousContent && previousContent !== this.content) {
      this.editHistory.push({
        content: previousContent,
        editedAt: new Date(),
      });
      // Keep only last N edits
      if (this.editHistory.length > MAX_EDIT_HISTORY) {
        this.editHistory = this.editHistory.slice(-MAX_EDIT_HISTORY);
      }
      this.isEdited = true;
      this.editedAt = new Date();
    }
  }
  next();
});

/**
 * Pre-save hook: Store original content for edit tracking.
 */
messageSchema.pre('save', function (next) {
  if (!this.isNew) {
    this._original = { content: this._original?.content || this.content };
  }
  next();
});

// ═══════════════════════════════════════════════════════════════
// POST-SAVE HOOKS
// ═══════════════════════════════════════════════════════════════

/**
 * Post-save hook: Update Conversation.lastMessage and updatedAt.
 */
messageSchema.post('save', async function (doc) {
  if (!doc.isNew && !doc.wasNew) return;
  try {
    const Conversation = mongoose.model('Conversation');
    await Conversation.findByIdAndUpdate(doc.conversationId, {
      'lastMessage.messageId': doc._id,
      'lastMessage.content': doc.content?.substring(0, PREVIEW_LENGTH) || '',
      'lastMessage.senderId': doc.senderId,
      'lastMessage.isEncrypted': doc.isEncrypted,
      'lastMessage.createdAt': doc.createdAt,
      $inc: { messageCount: 1 },
    });
  } catch (err) {
    logger.error(`[MESSAGE] Failed to update conversation lastMessage: ${err.message}`);
  }
});

/**
 * Track if document is new for post-save logic.
 */
messageSchema.pre('save', function (next) {
  this.wasNew = this.isNew;
  next();
});

/**
 * Post-save hook: Increment unread count for receiver.
 */
messageSchema.post('save', async function (doc) {
  if (!doc.wasNew || doc.isSystemMessage) return;
  try {
    const Conversation = mongoose.model('Conversation');
    const conv = await Conversation.findById(doc.conversationId);
    if (conv) {
      await conv.incrementUnread(doc.senderId);
    }
  } catch (err) {
    logger.error(`[MESSAGE] Failed to update unread count: ${err.message}`);
  }
});

// ═══════════════════════════════════════════════════════════════
// INSTANCE METHODS
// ═══════════════════════════════════════════════════════════════

/**
 * Check if a user can edit this message.
 * Must be the author and within the edit window.
 * @param {string|Types.ObjectId} userId - User attempting to edit
 * @returns {boolean} True if the user can edit this message
 */
messageSchema.methods.canEdit = function (userId) {
  if (this.senderId.toString() !== userId.toString()) return false;
  if (this.isDeleted) return false;
  if (this.isSystemMessage) return false;
  const elapsed = Date.now() - this.createdAt.getTime();
  return elapsed <= EDIT_WINDOW_MS;
};

/**
 * Check if a user can delete this message.
 * Author can always delete. Admins can delete any message.
 * @param {string|Types.ObjectId} userId - User attempting to delete
 * @param {string} [userRole='user'] - Role of the user
 * @returns {boolean} True if the user can delete this message
 */
messageSchema.methods.canDelete = function (userId, userRole = 'user') {
  if (this.isDeleted) return false;
  if (['admin', 'moderator'].includes(userRole)) return true;
  return this.senderId.toString() === userId.toString();
};

/**
 * Soft-delete this message — clears content, marks as deleted.
 * @param {string|Types.ObjectId} userId - User performing the deletion
 * @returns {Promise<Document>} Updated message document
 */
messageSchema.methods.softDelete = async function (userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.content = '[deleted]';
  this.reactions = [];
  this.isPinned = false;
  this.pinnedAt = null;
  this.pinnedBy = null;
  return this.save();
};

/**
 * Add or toggle a reaction on this message.
 * If the user already reacted with this emoji, remove it. Otherwise add it.
 * @param {string|Types.ObjectId} userId - User reacting
 * @param {string} emoji - Emoji character
 * @returns {Promise<Document>} Updated message document
 */
messageSchema.methods.addReaction = async function (userId, emoji) {
  const existing = this.reactions.find((r) => r.emoji === emoji);
  if (existing) {
    const userIdx = existing.users.findIndex((u) => u.toString() === userId.toString());
    if (userIdx > -1) {
      existing.users.splice(userIdx, 1);
      existing.count = existing.users.length;
      if (existing.count === 0) {
        this.reactions = this.reactions.filter((r) => r.emoji !== emoji);
      }
    } else {
      existing.users.push(userId);
      existing.count = existing.users.length;
    }
  } else {
    this.reactions.push({ emoji, users: [userId], count: 1 });
  }
  return this.save();
};

/**
 * Remove a specific user's reaction.
 * @param {string|Types.ObjectId} userId - User whose reaction to remove
 * @param {string} emoji - Emoji character
 * @returns {Promise<Document>} Updated message document
 */
messageSchema.methods.removeReaction = async function (userId, emoji) {
  const existing = this.reactions.find((r) => r.emoji === emoji);
  if (existing) {
    existing.users = existing.users.filter((u) => u.toString() !== userId.toString());
    existing.count = existing.users.length;
    if (existing.count === 0) {
      this.reactions = this.reactions.filter((r) => r.emoji !== emoji);
    }
    return this.save();
  }
  return this;
};

/**
 * Mark this message as delivered.
 * @returns {Promise<Document>} Updated message document
 */
messageSchema.methods.markDelivered = async function () {
  if (this.status === 'read') return this;
  this.status = 'delivered';
  this.deliveredAt = new Date();
  return this.save();
};

/**
 * Mark this message as read by the specified user.
 * @param {string|Types.ObjectId} userId - User who read the message
 * @returns {Promise<Document>} Updated message document
 */
messageSchema.methods.markRead = async function (userId) {
  if (this.receiverId.toString() !== userId.toString()) return this;
  this.status = 'read';
  this.readAt = new Date();
  if (!this.deliveredAt) this.deliveredAt = this.readAt;
  return this.save();
};

/**
 * Toggle bookmark for a user.
 * @param {string|Types.ObjectId} userId - User toggling the bookmark
 * @returns {Promise<Document>} Updated message document
 */
messageSchema.methods.toggleBookmark = async function (userId) {
  const idx = this.bookmarkedBy.findIndex((u) => u.toString() === userId.toString());
  if (idx > -1) {
    this.bookmarkedBy.splice(idx, 1);
  } else {
    this.bookmarkedBy.push(userId);
  }
  return this.save();
};

/**
 * Convert to a safe object for client consumption.
 * @param {string|Types.ObjectId} viewingUserId - The user viewing this message
 * @returns {Object} Safe message object
 */
messageSchema.methods.toClientObject = function (viewingUserId) {
  const obj = this.toObject();
  // Remove internal fields
  delete obj.__v;
  delete obj.wasNew;
  delete obj._original;
  // Add computed fields
  obj.isOwn = obj.senderId?.toString() === viewingUserId?.toString();
  obj.isBookmarked = obj.bookmarkedBy?.some((u) => u.toString() === viewingUserId?.toString()) || false;
  return obj;
};

// ═══════════════════════════════════════════════════════════════
// STATIC METHODS
// ═══════════════════════════════════════════════════════════════

/**
 * Get messages for a conversation with cursor-based pagination.
 * @param {string|Types.ObjectId} convId - Conversation ID
 * @param {string} [cursor] - Message ID cursor (fetch messages before this)
 * @param {number} [limit=30] - Number of messages to return
 * @returns {Promise<{messages: Document[], nextCursor: string|null, hasMore: boolean}>}
 */
messageSchema.statics.getConversationMessages = async function (convId, cursor, limit = 30) {
  const query = { conversationId: convId };
  if (cursor) {
    query._id = { $lt: new Types.ObjectId(cursor) };
  }
  const messages = await this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .populate('senderId', 'username displayName avatar')
    .populate('replyTo', 'content senderId isDeleted')
    .lean();

  const hasMore = messages.length > limit;
  if (hasMore) messages.pop();
  const nextCursor = hasMore ? messages[messages.length - 1]._id.toString() : null;
  return { messages: messages.reverse(), nextCursor, hasMore };
};

/**
 * Get unread message count for a user in a conversation.
 * @param {string|Types.ObjectId} convId - Conversation ID
 * @param {string|Types.ObjectId} userId - User ID
 * @returns {Promise<number>} Unread count
 */
messageSchema.statics.getUnreadCount = async function (convId, userId) {
  return this.countDocuments({
    conversationId: convId,
    receiverId: userId,
    status: { $in: ['sent', 'delivered'] },
    isDeleted: false,
  });
};

/**
 * Full-text search across messages the user has access to.
 * @param {string} query - Search query
 * @param {string|Types.ObjectId} userId - User performing the search
 * @param {number} [limit=20] - Max results
 * @returns {Promise<Document[]>} Matching messages
 */
messageSchema.statics.searchMessages = async function (query, userId, limit = 20) {
  return this.find({
    content: { $regex: query, $options: 'i' },
    $or: [{ senderId: userId }, { receiverId: userId }],
    isDeleted: false,
    isEncrypted: false,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('senderId', 'username displayName avatar');
};

/**
 * Get pinned messages in a conversation.
 * @param {string|Types.ObjectId} convId - Conversation ID
 * @returns {Promise<Document[]>} Pinned messages
 */
messageSchema.statics.getPinnedMessages = async function (convId) {
  return this.find({ conversationId: convId, isPinned: true, isDeleted: false })
    .sort({ pinnedAt: -1 })
    .populate('senderId', 'username displayName avatar')
    .populate('pinnedBy', 'username displayName');
};

/**
 * Get a user's bookmarked messages across all conversations.
 * @param {string|Types.ObjectId} userId - User ID
 * @returns {Promise<Document[]>} Bookmarked messages
 */
messageSchema.statics.getBookmarked = async function (userId) {
  return this.find({ bookmarkedBy: userId, isDeleted: false })
    .sort({ createdAt: -1 })
    .populate('senderId', 'username displayName avatar')
    .populate('conversationId', 'participants');
};

/**
 * Bulk mark messages as delivered.
 * @param {string[]} messageIds - Array of message IDs
 * @returns {Promise<{modifiedCount: number}>}
 */
messageSchema.statics.bulkMarkDelivered = async function (messageIds) {
  return this.updateMany(
    { _id: { $in: messageIds }, status: 'sent' },
    { $set: { status: 'delivered', deliveredAt: new Date() } }
  );
};

// ═══════════════════════════════════════════════════════════════
// VIRTUALS
// ═══════════════════════════════════════════════════════════════

/**
 * Virtual: Check if the message has expired (self-destruct).
 * @returns {boolean}
 */
messageSchema.virtual('isExpired').get(function () {
  if (!this.selfDestructAt) return false;
  return this.selfDestructAt < new Date();
});

/**
 * Virtual: Get reaction summary as emoji→count map.
 * @returns {Object.<string, number>}
 */
messageSchema.virtual('reactionSummary').get(function () {
  const summary = {};
  if (this.reactions) {
    for (const r of this.reactions) {
      summary[r.emoji] = r.count;
    }
  }
  return summary;
});

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

const Message = model('Message', messageSchema);

export default Message;
