/**
 * @fileoverview Feature flag reader utility.
 * @module utils/featureFlags
 */

import { isFeatureEnabled, getAllFeatureFlags } from '../services/config.service.js';

/** All 50 feature flag names */
export const ALL_FEATURE_FLAGS = [
  'FEATURE_ANONYMOUS_CHAT','FEATURE_EMAIL_VERIFICATION','FEATURE_2FA','FEATURE_MAGIC_LINK',
  'FEATURE_GOOGLE_OAUTH','FEATURE_LOGIN_ALERT','FEATURE_BRUTE_FORCE_LOCK','FEATURE_UPGRADE_ANON',
  'FEATURE_ENCRYPTION','FEATURE_MESSAGE_EDIT','FEATURE_MESSAGE_DELETE','FEATURE_REACTIONS',
  'FEATURE_REPLY_TO','FEATURE_MESSAGE_SEARCH','FEATURE_MESSAGE_BOOKMARKS','FEATURE_MESSAGE_PIN',
  'FEATURE_SELF_DESTRUCT','FEATURE_DISAPPEARING_MESSAGES','FEATURE_TYPING_INDICATORS','FEATURE_READ_RECEIPTS',
  'FEATURE_MENTION_NOTIFICATIONS','FEATURE_OFFLINE_MESSAGE_QUEUE','FEATURE_READ_RECEIPT_PRIVACY',
  'FEATURE_TYPING_PRIVACY','FEATURE_LAST_SEEN','FEATURE_ONLINE_STATUS','FEATURE_HIDE_ONLINE_STATUS',
  'FEATURE_FRIENDS','FEATURE_BLOCKING','FEATURE_USER_PROFILES','FEATURE_AVATAR_UPLOAD',
  'FEATURE_USER_BIO','FEATURE_USER_SEARCH','FEATURE_MUTUAL_FRIENDS','FEATURE_PUSH_NOTIFICATIONS',
  'FEATURE_EMAIL_NOTIFICATIONS','FEATURE_IN_APP_NOTIFICATIONS','FEATURE_NOTIFICATION_SOUNDS',
  'FEATURE_NOTIFICATION_BADGE','FEATURE_RATE_LIMITING','FEATURE_IP_BAN','FEATURE_SUSPICIOUS_ACTIVITY',
  'FEATURE_CONTENT_MODERATION','FEATURE_ENCRYPTION_KEY_SCAN','FEATURE_PWA','FEATURE_OFFLINE_SUPPORT',
  'FEATURE_ADMIN_DASHBOARD','FEATURE_CONVERSATION_ARCHIVE','FEATURE_EXPORT_CHAT',
  'FEATURE_QUERY_LOGGING','FEATURE_REDIS_LOGGING','FEATURE_EMAIL_DEV_LOG','FEATURE_VERBOSE_AUTH_LOG',
  'FEATURE_REPORTING',
];

export function isEnabled(flag) { return isFeatureEnabled(flag); }
export function getAllFlags() { return getAllFeatureFlags(); }
export function getEnabledFlags() { return ALL_FEATURE_FLAGS.filter(isEnabled); }
export function getDisabledFlags() { return ALL_FEATURE_FLAGS.filter((f) => !isEnabled(f)); }

export function printFlags(logger) {
  const flags = getAllFlags();
  const enabled = Object.entries(flags).filter(([, v]) => v);
  const disabled = Object.entries(flags).filter(([, v]) => !v);
  logger.info('══════════════════════════════════════════════');
  logger.info(`  FEATURE FLAGS: ${enabled.length} enabled / ${disabled.length} disabled`);
  logger.info('══════════════════════════════════════════════');
  for (const [flag, value] of Object.entries(flags)) {
    logger.info(`  ${value ? '✓' : '✗'} ${flag.replace('FEATURE_', '')}`);
  }
  logger.info('══════════════════════════════════════════════');
}

export default { isEnabled, getAllFlags, getEnabledFlags, getDisabledFlags, printFlags, ALL_FEATURE_FLAGS };
