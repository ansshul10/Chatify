/**
 * @fileoverview Conversation Model — Chatify v1
 * Handles 1-to-1 DM conversations between exactly two participants.
 * Includes archiving, muting, blocking, disappearing messages, and per-user state.
 * 
 * @module models/Conversation.model
 * @requires mongoose
 */

import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const { Schema, model, Types } = mongoose;

/**
 * Per-participant state within a conversation.
 * Each participant has their own read position, mute settings, etc.
 * @type {Schema}
 */
const participantSchema = new Schema({
  /** @type {Types.ObjectId} Reference to the User */
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  /** @type {Date} When this user joined the conversation */
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  /** @type {Date} Last time this user read messages in the conversation */
  lastReadAt: {
    type: Date,
    default: null,
  },
  /** @type {number} Number of unread messages for this user */
  unreadCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  /** @type {boolean} Whether this user has archived the conversation */
  isArchived: {
    type: Boolean,
    default: false,
  },
  /** @type {boolean} Whether this user has muted the conversation */
  isMuted: {
    type: Boolean,
    default: false,
  },
  /** @type {Date} When the mute expires (null = indefinite) */
  mutedUntil: {
    type: Date,
    default: null,
  },
  /** @type {Object} Per-user notification preferences for this conversation */
  notificationPrefs: {
    type: String,
    enum: ['mentions', 'all', 'none'],
    default: 'all',
  },
}, { _id: false });

/**
 * Last message preview sub-schema.
 * Denormalized for efficient inbox display without joins.
 * @type {Schema}
 */
const lastMessageSchema = new Schema({
  /** @type {Types.ObjectId} Reference to the actual Message document */
  messageId: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
    default: null,
  },
  /** @type {string} Preview of message content (first 50 chars) */
  content: {
    type: String,
    default: '',
    maxlength: 50,
  },
  /** @type {Types.ObjectId} Who sent the last message */
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  /** @type {boolean} Whether the last message is encrypted */
  isEncrypted: {
    type: Boolean,
    default: false,
  },
  /** @type {Date} When the last message was created */
  createdAt: {
    type: Date,
    default: null,
  },
}, { _id: false });

/**
 * Conversation metadata sub-schema.
 * Aggregate stats for the conversation.
 * @type {Schema}
 */
const metadataSchema = new Schema({
  /** @type {number} Total number of message edits in this conversation */
  totalEdits: { type: Number, default: 0 },
  /** @type {number} Total number of reactions in this conversation */
  totalReactions: { type: Number, default: 0 },
  /** @type {number} Total number of deleted messages in this conversation */
  totalDeletes: { type: Number, default: 0 },
}, { _id: false });

// ═══════════════════════════════════════════════════════════════
// MAIN CONVERSATION SCHEMA
// ═══════════════════════════════════════════════════════════════

/**
 * Conversation schema definition.
 * Represents a 1-to-1 DM channel between exactly two users.
 * @type {Schema}
 */
const conversationSchema = new Schema(
  {
    /**
     * Array of exactly 2 participants with their per-user state.
     * @type {Array<participantSchema>}
     */
    participants: {
      type: [participantSchema],
      validate: {
        validator: function (v) {
          return v.length === 2;
        },
        message: 'DM conversations must have exactly 2 participants',
      },
      required: [true, 'Participants are required'],
    },

    /**
     * Denormalized last message preview for inbox display.
     * @type {lastMessageSchema}
     */
    lastMessage: {
      type: lastMessageSchema,
      default: () => ({}),
    },

    /**
     * Total number of messages in this conversation.
     * @type {number}
     */
    messageCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    /**
     * Whether disappearing messages mode is enabled.
     * @type {boolean}
     */
    isDisappearing: {
      type: Boolean,
      default: false,
    },

    /**
     * Duration in seconds for disappearing messages (e.g., 86400 = 24h).
     * @type {number}
     */
    disappearingDuration: {
      type: Number,
      default: 86400,
      min: 60,      // 1 minute minimum
      max: 604800,  // 7 days maximum
    },

    /**
     * Whether client-side encryption is enabled for this conversation.
     * @type {boolean}
     */
    encryptionEnabled: {
      type: Boolean,
      default: false,
    },

    /**
     * Whether this conversation is pinned in the user's sidebar.
     * @type {boolean}
     */
    isPinned: {
      type: Boolean,
      default: false,
    },

    /**
     * User-set custom title/nickname for the conversation.
     * @type {string}
     */
    customTitle: {
      type: String,
      maxlength: [50, 'Custom title cannot exceed 50 characters'],
      default: '',
    },

    /**
     * Conversation lifecycle status.
     * @type {string}
     */
    status: {
      type: String,
      enum: {
        values: ['active', 'archived', 'deleted'],
        message: 'Status must be active, archived, or deleted',
      },
      default: 'active',
      index: true,
    },

    /**
     * When the conversation was deleted.
     * @type {Date}
     */
    deletedAt: {
      type: Date,
      default: null,
    },

    /**
     * User who deleted the conversation.
     * @type {Types.ObjectId}
     */
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    /**
     * When the conversation was blocked.
     * @type {Date}
     */
    blockedAt: {
      type: Date,
      default: null,
    },

    /**
     * User who blocked the conversation.
     * @type {Types.ObjectId}
     */
    blockedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    /**
     * Aggregate metadata for the conversation.
     * @type {metadataSchema}
     */
    metadata: {
      type: metadataSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
    collection: 'conversations',
  }
);

// ═══════════════════════════════════════════════════════════════
// INDEXES
// ═══════════════════════════════════════════════════════════════

/** Index for finding conversations by participant */
conversationSchema.index({ 'participants.userId': 1 });
/** Index for sorting by most recent activity */
conversationSchema.index({ updatedAt: -1 });
/** Index for sorting by last message time */
conversationSchema.index({ 'lastMessage.createdAt': -1 });

// ═══════════════════════════════════════════════════════════════
// PRE-SAVE HOOKS
// ═══════════════════════════════════════════════════════════════

/**
 * Pre-save hook: Enforce exactly 2 participants for DM conversations.
 */
conversationSchema.pre('save', function (next) {
  if (this.participants.length !== 2) {
    return next(new Error('DM conversations must have exactly 2 participants'));
  }
  next();
});

/**
 * Pre-save hook: Sort participant user IDs for consistent dedup lookup.
 * Ensures [userA, userB] and [userB, userA] produce the same order.
 */
conversationSchema.pre('save', function (next) {
  if (this.isNew) {
    this.participants.sort((a, b) =>
      a.userId.toString().localeCompare(b.userId.toString())
    );
  }
  next();
});

// ═══════════════════════════════════════════════════════════════
// POST-SAVE HOOKS
// ═══════════════════════════════════════════════════════════════

/**
 * Post-save hook: Log conversation creation.
 */
conversationSchema.pre('save', function (next) {
  this.wasNew = this.isNew;
  next();
});

conversationSchema.post('save', function (doc) {
  if (doc.wasNew) {
    const ids = doc.participants.map((p) => p.userId.toString()).join(' ↔ ');
    logger.info(`[CONVERSATION] Created DM: ${doc._id} (${ids})`);
  }
});

// ═══════════════════════════════════════════════════════════════
// INSTANCE METHODS
// ═══════════════════════════════════════════════════════════════

/**
 * Get the other participant in the conversation.
 * @param {string|Types.ObjectId} userId - Current user's ID
 * @returns {Object|null} Other participant object
 */
conversationSchema.methods.getOtherParticipant = function (userId) {
  return this.participants.find(
    (p) => p.userId.toString() !== userId.toString()
  ) || null;
};

/**
 * Get this user's participant object.
 * @param {string|Types.ObjectId} userId - User ID to find
 * @returns {Object|null} This user's participant object
 */
conversationSchema.methods.getParticipant = function (userId) {
  return this.participants.find(
    (p) => p.userId.toString() === userId.toString()
  ) || null;
};

/**
 * Mark all messages as read for a specific user.
 * @param {string|Types.ObjectId} userId - User marking as read
 * @returns {Promise<Document>} Updated conversation
 */
conversationSchema.methods.markRead = async function (userId) {
  const participant = this.getParticipant(userId);
  if (participant) {
    participant.unreadCount = 0;
    participant.lastReadAt = new Date();
    return this.save();
  }
  return this;
};

/**
 * Increment unread count for the other participant (not the sender).
 * @param {string|Types.ObjectId} excludeUserId - User who sent the message (don't increment for them)
 * @returns {Promise<Document>} Updated conversation
 */
conversationSchema.methods.incrementUnread = async function (excludeUserId) {
  const other = this.getOtherParticipant(excludeUserId);
  if (other) {
    other.unreadCount = (other.unreadCount || 0) + 1;
    return this.save();
  }
  return this;
};

/**
 * Archive the conversation for a specific user.
 * @param {string|Types.ObjectId} userId - User archiving
 * @returns {Promise<Document>} Updated conversation
 */
conversationSchema.methods.archive = async function (userId) {
  const participant = this.getParticipant(userId);
  if (participant) {
    participant.isArchived = true;
    return this.save();
  }
  return this;
};

/**
 * Unarchive the conversation for a specific user.
 * @param {string|Types.ObjectId} userId - User unarchiving
 * @returns {Promise<Document>} Updated conversation
 */
conversationSchema.methods.unarchive = async function (userId) {
  const participant = this.getParticipant(userId);
  if (participant) {
    participant.isArchived = false;
    return this.save();
  }
  return this;
};

/**
 * Mute the conversation for a specific user.
 * @param {string|Types.ObjectId} userId - User muting
 * @param {number} duration - Mute duration in seconds (0 = indefinite)
 * @returns {Promise<Document>} Updated conversation
 */
conversationSchema.methods.mute = async function (userId, duration) {
  const participant = this.getParticipant(userId);
  if (participant) {
    participant.isMuted = true;
    participant.mutedUntil = duration > 0 ? new Date(Date.now() + duration * 1000) : null;
    return this.save();
  }
  return this;
};

/**
 * Unmute the conversation for a specific user.
 * @param {string|Types.ObjectId} userId - User unmuting
 * @returns {Promise<Document>} Updated conversation
 */
conversationSchema.methods.unmute = async function (userId) {
  const participant = this.getParticipant(userId);
  if (participant) {
    participant.isMuted = false;
    participant.mutedUntil = null;
    return this.save();
  }
  return this;
};

/**
 * Set a custom title for the conversation (per-conversation, not per-user).
 * @param {string|Types.ObjectId} userId - User setting the title
 * @param {string} title - Custom title
 * @returns {Promise<Document>} Updated conversation
 */
conversationSchema.methods.setCustomTitle = async function (userId, title) {
  this.customTitle = title;
  return this.save();
};

/**
 * Block this conversation — prevents new messages.
 * @param {string|Types.ObjectId} userId - User blocking
 * @returns {Promise<Document>} Updated conversation
 */
conversationSchema.methods.block = async function (userId) {
  this.blockedAt = new Date();
  this.blockedBy = userId;
  return this.save();
};

/**
 * Unblock this conversation.
 * @param {string|Types.ObjectId} userId - User unblocking (must be the blocker)
 * @returns {Promise<Document>} Updated conversation
 */
conversationSchema.methods.unblock = async function (userId) {
  if (this.blockedBy?.toString() === userId.toString()) {
    this.blockedAt = null;
    this.blockedBy = null;
    return this.save();
  }
  return this;
};

/**
 * Check if the conversation is blocked.
 * @returns {boolean} True if blocked
 */
conversationSchema.methods.isBlocked = function () {
  return !!this.blockedAt;
};

/**
 * Soft-delete the conversation for a user.
 * @param {string|Types.ObjectId} userId - User deleting
 * @returns {Promise<Document>} Updated conversation
 */
conversationSchema.methods.softDelete = async function (userId) {
  this.status = 'deleted';
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

/**
 * Toggle disappearing messages mode.
 * @param {string|Types.ObjectId} userId - User toggling
 * @param {number} duration - Duration in seconds
 * @returns {Promise<Document>} Updated conversation
 */
conversationSchema.methods.toggleDisappearing = async function (userId, duration) {
  this.isDisappearing = !this.isDisappearing;
  if (this.isDisappearing && duration) {
    this.disappearingDuration = duration;
  }
  return this.save();
};

/**
 * Convert to a safe client object with populated participant info.
 * @param {string|Types.ObjectId} viewingUserId - The user viewing this conversation
 * @returns {Object} Safe conversation object
 */
conversationSchema.methods.toClientObject = function (viewingUserId) {
  const obj = this.toObject();
  delete obj.__v;
  delete obj.wasNew;

  // Add convenience fields
  const myParticipant = obj.participants.find(
    (p) => (p.userId?._id || p.userId)?.toString() === viewingUserId?.toString()
  );
  const otherParticipant = obj.participants.find(
    (p) => (p.userId?._id || p.userId)?.toString() !== viewingUserId?.toString()
  );

  obj.unreadCount = myParticipant?.unreadCount || 0;
  obj.isArchived = myParticipant?.isArchived || false;
  obj.isMuted = myParticipant?.isMuted || false;
  obj.otherParticipant = otherParticipant || null;

  // Add block status
  const myUser = myParticipant?.userId;
  const otherUser = otherParticipant?.userId;
  const myId = (myUser?._id || myUser)?.toString();
  const otherId = (otherUser?._id || otherUser)?.toString();
  
  if (myUser && otherUser) {
    // I blocked them (Check if otherId is in myUser.blockedUsers)
    const myBlockedList = myUser.blockedUsers || [];
    obj.iBlockedOther = myBlockedList.some(id => (id?._id || id).toString() === otherId);
    
    // They blocked me (Check if myId is in otherUser.blockedUsers)
    const otherBlockedList = otherUser.blockedUsers || [];
    obj.otherBlockedMe = otherBlockedList.some(id => (id?._id || id).toString() === myId);
  }

  return obj;
};

// ═══════════════════════════════════════════════════════════════
// STATIC METHODS
// ═══════════════════════════════════════════════════════════════

/**
 * Find an existing conversation between two users, or create a new one.
 * @param {string|Types.ObjectId} userId1 - First user ID
 * @param {string|Types.ObjectId} userId2 - Second user ID
 * @returns {Promise<{conversation: Document, created: boolean}>}
 */
conversationSchema.statics.findOrCreate = async function (userId1, userId2) {
  // Sort IDs for consistent lookup
  const [id1, id2] = [userId1.toString(), userId2.toString()].sort();

  let conversation = await this.findOne({
    'participants.userId': { $all: [id1, id2] },
    status: { $ne: 'deleted' },
  });

  if (conversation) {
    return { conversation, created: false };
  }

  conversation = await this.create({
    participants: [
      { userId: id1, joinedAt: new Date() },
      { userId: id2, joinedAt: new Date() },
    ],
  });

  return { conversation, created: true };
};

/**
 * Get a user's active conversations with cursor-based pagination.
 * @param {string|Types.ObjectId} userId - User ID
 * @param {string} [cursor] - Cursor (conversation ID)
 * @param {number} [limit=20] - Results per page
 * @returns {Promise<{conversations: Document[], nextCursor: string|null, hasMore: boolean}>}
 */
conversationSchema.statics.getUserConversations = async function (userId, cursor, limit = 20) {
  const query = {
    'participants.userId': userId,
    'participants': { $elemMatch: { userId, isArchived: false } },
    status: 'active',
  };

  if (cursor) {
    const cursorDoc = await this.findById(cursor);
    if (cursorDoc) {
      query.updatedAt = { $lt: cursorDoc.updatedAt };
    }
  }

  const conversations = await this.find(query)
    .sort({ updatedAt: -1 })
    .limit(limit + 1)
    .populate('participants.userId', 'username displayName avatar isOnline onlineStatus lastSeenAt isAnonymous blockedUsers')
    .lean();

  const hasMore = conversations.length > limit;
  if (hasMore) conversations.pop();
  const nextCursor = hasMore ? conversations[conversations.length - 1]._id.toString() : null;

  return { conversations, nextCursor, hasMore };
};

/**
 * Get a user's archived conversations.
 * @param {string|Types.ObjectId} userId - User ID
 * @returns {Promise<Document[]>}
 */
conversationSchema.statics.getArchivedConversations = async function (userId) {
  return this.find({
    'participants': { $elemMatch: { userId, isArchived: true } },
    status: 'active',
  })
    .sort({ updatedAt: -1 })
    .populate('participants.userId', 'username displayName avatar isOnline isAnonymous blockedUsers')
    .lean();
};

/**
 * Get total unread count across all conversations for a user.
 * @param {string|Types.ObjectId} userId - User ID
 * @returns {Promise<number>}
 */
conversationSchema.statics.getTotalUnreadCount = async function (userId) {
  const result = await this.aggregate([
    { $match: { 'participants.userId': new Types.ObjectId(userId), status: 'active' } },
    { $unwind: '$participants' },
    { $match: { 'participants.userId': new Types.ObjectId(userId) } },
    { $group: { _id: null, total: { $sum: '$participants.unreadCount' } } },
  ]);
  return result[0]?.total || 0;
};

/**
 * Search conversations by the other user's name.
 * @param {string|Types.ObjectId} userId - Searching user's ID
 * @param {string} query - Search query
 * @returns {Promise<Document[]>}
 */
conversationSchema.statics.searchConversations = async function (userId, query) {
  const conversations = await this.find({
    'participants.userId': userId,
    status: 'active',
  })
    .populate('participants.userId', 'username displayName avatar isAnonymous blockedUsers')
    .lean();

  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return conversations.filter((conv) => {
    const other = conv.participants.find(
      (p) => p.userId?._id?.toString() !== userId.toString()
    );
    return (
      regex.test(other?.userId?.username || '') ||
      regex.test(other?.userId?.displayName || '')
    );
  });
};

// ═══════════════════════════════════════════════════════════════
// VIRTUALS
// ═══════════════════════════════════════════════════════════════

/**
 * Virtual: Whether the conversation is active.
 * @returns {boolean}
 */
conversationSchema.virtual('isActive').get(function () {
  return this.status === 'active';
});

/**
 * Virtual: Array of just participant user IDs.
 * @returns {string[]}
 */
conversationSchema.virtual('participantIds').get(function () {
  return this.participants.map((p) => p.userId?.toString?.() || p.userId);
});

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

const Conversation = model('Conversation', conversationSchema);

export default Conversation;
