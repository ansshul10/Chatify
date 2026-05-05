/**
 * @fileoverview FriendRequest Model — Chatify v1
 * Handles friend requests between users including pending, accepted,
 * rejected, cancelled, and blocked states. Manages bidirectional
 * friendship creation and conversation initialization on acceptance.
 * 
 * @module models/FriendRequest.model
 * @requires mongoose
 */

import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const { Schema, model, Types } = mongoose;

/** @constant {number} RESEND_COOLDOWN_DAYS - Days before a rejected request can be resent */
const RESEND_COOLDOWN_DAYS = 7;

/** @constant {number} EXPIRY_DAYS - Days before a pending request auto-expires */
const EXPIRY_DAYS = 30;

/**
 * Snapshot of the requesting user's profile at request time.
 * Denormalized for performance — avoids populate on list views.
 * @type {Schema}
 */
const userSnapshotSchema = new Schema({
  /** @type {string} Username at request time */
  username: {
    type: String,
    required: true,
  },
  /** @type {string} Display name at request time */
  displayName: {
    type: String,
    default: '',
  },
  /** @type {string} Avatar URL at request time */
  avatar: {
    type: String,
    default: '',
  },
}, { _id: false });

// ═══════════════════════════════════════════════════════════════
// MAIN FRIENDREQUEST SCHEMA
// ═══════════════════════════════════════════════════════════════

/**
 * FriendRequest schema definition.
 * Tracks the lifecycle of friend requests between two users.
 * @type {Schema}
 */
const friendRequestSchema = new Schema(
  {
    /**
     * User who sent the friend request.
     * @type {Types.ObjectId}
     */
    from: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
    },

    /**
     * User who received the friend request.
     * @type {Types.ObjectId}
     */
    to: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required'],
    },

    /**
     * Current status of the friend request.
     * @type {string}
     */
    status: {
      type: String,
      enum: {
        values: ['pending', 'accepted', 'rejected', 'cancelled', 'blocked'],
        message: 'Status must be pending, accepted, rejected, cancelled, or blocked',
      },
      default: 'pending',
      index: true,
    },

    /**
     * Optional personal message with the request (max 200 chars).
     * @type {string}
     */
    message: {
      type: String,
      maxlength: [200, 'Request message cannot exceed 200 characters'],
      default: '',
      trim: true,
    },

    /**
     * When the request was accepted or rejected.
     * @type {Date}
     */
    respondedAt: {
      type: Date,
      default: null,
    },

    /**
     * When the request was cancelled by the sender.
     * @type {Date}
     */
    cancelledAt: {
      type: Date,
      default: null,
    },

    /**
     * Whether the receiver has seen the request.
     * @type {boolean}
     */
    seenByReceiver: {
      type: Boolean,
      default: false,
    },

    /**
     * When the receiver first saw the request.
     * @type {Date}
     */
    seenAt: {
      type: Date,
      default: null,
    },

    /**
     * Snapshot of mutual friends at request time.
     * @type {Types.ObjectId[]}
     */
    mutualFriends: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],

    /**
     * Denormalized snapshot of the sender's profile for efficient rendering.
     * @type {userSnapshotSchema}
     */
    fromUserSnapshot: {
      type: userSnapshotSchema,
      default: () => ({}),
    },

    /**
     * Metadata about this pair's request history.
     * @type {Object}
     */
    metadata: {
      /** @type {number} How many times this pair has sent requests */
      requestCount: {
        type: Number,
        default: 1,
      },
    },

    /**
     * Auto-expiry date for pending requests (30 days after creation).
     * @type {Date}
     */
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
    collection: 'friendrequests',
  }
);

// ═══════════════════════════════════════════════════════════════
// INDEXES
// ═══════════════════════════════════════════════════════════════

/** Compound index for incoming requests by status */
friendRequestSchema.index({ to: 1, status: 1 });
/** Compound index for outgoing requests by status */
friendRequestSchema.index({ from: 1, status: 1 });
/** TTL index for auto-expiring pending requests */
friendRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { status: 'pending' } });
/** Index for unseen requests (notification badge) */
friendRequestSchema.index({ seenByReceiver: 1, to: 1 });
/** Compound index to prevent duplicate requests between same pair */
friendRequestSchema.index({ from: 1, to: 1 }, { unique: true });

// ═══════════════════════════════════════════════════════════════
// PRE-SAVE HOOKS
// ═══════════════════════════════════════════════════════════════

/**
 * Pre-save hook: Prevent self-requests (from !== to).
 */
friendRequestSchema.pre('save', function (next) {
  if (this.from.toString() === this.to.toString()) {
    return next(new Error('Cannot send a friend request to yourself'));
  }
  next();
});

/**
 * Pre-save hook: Check if users have blocked each other.
 */
friendRequestSchema.pre('save', async function (next) {
  if (!this.isNew) return next();

  try {
    const User = mongoose.model('User');
    const [sender, receiver] = await Promise.all([
      User.findById(this.from),
      User.findById(this.to),
    ]);

    if (!sender || !receiver) {
      return next(new Error('User not found'));
    }

    if (receiver.blockedUsers?.some((id) => id.toString() === this.from.toString())) {
      return next(new Error('Cannot send friend request — user has blocked you'));
    }

    if (sender.blockedUsers?.some((id) => id.toString() === this.to.toString())) {
      return next(new Error('Cannot send friend request — you have blocked this user'));
    }

    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Pre-validate hook: Set fromUserSnapshot from the sender's User document.
 * Must run before validation because fromUserSnapshot.username is required.
 */
friendRequestSchema.pre('validate', async function (next) {
  if (!this.isNew) return next();

  try {
    const User = mongoose.model('User');
    const sender = await User.findById(this.from).select('username displayName avatar');
    if (sender) {
      this.fromUserSnapshot = {
        username: sender.username,
        displayName: sender.displayName || sender.username,
        avatar: sender.avatar || '',
      };
    }
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Pre-save hook: Populate mutualFriends array with overlapping friend IDs.
 */
friendRequestSchema.pre('save', async function (next) {
  if (!this.isNew) return next();

  try {
    const User = mongoose.model('User');
    const [sender, receiver] = await Promise.all([
      User.findById(this.from).select('friends'),
      User.findById(this.to).select('friends'),
    ]);

    if (sender && receiver) {
      const senderFriends = new Set(sender.friends.map((f) => f.toString()));
      this.mutualFriends = receiver.friends.filter((f) => senderFriends.has(f.toString()));
    }
    next();
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════
// POST-SAVE HOOKS
// ═══════════════════════════════════════════════════════════════

/**
 * Track new document state for post-save hooks.
 */
friendRequestSchema.pre('save', function (next) {
  this.wasNew = this.isNew;
  this._previousStatus = this.isModified('status') ? this._original?.status : null;
  next();
});

/**
 * Post-save (accepted): Add each user to the other's friends array.
 * Also creates a Conversation document for the two users.
 */
friendRequestSchema.post('save', async function (doc) {
  if (doc.status !== 'accepted' || !doc.isModified?.('status')) {
    // Check if status was just changed to accepted
    if (doc.status !== 'accepted') return;
  }

  try {
    const User = mongoose.model('User');
    const Conversation = mongoose.model('Conversation');

    // Add to each other's friends list
    await Promise.all([
      User.findByIdAndUpdate(doc.from, {
        $addToSet: { friends: doc.to },
      }),
      User.findByIdAndUpdate(doc.to, {
        $addToSet: { friends: doc.from },
      }),
    ]);

    // Create conversation if it doesn't exist
    await Conversation.findOrCreate(doc.from, doc.to);

    logger.info(`[FRIEND] Request accepted: ${doc.from} ↔ ${doc.to}`);
  } catch (err) {
    logger.error(`[FRIEND] Post-accept error: ${err.message}`);
  }
});

/**
 * Post-save: Log request creation.
 */
friendRequestSchema.post('save', function (doc) {
  if (doc.wasNew) {
    logger.info(`[FRIEND] Request sent: ${doc.from} → ${doc.to}`);
  }
});

/**
 * Post-save (rejected/cancelled): Log the event.
 */
friendRequestSchema.post('save', function (doc) {
  if (doc.status === 'rejected') {
    logger.info(`[FRIEND] Request rejected: ${doc.from} → ${doc.to}`);
  }
  if (doc.status === 'cancelled') {
    logger.info(`[FRIEND] Request cancelled: ${doc.from} → ${doc.to}`);
  }
});

// ═══════════════════════════════════════════════════════════════
// INSTANCE METHODS
// ═══════════════════════════════════════════════════════════════

/**
 * Accept this friend request.
 * Sets status to accepted and respondedAt to now.
 * @returns {Promise<Document>} Updated friend request
 */
friendRequestSchema.methods.accept = async function () {
  this.status = 'accepted';
  this.respondedAt = new Date();
  return this.save();
};

/**
 * Reject this friend request.
 * @param {string} [reason] - Optional rejection reason (internal use)
 * @returns {Promise<Document>} Updated friend request
 */
friendRequestSchema.methods.reject = async function (reason) {
  this.status = 'rejected';
  this.respondedAt = new Date();
  if (reason) {
    this.message = reason;
  }
  return this.save();
};

/**
 * Cancel this friend request (only the sender can cancel).
 * @returns {Promise<Document>} Updated friend request
 */
friendRequestSchema.methods.cancel = async function () {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  return this.save();
};

/**
 * Mark the request as seen by the receiver.
 * @returns {Promise<Document>} Updated friend request
 */
friendRequestSchema.methods.markSeen = async function () {
  if (!this.seenByReceiver) {
    this.seenByReceiver = true;
    this.seenAt = new Date();
    return this.save();
  }
  return this;
};

/**
 * Check if this request can be resent (7-day cooldown after rejection).
 * @returns {boolean} True if cooldown has passed
 */
friendRequestSchema.methods.canResend = function () {
  if (this.status !== 'rejected') return false;
  if (!this.respondedAt) return true;
  const cooldownMs = RESEND_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - this.respondedAt.getTime() > cooldownMs;
};

// ═══════════════════════════════════════════════════════════════
// STATIC METHODS
// ═══════════════════════════════════════════════════════════════

/**
 * Get pending incoming friend requests for a user.
 * @param {string|Types.ObjectId} userId - User ID
 * @returns {Promise<Document[]>} Pending incoming requests
 */
friendRequestSchema.statics.getPendingForUser = async function (userId) {
  return this.find({ to: userId, status: 'pending' })
    .sort({ createdAt: -1 })
    .populate('from', 'username displayName avatar isOnline lastSeenAt bio');
};

/**
 * Get sent (outgoing) friend requests for a user.
 * @param {string|Types.ObjectId} userId - User ID
 * @returns {Promise<Document[]>} Outgoing requests
 */
friendRequestSchema.statics.getSentByUser = async function (userId) {
  return this.find({ from: userId, status: 'pending' })
    .sort({ createdAt: -1 })
    .populate('to', 'username displayName avatar isOnline lastSeenAt');
};

/**
 * Get the current relationship status between two users.
 * @param {string|Types.ObjectId} userId1 - First user
 * @param {string|Types.ObjectId} userId2 - Second user
 * @returns {Promise<string>} 'friends' | 'pending_sent' | 'pending_received' | 'none' | 'blocked'
 */
friendRequestSchema.statics.getStatus = async function (userId1, userId2) {
  // Check if already friends
  const User = mongoose.model('User');
  const user = await User.findById(userId1).select('friends blockedUsers');
  if (!user) return 'none';

  if (user.friends.some((f) => f.toString() === userId2.toString())) {
    return 'friends';
  }

  if (user.blockedUsers.some((b) => b.toString() === userId2.toString())) {
    return 'blocked';
  }

  // Check for pending request
  const request = await this.findOne({
    $or: [
      { from: userId1, to: userId2, status: 'pending' },
      { from: userId2, to: userId1, status: 'pending' },
    ],
  });

  if (request) {
    return request.from.toString() === userId1.toString() ? 'pending_sent' : 'pending_received';
  }

  return 'none';
};

/**
 * Get a user's friends list with cursor-based pagination.
 * @param {string|Types.ObjectId} userId - User ID
 * @param {string} [cursor] - Cursor for pagination
 * @param {number} [limit=20] - Results per page
 * @returns {Promise<{friends: Document[], nextCursor: string|null, hasMore: boolean}>}
 */
friendRequestSchema.statics.getFriendsList = async function (userId, cursor, limit = 20) {
  const User = mongoose.model('User');
  const user = await User.findById(userId).select('friends');
  if (!user || !user.friends.length) {
    return { friends: [], nextCursor: null, hasMore: false };
  }

  const query = { _id: { $in: user.friends } };
  if (cursor) {
    query._id = { ...query._id, $lt: new Types.ObjectId(cursor) };
  }

  const friends = await User.find(query)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .select('username displayName avatar isOnline onlineStatus lastSeenAt bio');

  const hasMore = friends.length > limit;
  if (hasMore) friends.pop();
  const nextCursor = hasMore ? friends[friends.length - 1]._id.toString() : null;

  return { friends, nextCursor, hasMore };
};

/**
 * Get mutual friends between two users.
 * @param {string|Types.ObjectId} userId1 - First user
 * @param {string|Types.ObjectId} userId2 - Second user
 * @returns {Promise<Document[]>} Array of mutual friend User documents
 */
friendRequestSchema.statics.getMutualFriends = async function (userId1, userId2) {
  const User = mongoose.model('User');
  const [user1, user2] = await Promise.all([
    User.findById(userId1).select('friends'),
    User.findById(userId2).select('friends'),
  ]);

  if (!user1 || !user2) return [];

  const friends1Set = new Set(user1.friends.map((f) => f.toString()));
  const mutualIds = user2.friends.filter((f) => friends1Set.has(f.toString()));

  return User.find({ _id: { $in: mutualIds } })
    .select('username displayName avatar isOnline');
};

/**
 * Search within a user's friends list by name.
 * @param {string|Types.ObjectId} userId - User ID
 * @param {string} query - Search query
 * @returns {Promise<Document[]>} Matching friends
 */
friendRequestSchema.statics.searchFriends = async function (userId, query) {
  const User = mongoose.model('User');
  const user = await User.findById(userId).select('friends');
  if (!user || !user.friends.length) return [];

  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return User.find({
    _id: { $in: user.friends },
    $or: [{ username: regex }, { displayName: regex }],
  })
    .limit(20)
    .select('username displayName avatar isOnline onlineStatus lastSeenAt');
};

/**
 * Get count of unseen incoming requests.
 * @param {string|Types.ObjectId} userId - User ID
 * @returns {Promise<number>} Unseen request count
 */
friendRequestSchema.statics.getUnseenCount = async function (userId) {
  return this.countDocuments({ to: userId, status: 'pending', seenByReceiver: false });
};

// ═══════════════════════════════════════════════════════════════
// VIRTUALS
// ═══════════════════════════════════════════════════════════════

/**
 * Virtual: Whether the request is pending.
 * @returns {boolean}
 */
friendRequestSchema.virtual('isPending').get(function () {
  return this.status === 'pending';
});

/**
 * Virtual: Whether the request has been accepted.
 * @returns {boolean}
 */
friendRequestSchema.virtual('isAccepted').get(function () {
  return this.status === 'accepted';
});

/**
 * Virtual: Age of the request in days since creation.
 * @returns {number}
 */
friendRequestSchema.virtual('age').get(function () {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (24 * 60 * 60 * 1000));
});

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

const FriendRequest = model('FriendRequest', friendRequestSchema);

export default FriendRequest;
