/**
 * @fileoverview Zod-based environment variable validation.
 * Validates ALL required env vars at startup — process exits with clear error if any missing.
 * @module config/validateEnv
 */

import { z } from 'zod';

/**
 * Complete Zod schema for all environment variables.
 * Each field includes a description and sensible defaults where applicable.
 */
const envSchema = z.object({
  // ── Core ──
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.string().default('5000').transform(Number),
  CLIENT_URL: z.string().url('CLIENT_URL must be a valid URL'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('debug'),

  // ── Database ──
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  // ── JWT ──
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // ── Email Provider ──
  EMAIL_PROVIDER: z.enum(['gmail', 'resend']).default('gmail'),
  gmail_user: z.string().default(''),
  gmail_app_password: z.string().default(''),
  RESEND_API_KEY: z.string().default(''),
  RESEND_FROM: z.string().default('Chatify <noreply@chatify.app>'),

  // ── VAPID ──
  VAPID_PUBLIC_KEY: z.string().default(''),
  VAPID_PRIVATE_KEY: z.string().default(''),
  VAPID_EMAIL: z.string().default('admin@chatify.app'),

  // ── External Services ──
  SENTRY_DSN: z.string().default(''),
  CLOUDINARY_CLOUD_NAME: z.string().default(''),
  CLOUDINARY_API_KEY: z.string().default(''),
  CLOUDINARY_API_SECRET: z.string().default(''),

  // ── Feature Flags (50) ──
  FEATURE_ANONYMOUS_CHAT: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_EMAIL_VERIFICATION: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_2FA: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_MAGIC_LINK: z.string().default('false').transform((v) => v === 'true'),
  FEATURE_GOOGLE_OAUTH: z.string().default('false').transform((v) => v === 'true'),
  FEATURE_LOGIN_ALERT: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_BRUTE_FORCE_LOCK: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_UPGRADE_ANON: z.string().default('true').transform((v) => v === 'true'),

  FEATURE_ENCRYPTION: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_MESSAGE_EDIT: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_MESSAGE_DELETE: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_REACTIONS: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_REPLY_TO: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_MESSAGE_SEARCH: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_MESSAGE_BOOKMARKS: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_MESSAGE_PIN: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_SELF_DESTRUCT: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_DISAPPEARING_MESSAGES: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_TYPING_INDICATORS: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_READ_RECEIPTS: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_MENTION_NOTIFICATIONS: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_OFFLINE_MESSAGE_QUEUE: z.string().default('true').transform((v) => v === 'true'),

  FEATURE_READ_RECEIPT_PRIVACY: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_TYPING_PRIVACY: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_LAST_SEEN: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_ONLINE_STATUS: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_HIDE_ONLINE_STATUS: z.string().default('true').transform((v) => v === 'true'),

  FEATURE_FRIENDS: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_BLOCKING: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_USER_PROFILES: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_AVATAR_UPLOAD: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_USER_BIO: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_USER_SEARCH: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_MUTUAL_FRIENDS: z.string().default('true').transform((v) => v === 'true'),

  FEATURE_PUSH_NOTIFICATIONS: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_EMAIL_NOTIFICATIONS: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_IN_APP_NOTIFICATIONS: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_NOTIFICATION_SOUNDS: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_NOTIFICATION_BADGE: z.string().default('true').transform((v) => v === 'true'),

  FEATURE_RATE_LIMITING: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_IP_BAN: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_SUSPICIOUS_ACTIVITY: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_CONTENT_MODERATION: z.string().default('false').transform((v) => v === 'true'),
  FEATURE_ENCRYPTION_KEY_SCAN: z.string().default('true').transform((v) => v === 'true'),

  FEATURE_PWA: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_OFFLINE_SUPPORT: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_ADMIN_DASHBOARD: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_CONVERSATION_ARCHIVE: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_EXPORT_CHAT: z.string().default('false').transform((v) => v === 'true'),
  FEATURE_QUERY_LOGGING: z.string().default('true').transform((v) => v === 'true'),
  FEATURE_REDIS_LOGGING: z.string().default('false').transform((v) => v === 'true'),
  FEATURE_EMAIL_DEV_LOG: z.string().default('false').transform((v) => v === 'true'),
  FEATURE_VERBOSE_AUTH_LOG: z.string().default('true').transform((v) => v === 'true'),
});

/**
 * Validates environment variables against the Zod schema.
 * Exits the process with a descriptive error if validation fails.
 * @returns {z.infer<typeof envSchema>} Validated and transformed env object
 */
export function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('\n══════════════════════════════════════════════');
    console.error('  ❌ ENVIRONMENT VALIDATION FAILED');
    console.error('══════════════════════════════════════════════\n');

    const errors = result.error.flatten().fieldErrors;
    for (const [field, messages] of Object.entries(errors)) {
      console.error(`  → ${field}: ${messages.join(', ')}`);
    }

    console.error('\n  Fix the above errors in your .env file and restart.\n');
    process.exit(1);
  }

  return result.data;
}

/** @type {z.infer<typeof envSchema>} */
let _env = null;

/**
 * Returns the validated env object. Caches after first call.
 * @returns {z.infer<typeof envSchema>}
 */
export function getEnv() {
  if (!_env) {
    _env = validateEnv();
  }
  return _env;
}

export default getEnv;
