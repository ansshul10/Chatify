/**
 * @fileoverview Shared Zod validation schemas reused across routes.
 * @module utils/validators
 */

import { z } from 'zod';

export const usernameSchema = z.string().min(3).max(20)
  .regex(/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric with underscores only');

export const emailSchema = z.string().email('Invalid email address').toLowerCase();

export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const messageContentSchema = z.string().min(1, 'Message cannot be empty')
  .max(4000, 'Message exceeds 4000 character limit');

export const displayNameSchema = z.string().min(1).max(50).optional();
export const bioSchema = z.string().max(500).optional();
export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format');
export const cursorSchema = z.string().regex(/^[a-f\d]{24}$/i).optional();
export const limitSchema = z.number().int().min(1).max(100).default(30);

/** Registration body schema */
export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
});

/** Login body schema */
export const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

/** Forgot password body schema */
export const forgotPasswordSchema = z.object({ email: emailSchema });

/** Reset password body schema */
export const resetPasswordSchema = z.object({ password: passwordSchema });

/** Profile update body schema */
export const updateProfileSchema = z.object({
  displayName: displayNameSchema,
  bio: bioSchema,
}).partial();

/** Preferences update schema */
export const updatePreferencesSchema = z.object({
  notifications: z.object({
    push: z.boolean().optional(),
    email: z.boolean().optional(),
  }).optional(),
  privacy: z.object({
    showLastSeen: z.boolean().optional(),
    showReadReceipts: z.boolean().optional(),
    showTyping: z.boolean().optional(),
  }).optional(),
  sounds: z.object({ enabled: z.boolean().optional() }).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  accentColor: z.string().optional(),
  chatBackground: z.string().optional(),
}).partial();

/** Message send schema */
export const sendMessageSchema = z.object({
  content: messageContentSchema,
  isEncrypted: z.boolean().default(false),
  replyTo: objectIdSchema.optional(),
  clientId: z.string().min(1).max(64),
  selfDestructMinutes: z.number().int().min(1).max(1440).optional(),
});

/** Message edit schema */
export const editMessageSchema = z.object({
  content: messageContentSchema,
  isEncrypted: z.boolean().default(false),
});

/** Reaction schema */
export const reactionSchema = z.object({
  emoji: z.string().min(1).max(8),
});

/** Friend request message schema */
export const friendRequestSchema = z.object({
  message: z.string().max(200).optional(),
});

/** Search query schema */
export const searchSchema = z.object({
  q: z.string().min(1).max(100),
});

/** Disappearing messages schema */
export const disappearingSchema = z.object({
  enabled: z.boolean(),
  duration: z.number().int().min(60).max(604800).optional(), // 1 min to 7 days in seconds
});

/** Mute conversation schema */
export const muteSchema = z.object({
  duration: z.number().int().min(0).max(2592000), // 0 = unmute, max 30 days in seconds
});

/** 2FA verify schema */
export const twoFactorSchema = z.object({
  code: z.string().length(6, '2FA code must be 6 digits').regex(/^\d+$/, 'Code must be numeric'),
});

/** Upgrade anon schema */
export const upgradeSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export default {
  usernameSchema, emailSchema, passwordSchema, messageContentSchema,
  registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema,
  updateProfileSchema, updatePreferencesSchema, sendMessageSchema, editMessageSchema,
  reactionSchema, friendRequestSchema, searchSchema, disappearingSchema,
  muteSchema, twoFactorSchema, upgradeSchema, objectIdSchema, cursorSchema, limitSchema,
};
