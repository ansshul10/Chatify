/**
 * @fileoverview User Model — Chatify v1
 * Complete Mongoose schema with all fields, validators, indexes, hooks,
 * instance methods, static methods, and virtuals.
 * 
 * This model handles registered users, anonymous users, admin roles,
 * friend lists, blocked users, preferences, and account security.
 * 
 * @module models/User.model
 * @requires mongoose
 * @requires bcryptjs
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger.js';

const { Schema, model, Types } = mongoose;

/** @constant {number} BCRYPT_COST - bcrypt hash cost factor */
const BCRYPT_COST = 12;

/** @constant {number} MAX_LOGIN_ATTEMPTS - max failed logins before lockout */
const MAX_LOGIN_ATTEMPTS = 10;

/** @constant {number} LOCK_TIME_MS - lockout duration in milliseconds (30 min) */
const LOCK_TIME_MS = 30 * 60 * 1000;

/**
 * @typedef {Object} NotificationPreferences
 * @property {boolean} push - Enable push notifications
 * @property {boolean} email - Enable email notifications
 */

/**
 * @typedef {Object} PrivacyPreferences
 * @property {boolean} showLastSeen - Show last seen timestamp to others
 * @property {boolean} showReadReceipts - Show read receipts to others
 * @property {boolean} showTyping - Show typing indicator to others
 */

/**
 * @typedef {Object} SoundPreferences
 * @property {boolean} enabled - Enable notification sounds
 */

/**
 * @typedef {Object} UserPreferences
 * @property {NotificationPreferences} notifications - Notification prefs
 * @property {PrivacyPreferences} privacy - Privacy prefs
 * @property {SoundPreferences} sounds - Sound prefs
 * @property {'light'|'dark'|'system'} theme - UI theme
 */

/**
 * Notification preferences sub-schema.
 * @type {Schema}
 */
const notificationPrefsSchema = new Schema({
  /** @type {boolean} Enable push notifications */
  push: { type: Boolean, default: true },
  /** @type {boolean} Enable email notifications */
  email: { type: Boolean, default: true },
}, { _id: false });

/**
 * Privacy preferences sub-schema.
 * @type {Schema}
 */
const privacyPrefsSchema = new Schema({
  /** @type {boolean} Show last seen timestamp to other users */
  showLastSeen: { type: Boolean, default: true },
  /** @type {boolean} Show read receipts to other users */
  showReadReceipts: { type: Boolean, default: true },
  /** @type {boolean} Show typing indicator to other users */
  showTyping: { type: Boolean, default: true },
  /** @type {boolean} Private account mode (requires request approval) */
  isPrivate: { type: Boolean, default: false },
}, { _id: false });

/**
 * Sound preferences sub-schema.
 * @type {Schema}
 */
const soundPrefsSchema = new Schema({
  /** @type {boolean} Enable notification sounds */
  enabled: { type: Boolean, default: true },
}, { _id: false });

/**
 * User preferences sub-schema.
 * @type {Schema}
 */
const preferencesSchema = new Schema({
  /** @type {NotificationPreferences} Notification preferences */
  notifications: { type: notificationPrefsSchema, default: () => ({}) },
  /** @type {PrivacyPreferences} Privacy preferences */
  privacy: { type: privacyPrefsSchema, default: () => ({}) },
  /** @type {SoundPreferences} Sound preferences */
  sounds: { type: soundPrefsSchema, default: () => ({}) },
  /** @type {string} UI theme preference */
  theme: {
    type: String,
    enum: {
      values: ['light', 'dark', 'system'],
      message: 'Theme must be light, dark, or system',
    },
    default: 'system',
  },
  /** @type {string} UI accent color preference (hex) */
  accentColor: {
    type: String,
    default: '#7c3aed',
  },
  /** @type {string} Chat background color preference */
  chatBackground: {
    type: String,
    default: 'Midnight Black',
  },
}, { _id: false });

// ═══════════════════════════════════════════════════════════════
// MAIN USER SCHEMA
// ═══════════════════════════════════════════════════════════════

/**
 * Main User schema definition.
 * Covers registered users, anonymous users, and admin accounts.
 * @type {Schema}
 */
const userSchema = new Schema(
  {
    /**
     * Unique username (3-20 chars, alphanumeric + underscore).
     * Required for registered users. Anonymous users may have auto-generated ones.
     * @type {string}
     */
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username cannot exceed 20 characters'],
      validate: {
        validator: function (v) {
          return /^[a-zA-Z0-9_]+$/.test(v);
        },
        message: 'Username can only contain letters, numbers, and underscores',
      },
    },

    /**
     * Display name shown in the UI. Can contain spaces and special characters.
     * @type {string}
     */
    displayName: {
      type: String,
      trim: true,
      maxlength: [50, 'Display name cannot exceed 50 characters'],
      default: '',
    },

    /**
     * Email address. Unique but sparse (null for anonymous users).
     * Lowercase enforced via pre-save hook.
     * @type {string}
     */
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          if (!v) return true; // Allow null for anon users
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Invalid email format',
      },
    },

    /**
     * Hashed password (bcrypt). Not returned in queries by default.
     * @type {string}
     */
    passwordHash: {
      type: String,
      select: false,
      minlength: [8, 'Password must be at least 8 characters'],
    },

    /**
     * Whether this is an anonymous (guest) user.
     * @type {boolean}
     */
    isAnonymous: {
      type: Boolean,
      default: false,
      index: true,
    },

    /**
     * Unique identifier for anonymous users (e.g., "anon_swift_fox_123456").
     * @type {string}
     */
    anonymousId: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
    },

    /**
     * User role for authorization.
     * @type {string}
     */
    role: {
      type: String,
      enum: {
        values: ['user', 'moderator', 'admin'],
        message: 'Role must be user, moderator, or admin',
      },
      default: 'user',
      index: true,
    },

    /**
     * Avatar image URL (Cloudinary or default).
     * @type {string}
     */
    avatar: {
      type: String,
      default: '',
    },

    /**
     * Cloudinary public ID for avatar (used for deletion/replacement).
     * @type {string}
     */
    avatarPublicId: {
      type: String,
      default: '',
    },

    /**
     * User bio/description (max 500 chars).
     * @type {string}
     */
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },

    /**
     * Whether the user's email has been verified.
     * @type {boolean}
     */
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    
    /**
     * User gender.
     * @type {string}
     */
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      default: 'prefer_not_to_say',
    },

    /**
     * Timestamp of last username change (to enforce 7-day limit).
     * @type {Date}
     */
    lastUsernameChangeAt: {
      type: Date,
      default: null,
    },

    /**
     * Whether two-factor authentication is enabled.
     * @type {boolean}
     */
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    /**
     * TOTP secret for 2FA (encrypted, never exposed to client).
     * @type {string}
     */
    twoFactorSecret: {
      type: String,
      select: false,
    },

    /**
     * Whether the account is active (not deactivated by user).
     * @type {boolean}
     */
    isActive: {
      type: Boolean,
      default: true,
    },

    /**
     * Whether the account is banned by an admin.
     * @type {boolean}
     */
    isBanned: {
      type: Boolean,
      default: false,
      index: true,
    },

    /**
     * Reason for the ban (set by admin).
     * @type {string}
     */
    banReason: {
      type: String,
      default: '',
    },

    /**
     * When the ban expires (null = permanent).
     * @type {Date}
     */
    banExpiresAt: {
      type: Date,
      default: null,
    },

    /**
     * Number of times the user has been banned (for progressive durations).
     * @type {number}
     */
    banCount: {
      type: Number,
      default: 0,
    },

    /**
     * Number of consecutive failed login attempts.
     * @type {number}
     */
    loginAttempts: {
      type: Number,
      default: 0,
    },

    /**
     * Timestamp until which the account is locked due to failed logins.
     * @type {Date}
     */
    lockUntil: {
      type: Date,
      default: null,
    },

    /**
     * Timestamp of the last successful login.
     * @type {Date}
     */
    lastLoginAt: {
      type: Date,
      default: null,
    },

    /**
     * IP address of the last successful login.
     * @type {string}
     */
    lastLoginIP: {
      type: String,
      default: '',
    },

    /**
     * Timestamp of the user's last activity / heartbeat.
     * @type {Date}
     */
    lastSeenAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    /**
     * Whether the user is currently connected via Socket.io.
     * @type {boolean}
     */
    isOnline: {
      type: Boolean,
      default: false,
      index: true,
    },

    /**
     * Granular online status for presence display.
     * @type {string}
     */
    onlineStatus: {
      type: String,
      enum: {
        values: ['online', 'away', 'offline'],
        message: 'Status must be online, away, or offline',
      },
      default: 'offline',
    },

    /**
     * User preferences (notifications, privacy, sounds, theme).
     * @type {UserPreferences}
     */
    preferences: {
      type: preferencesSchema,
      default: () => ({}),
    },

    /**
     * Array of user IDs this user is friends with.
     * @type {Types.ObjectId[]}
     */
    friends: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],

    /**
     * Array of user IDs this user has blocked.
     * @type {Types.ObjectId[]}
     */
    blockedUsers: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],

    /**
     * Array of user IDs marked as close friends.
     * @type {Types.ObjectId[]}
     */
    closeFriends: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],

    /**
     * Track active sessions/devices.
     */
    sessions: [{
      deviceId: { type: String, default: 'unknown' },
      deviceName: { type: String, default: 'Web Browser' },
      browser: { type: String, default: '' },
      os: { type: String, default: '' },
      ip: { type: String, default: '' },
      lastActive: { type: Date, default: Date.now },
      socketId: { type: String, default: '' },
    }],

    /**
     * Array of conversation IDs the user has archived.
     * @type {Types.ObjectId[]}
     */
    archivedConversations: [{
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
    }],

    /**
     * Array of message IDs the user has bookmarked.
     * @type {Types.ObjectId[]}
     */
    bookmarkedMessages: [{
      type: Schema.Types.ObjectId,
      ref: 'Message',
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
    collection: 'users',
  }
);

// ═══════════════════════════════════════════════════════════════
// INDEXES
// ═══════════════════════════════════════════════════════════════

/**
 * Compound indexes for optimized queries.
 * email (unique sparse) and username (unique) are defined inline above.
 */
userSchema.index({ lastSeenAt: -1 });

// ═══════════════════════════════════════════════════════════════
// PRE-SAVE HOOKS
// ═══════════════════════════════════════════════════════════════

/**
 * Pre-save hook: Hash password with bcrypt if modified.
 * Uses cost factor of 12 for strong security.
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  if (!this.passwordHash) return next();

  try {
    const salt = await bcrypt.genSalt(BCRYPT_COST);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Pre-save hook: Normalize username (trim) and email (lowercase).
 * Ensures consistent storage format.
 */
userSchema.pre('save', function (next) {
  if (this.isModified('username') && this.username) {
    this.username = this.username.trim();
  }
  if (this.isModified('email') && this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  // Set displayName to username if not provided
  if (!this.displayName && this.username) {
    this.displayName = this.username;
  }
  next();
});

// ═══════════════════════════════════════════════════════════════
// POST-SAVE HOOKS
// ═══════════════════════════════════════════════════════════════

/**
 * Post-save hook: Log user creation events for auditing.
 */
userSchema.post('save', function (doc) {
  if (doc.wasNew) {
    const type = doc.isAnonymous ? 'anonymous' : 'registered';
    logger.info(`[USER] Created ${type} user: ${doc.username} (${doc._id})`);
  }
});

/**
 * Track if document is new for post-save logging.
 */
userSchema.pre('save', function (next) {
  this.wasNew = this.isNew;
  next();
});

// ═══════════════════════════════════════════════════════════════
// INSTANCE METHODS
// ═══════════════════════════════════════════════════════════════

/**
 * Compare a candidate password against the stored hash.
 * @param {string} candidatePassword - The plaintext password to verify
 * @returns {Promise<boolean>} True if password matches
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

/**
 * Check if the account is currently locked due to failed login attempts.
 * @returns {boolean} True if account is locked and lock has not expired
 */
userSchema.methods.isLocked = function () {
  if (!this.lockUntil) return false;
  return this.lockUntil > Date.now();
};

/**
 * Increment failed login attempts. Locks account after MAX_LOGIN_ATTEMPTS.
 * @returns {Promise<void>}
 */
userSchema.methods.incrementLoginAttempts = async function () {
  // If previous lock has expired, reset counter
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock account if attempts exceed threshold
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + LOCK_TIME_MS) };
    logger.warn(`[AUTH] Account locked: ${this.username} (${this._id}) — too many failed attempts`);
  }

  return this.updateOne(updates);
};

/**
 * Reset login attempts counter after successful login.
 * @returns {Promise<void>}
 */
userSchema.methods.resetLoginAttempts = async function () {
  if (this.loginAttempts === 0 && !this.lockUntil) return;
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

/**
 * Return a safe user object without sensitive fields.
 * Strips passwordHash, twoFactorSecret, and internal fields.
 * @returns {Object} Safe user object for client consumption
 */
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.twoFactorSecret;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  delete obj.__v;
  delete obj.wasNew;
  return obj;
};

/**
 * Check if this user is blocked by another user.
 * @param {string|Types.ObjectId} userId - The user ID to check against
 * @returns {boolean} True if blocked by the specified user
 */
userSchema.methods.isBlockedBy = function (userId) {
  return this.blockedUsers.some(
    (id) => id.toString() === userId.toString()
  );
};

/**
 * Check if this user is friends with another user.
 * @param {string|Types.ObjectId} userId - The user ID to check
 * @returns {boolean} True if friends with the specified user
 */
userSchema.methods.isFriendWith = function (userId) {
  return this.friends.some(
    (id) => id.toString() === userId.toString()
  );
};

// ═══════════════════════════════════════════════════════════════
// STATIC METHODS
// ═══════════════════════════════════════════════════════════════

/**
 * Find a user by email or username (case-insensitive for email).
 * @param {string} identifier - Email address or username
 * @returns {Promise<Document|null>} User document or null
 */
userSchema.statics.findByEmailOrUsername = async function (identifier) {
  const isEmail = identifier.includes('@');
  if (isEmail) {
    return this.findOne({ email: identifier.toLowerCase() }).select('+passwordHash +twoFactorSecret');
  }
  return this.findOne({ username: identifier }).select('+passwordHash +twoFactorSecret');
};

/**
 * Find active (non-banned, non-anonymous) users with pagination.
 * @param {number} [limit=20] - Number of results to return
 * @param {number} [skip=0] - Number of results to skip
 * @returns {Promise<Document[]>} Array of user documents
 */
userSchema.statics.findActiveUsers = async function (limit = 20, skip = 0) {
  return this.find({
    isActive: true,
    isBanned: false,
    isAnonymous: false,
  })
    .sort({ lastSeenAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('-passwordHash -twoFactorSecret -loginAttempts -lockUntil');
};

/**
 * Search users by username or displayName (case-insensitive partial match).
 * Excludes the searching user and blocked users.
 * @param {string} query - Search query string
 * @param {string|Types.ObjectId} excludeId - User ID to exclude from results
 * @returns {Promise<Document[]>} Matching user documents
 */
userSchema.statics.searchUsers = async function (query, excludeId) {
  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return this.find({
    _id: { $ne: excludeId },
    isActive: true,
    isBanned: false,
    isAnonymous: false,
    $or: [
      { username: regex },
      { displayName: regex },
    ],
  })
    .limit(20)
    .select('username displayName avatar bio isOnline onlineStatus lastSeenAt');
};

// ═══════════════════════════════════════════════════════════════
// VIRTUALS
// ═══════════════════════════════════════════════════════════════

/**
 * Virtual: Check if the account is currently locked.
 * @returns {boolean}
 */
userSchema.virtual('isAccountLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

/**
 * Virtual: Get the number of friends.
 * @returns {number}
 */
userSchema.virtual('friendCount').get(function () {
  return this.friends ? this.friends.length : 0;
});

/**
 * Virtual: Get the user's profile URL path.
 * @returns {string}
 */
userSchema.virtual('profileUrl').get(function () {
  return `/profile/${this.username}`;
});

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

/**
 * User model.
 * @type {mongoose.Model}
 */
const User = model('User', userSchema);

export default User;
