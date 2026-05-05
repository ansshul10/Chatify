/**
 * @fileoverview Notification Model — Chatify v1
 * Handles in-app notifications, push notifications, and email notifications.
 * Supports grouping/collapsing similar notifications, priority levels,
 * multiple channels, and template-based creation.
 * 
 * @module models/Notification.model
 * @requires mongoose
 */

import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const { Schema, model, Types } = mongoose;

/** @constant {number} DEFAULT_EXPIRY_DAYS - Days before notifications auto-expire */
const DEFAULT_EXPIRY_DAYS = 90;

/**
 * Actor sub-schema — denormalized info about who triggered the notification.
 * Avoids a populate call when rendering notification lists.
 * @type {Schema}
 */
const actorSchema = new Schema({
  /** @type {Types.ObjectId} User who triggered the notification */
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  /** @type {string} Username at notification time */
  username: {
    type: String,
    required: true,
  },
  /** @type {string} Avatar URL at notification time */
  avatar: {
    type: String,
    default: '',
  },
}, { _id: false });

/**
 * Related entity sub-schema — links the notification to a specific resource.
 * @type {Schema}
 */
const relatedEntitySchema = new Schema({
  /** @type {string} Type of the related entity */
  type: {
    type: String,
    enum: {
      values: ['message', 'conversation', 'user', 'friend_request'],
      message: 'Related entity type must be message, conversation, user, or friend_request',
    },
    required: true,
  },
  /** @type {Types.ObjectId} ID of the related entity */
  id: {
    type: Schema.Types.ObjectId,
    required: true,
  },
}, { _id: false });

// ═══════════════════════════════════════════════════════════════
// MAIN NOTIFICATION SCHEMA
// ═══════════════════════════════════════════════════════════════

/**
 * Notification schema definition.
 * Supports multiple notification types, channels, priorities,
 * and grouping/collapsing similar notifications.
 * @type {Schema}
 */
const notificationSchema = new Schema(
  {
    /**
     * User who receives this notification.
     * @type {Types.ObjectId}
     */
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },

    /**
     * Notification type for categorization and rendering.
     * @type {string}
     */
    type: {
      type: String,
      enum: {
        values: [
          'message',
          'friend_request',
          'friend_accepted',
          'mention',
          'system',
          'security',
          'reaction',
          'pin',
        ],
        message: 'Invalid notification type',
      },
      required: [true, 'Notification type is required'],
      index: true,
    },

    /**
     * Notification title — short, descriptive heading.
     * @type {string}
     */
    title: {
      type: String,
      required: [true, 'Title is required'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
      trim: true,
    },

    /**
     * Notification body — detailed description.
     * @type {string}
     */
    body: {
      type: String,
      maxlength: [500, 'Body cannot exceed 500 characters'],
      default: '',
      trim: true,
    },

    /**
     * Whether the notification has been read by the user.
     * @type {boolean}
     */
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    /**
     * When the notification was read.
     * @type {Date}
     */
    readAt: {
      type: Date,
      default: null,
    },

    /**
     * Whether the notification has been seen (appeared in viewport).
     * Different from read — seen means the user scrolled past it.
     * @type {boolean}
     */
    isSeen: {
      type: Boolean,
      default: false,
    },

    /**
     * When the notification was seen.
     * @type {Date}
     */
    seenAt: {
      type: Date,
      default: null,
    },

    /**
     * Whether a push notification was sent for this.
     * @type {boolean}
     */
    isPush: {
      type: Boolean,
      default: false,
    },

    /**
     * When the push notification was sent.
     * @type {Date}
     */
    pushSentAt: {
      type: Date,
      default: null,
    },

    /**
     * Whether the push notification was successfully delivered.
     * @type {boolean}
     */
    pushDelivered: {
      type: Boolean,
      default: false,
    },

    /**
     * Whether an email notification was sent.
     * @type {boolean}
     */
    isEmail: {
      type: Boolean,
      default: false,
    },

    /**
     * When the email notification was sent.
     * @type {Date}
     */
    emailSentAt: {
      type: Date,
      default: null,
    },

    /**
     * Priority level for sorting and display.
     * @type {string}
     */
    priority: {
      type: String,
      enum: {
        values: ['low', 'normal', 'high', 'critical'],
        message: 'Priority must be low, normal, high, or critical',
      },
      default: 'normal',
    },

    /**
     * URL the user should navigate to when clicking the notification.
     * @type {string}
     */
    actionUrl: {
      type: String,
      default: '',
    },

    /**
     * Label for the action button (e.g., "View Message", "Accept Request").
     * @type {string}
     */
    actionLabel: {
      type: String,
      default: '',
    },

    /**
     * Denormalized info about the user who triggered the notification.
     * @type {actorSchema}
     */
    actor: {
      type: actorSchema,
      default: null,
    },

    /**
     * Reference to the entity this notification is about.
     * @type {relatedEntitySchema}
     */
    relatedEntity: {
      type: relatedEntitySchema,
      default: null,
    },

    /**
     * Key for grouping/collapsing similar notifications.
     * E.g., "msg:conv123" to collapse multiple message notifications.
     * @type {string}
     */
    groupKey: {
      type: String,
      default: '',
    },

    /**
     * Count of collapsed notifications in this group.
     * @type {number}
     */
    groupCount: {
      type: Number,
      default: 1,
      min: 1,
    },

    /**
     * Auto-expiry date for notification cleanup.
     * @type {Date}
     */
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    },

    /**
     * Additional typed metadata for rendering.
     * @type {Object}
     */
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    /**
     * Delivery channel for this notification.
     * @type {string}
     */
    channel: {
      type: String,
      enum: {
        values: ['in_app', 'push', 'email', 'all'],
        message: 'Channel must be in_app, push, email, or all',
      },
      default: 'in_app',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
    collection: 'notifications',
  }
);

// ═══════════════════════════════════════════════════════════════
// INDEXES
// ═══════════════════════════════════════════════════════════════

/** Primary query: user's unread notifications sorted by date */
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
/** Query by type for a user */
notificationSchema.index({ userId: 1, type: 1 });
/** TTL index for auto-expiring old notifications */
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
/** Group key lookup for collapsing */
notificationSchema.index({ groupKey: 1, userId: 1 });
/** Push delivery tracking */
notificationSchema.index({ isPush: 1, pushDelivered: 1 });

// ═══════════════════════════════════════════════════════════════
// PRE-SAVE HOOKS
// ═══════════════════════════════════════════════════════════════

/**
 * Pre-save hook: Set priority based on notification type.
 * Security notifications are always critical. Messages are normal.
 */
notificationSchema.pre('save', function (next) {
  if (this.isNew && !this.isModified('priority')) {
    const priorityMap = {
      security: 'critical',
      system: 'high',
      friend_request: 'normal',
      friend_accepted: 'normal',
      message: 'normal',
      mention: 'high',
      reaction: 'low',
      pin: 'low',
    };
    this.priority = priorityMap[this.type] || 'normal';
  }
  next();
});

/**
 * Pre-save hook: Check FEATURE_PUSH_NOTIFICATIONS before enabling push.
 */
notificationSchema.pre('save', function (next) {
  if (this.isNew) {
    // Push flag check is done at the service level, not model level
    // This hook ensures isPush defaults correctly based on channel
    if (this.channel === 'push' || this.channel === 'all') {
      this.isPush = true;
    }
    if (this.channel === 'email' || this.channel === 'all') {
      this.isEmail = true;
    }
  }
  next();
});

// ═══════════════════════════════════════════════════════════════
// POST-SAVE HOOKS
// ═══════════════════════════════════════════════════════════════

/**
 * Track new state for post-save.
 */
notificationSchema.pre('save', function (next) {
  this.wasNew = this.isNew;
  next();
});

/**
 * Post-save hook: Log notification creation.
 */
notificationSchema.post('save', function (doc) {
  if (doc.wasNew) {
    logger.debug(`[NOTIF] Created: ${doc.type} for user:${doc.userId} (${doc.priority})`);
  }
});

// ═══════════════════════════════════════════════════════════════
// INSTANCE METHODS
// ═══════════════════════════════════════════════════════════════

/**
 * Mark this notification as read.
 * @returns {Promise<Document>} Updated notification
 */
notificationSchema.methods.markRead = async function () {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    if (!this.isSeen) {
      this.isSeen = true;
      this.seenAt = this.readAt;
    }
    return this.save();
  }
  return this;
};

/**
 * Mark this notification as seen (scrolled into viewport).
 * @returns {Promise<Document>} Updated notification
 */
notificationSchema.methods.markSeen = async function () {
  if (!this.isSeen) {
    this.isSeen = true;
    this.seenAt = new Date();
    return this.save();
  }
  return this;
};

/**
 * Dismiss (soft delete) this notification by setting expiresAt to now.
 * @returns {Promise<Document>} Updated notification
 */
notificationSchema.methods.dismiss = async function () {
  this.expiresAt = new Date();
  return this.save();
};

// ═══════════════════════════════════════════════════════════════
// STATIC METHODS
// ═══════════════════════════════════════════════════════════════

/**
 * Get notifications for a user with cursor-based pagination.
 * @param {string|Types.ObjectId} userId - User ID
 * @param {string} [cursor] - Notification ID cursor
 * @param {number} [limit=20] - Results per page
 * @returns {Promise<{notifications: Document[], nextCursor: string|null, hasMore: boolean}>}
 */
notificationSchema.statics.getForUser = async function (userId, cursor, limit = 20) {
  const query = { userId };
  if (cursor) {
    query._id = { $lt: new Types.ObjectId(cursor) };
  }

  const notifications = await this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = notifications.length > limit;
  if (hasMore) notifications.pop();
  const nextCursor = hasMore ? notifications[notifications.length - 1]._id.toString() : null;

  return { notifications, nextCursor, hasMore };
};

/**
 * Get unread notification count for a user.
 * @param {string|Types.ObjectId} userId - User ID
 * @returns {Promise<number>} Unread count
 */
notificationSchema.statics.getUnreadCount = async function (userId) {
  return this.countDocuments({ userId, isRead: false });
};

/**
 * Get unseen notification count for a user.
 * @param {string|Types.ObjectId} userId - User ID
 * @returns {Promise<number>} Unseen count
 */
notificationSchema.statics.getUnseenCount = async function (userId) {
  return this.countDocuments({ userId, isSeen: false });
};

/**
 * Mark all notifications as read for a user.
 * @param {string|Types.ObjectId} userId - User ID
 * @returns {Promise<{modifiedCount: number}>}
 */
notificationSchema.statics.markAllRead = async function (userId) {
  const now = new Date();
  return this.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true, readAt: now, isSeen: true, seenAt: now } }
  );
};

/**
 * Mark notifications for a specific related entity as read.
 * @param {string|Types.ObjectId} userId - User ID
 * @param {string} type - Entity type (e.g., 'message', 'conversation')
 * @param {string|Types.ObjectId} id - Entity ID
 * @returns {Promise<{modifiedCount: number}>}
 */
notificationSchema.statics.markRelatedRead = async function (userId, type, id) {
  const now = new Date();
  return this.updateMany(
    { userId, isRead: false, 'relatedEntity.type': type, 'relatedEntity.id': id },
    { $set: { isRead: true, readAt: now, isSeen: true, seenAt: now } }
  );
};

/**
 * Mark all notifications as seen for a user.
 * @param {string|Types.ObjectId} userId - User ID
 * @returns {Promise<{modifiedCount: number}>}
 */
notificationSchema.statics.markAllSeen = async function (userId) {
  return this.updateMany(
    { userId, isSeen: false },
    { $set: { isSeen: true, seenAt: new Date() } }
  );
};

/**
 * Create a notification from a template based on type.
 * Factory method for common notification patterns.
 * @param {string} type - Notification type
 * @param {string|Types.ObjectId} userId - Recipient user ID
 * @param {string|Types.ObjectId} actorId - Actor user ID
 * @param {Object} relatedEntity - { type, id }
 * @param {string} [overrideChannel] - Optional channel override
 * @returns {Promise<Document>} Created notification
 */
notificationSchema.statics.createFromTemplate = async function (type, userId, actorId, relatedEntity, overrideChannel) {
  const User = mongoose.model('User');
  const actorUser = await User.findById(actorId).select('username avatar');
  if (!actorUser) throw new Error('Actor user not found');

  const templates = {
    message: {
      title: `New message from ${actorUser.username}`,
      body: 'You have a new message',
      actionLabel: 'View Message',
      channel: 'all',
    },
    friend_request: {
      title: `${actorUser.username} sent you a friend request`,
      body: 'Click to view and respond',
      actionLabel: 'View Request',
      channel: 'all',
    },
    friend_accepted: {
      title: `${actorUser.username} accepted your friend request`,
      body: 'You are now friends! Start chatting.',
      actionLabel: 'Send Message',
      channel: 'in_app',
    },
    mention: {
      title: `${actorUser.username} mentioned you`,
      body: 'You were mentioned in a message',
      actionLabel: 'View Message',
      channel: 'all',
    },
    reaction: {
      title: `${actorUser.username} reacted to your message`,
      body: '',
      actionLabel: 'View',
      channel: 'in_app',
    },
    pin: {
      title: `${actorUser.username} pinned a message`,
      body: '',
      actionLabel: 'View',
      channel: 'in_app',
    },
    security: {
      title: 'Security Alert',
      body: 'A new login was detected on your account',
      actionLabel: 'Review',
      channel: 'all',
    },
    system: {
      title: 'System Notification',
      body: '',
      actionLabel: '',
      channel: 'in_app',
    },
  };

  const template = templates[type] || templates.system;

  return this.create({
    userId,
    type,
    title: template.title,
    body: template.body,
    actionLabel: template.actionLabel,
    channel: (overrideChannel && ['in_app', 'push', 'email', 'all'].includes(overrideChannel)) 
      ? overrideChannel 
      : (template.channel || 'in_app'),
    actor: {
      userId: actorUser._id,
      username: actorUser.username,
      avatar: actorUser.avatar || '',
    },
    relatedEntity: relatedEntity || null,
    groupKey: relatedEntity ? `${type}:${relatedEntity.id}` : '',
  });
};

/**
 * Collapse similar notifications with the same group key.
 * Updates the latest notification's groupCount instead of creating new ones.
 * @param {string|Types.ObjectId} userId - User ID
 * @param {string} groupKey - Group key to collapse
 * @returns {Promise<Document|null>} Updated notification or null
 */
notificationSchema.statics.collapseGroup = async function (userId, groupKey) {
  if (!groupKey) return null;

  const existing = await this.findOne({
    userId,
    groupKey,
    isRead: false,
  }).sort({ createdAt: -1 });

  if (existing) {
    existing.groupCount += 1;
    existing.updatedAt = new Date();
    return existing.save();
  }

  return null;
};

/**
 * Delete old read notifications for a user.
 * @param {string|Types.ObjectId} userId - User ID
 * @param {number} [olderThanDays=30] - Delete notifications older than this many days
 * @returns {Promise<{deletedCount: number}>}
 */
notificationSchema.statics.deleteOldRead = async function (userId, olderThanDays = 30) {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  return this.deleteMany({
    userId,
    isRead: true,
    createdAt: { $lt: cutoff },
  });
};

/**
 * Get undelivered push notifications for the push worker.
 * @returns {Promise<Document[]>} Undelivered push notifications
 */
notificationSchema.statics.getPushQueue = async function () {
  return this.find({
    isPush: true,
    pushDelivered: false,
    pushSentAt: null,
  })
    .sort({ priority: -1, createdAt: 1 })
    .limit(100);
};

// ═══════════════════════════════════════════════════════════════
// VIRTUALS
// ═══════════════════════════════════════════════════════════════

/**
 * Virtual: Check if the notification has expired.
 * @returns {boolean}
 */
notificationSchema.virtual('isExpired').get(function () {
  if (!this.expiresAt) return false;
  return this.expiresAt < new Date();
});

/**
 * Virtual: Human-readable age of the notification.
 * @returns {string} e.g., "2 hours ago", "3 days ago"
 */
notificationSchema.virtual('displayTime').get(function () {
  const ms = Date.now() - this.createdAt.getTime();
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
});

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

const Notification = model('Notification', notificationSchema);

export default Notification;
