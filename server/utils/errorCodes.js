/**
 * @fileoverview Chatify error codes — every error has a unique CHAT_ERR_XXX code.
 * @module utils/errorCodes
 */

const ERROR_CODES = {
  // ── Authentication (001–019) ──
  CHAT_ERR_001: { status: 401, message: 'Authentication required' },
  CHAT_ERR_002: { status: 403, message: 'Access denied — insufficient permissions' },
  CHAT_ERR_003: { status: 404, message: 'Resource not found' },
  CHAT_ERR_004: { status: 409, message: 'Resource already exists' },
  CHAT_ERR_005: { status: 422, message: 'Validation failed' },
  CHAT_ERR_006: { status: 429, message: 'Too many requests — rate limit exceeded' },
  CHAT_ERR_007: { status: 401, message: 'Invalid or expired access token' },
  CHAT_ERR_008: { status: 401, message: 'Invalid or expired refresh token' },
  CHAT_ERR_009: { status: 401, message: 'Token has been blacklisted' },
  CHAT_ERR_010: { status: 404, message: 'Feature is not enabled' },
  CHAT_ERR_011: { status: 401, message: 'Invalid credentials' },
  CHAT_ERR_012: { status: 423, message: 'Account is locked — too many failed attempts' },
  CHAT_ERR_013: { status: 403, message: 'Email not verified' },
  CHAT_ERR_014: { status: 400, message: 'Invalid verification token' },
  CHAT_ERR_015: { status: 400, message: 'Verification token expired' },
  CHAT_ERR_016: { status: 400, message: 'Email already verified' },
  CHAT_ERR_017: { status: 403, message: 'Account is banned' },
  CHAT_ERR_018: { status: 400, message: 'Invalid password reset token' },
  CHAT_ERR_019: { status: 400, message: 'Password does not meet requirements' },

  // ── 2FA (020–029) ──
  CHAT_ERR_020: { status: 400, message: '2FA is not enabled for this account' },
  CHAT_ERR_021: { status: 400, message: '2FA is already enabled' },
  CHAT_ERR_022: { status: 400, message: 'Invalid 2FA code' },
  CHAT_ERR_023: { status: 400, message: '2FA setup required — scan QR code first' },
  CHAT_ERR_024: { status: 401, message: '2FA verification required' },

  // ── User (030–039) ──
  CHAT_ERR_030: { status: 404, message: 'User not found' },
  CHAT_ERR_031: { status: 409, message: 'Username already taken' },
  CHAT_ERR_032: { status: 409, message: 'Email already registered' },
  CHAT_ERR_033: { status: 400, message: 'Invalid username format' },
  CHAT_ERR_034: { status: 400, message: 'Cannot perform action on own account' },
  CHAT_ERR_035: { status: 403, message: 'User has blocked you' },
  CHAT_ERR_036: { status: 403, message: 'You have blocked this user' },
  CHAT_ERR_037: { status: 400, message: 'Cannot upgrade — account is not anonymous' },
  CHAT_ERR_038: { status: 413, message: 'Avatar file too large (max 2MB)' },
  CHAT_ERR_039: { status: 415, message: 'Invalid avatar format (jpg, png, webp only)' },

  // ── Conversation (040–049) ──
  CHAT_ERR_040: { status: 404, message: 'Conversation not found' },
  CHAT_ERR_041: { status: 403, message: 'Not a participant in this conversation' },
  CHAT_ERR_042: { status: 409, message: 'Conversation already exists between these users' },
  CHAT_ERR_043: { status: 403, message: 'Conversation is blocked' },
  CHAT_ERR_044: { status: 403, message: 'Conversation is archived' },
  CHAT_ERR_045: { status: 400, message: 'DM conversations require exactly 2 participants' },

  // ── Message (050–059) ──
  CHAT_ERR_050: { status: 404, message: 'Message not found' },
  CHAT_ERR_051: { status: 403, message: 'Cannot edit this message — not the author' },
  CHAT_ERR_052: { status: 403, message: 'Cannot edit — edit window expired (5 minutes)' },
  CHAT_ERR_053: { status: 403, message: 'Cannot delete this message' },
  CHAT_ERR_054: { status: 400, message: 'Message content exceeds maximum length (4000 chars)' },
  CHAT_ERR_055: { status: 400, message: 'Invalid reaction emoji' },
  CHAT_ERR_056: { status: 400, message: 'Duplicate message — clientId already processed' },
  CHAT_ERR_057: { status: 400, message: 'Cannot reply to a deleted message' },
  CHAT_ERR_058: { status: 400, message: 'Cannot pin more than 50 messages per conversation' },

  // ── Security (060–069) ──
  CHAT_ERR_060: { status: 403, message: 'IP address is banned' },
  CHAT_ERR_061: { status: 403, message: 'Suspicious activity detected' },
  CHAT_ERR_062: { status: 400, message: 'Encryption key detected in request payload — rejected for security' },
  CHAT_ERR_063: { status: 403, message: 'HTTPS required in production' },
  CHAT_ERR_064: { status: 403, message: 'CORS origin not allowed' },

  // ── Friend Requests (070–079) ──
  CHAT_ERR_070: { status: 404, message: 'Friend request not found' },
  CHAT_ERR_071: { status: 409, message: 'Friend request already exists' },
  CHAT_ERR_072: { status: 400, message: 'Cannot send friend request to yourself' },
  CHAT_ERR_073: { status: 400, message: 'Cannot send friend request — cooldown active (7 days after rejection)' },
  CHAT_ERR_074: { status: 400, message: 'Users are already friends' },
  CHAT_ERR_075: { status: 403, message: 'Cannot send friend request — user has blocked you' },
  CHAT_ERR_076: { status: 400, message: 'Only the sender can cancel a request' },

  // ── Notifications (080–089) ──
  CHAT_ERR_080: { status: 404, message: 'Notification not found' },
  CHAT_ERR_081: { status: 400, message: 'Push subscription invalid' },

  // ── Socket (090–099) ──
  CHAT_ERR_090: { status: 429, message: 'Socket rate limit exceeded' },
  CHAT_ERR_091: { status: 400, message: 'Invalid socket event payload' },
  CHAT_ERR_092: { status: 401, message: 'Socket authentication failed' },

  // ── Email (100–109) ──
  CHAT_ERR_100: { status: 500, message: 'Email delivery failed after all retries' },
  CHAT_ERR_101: { status: 500, message: 'Unknown email provider configured' },
  CHAT_ERR_102: { status: 500, message: 'Email template not found' },

  // ── System (500) ──
  CHAT_ERR_500: { status: 500, message: 'Internal server error' },
  CHAT_ERR_503: { status: 503, message: 'Service temporarily unavailable' },
};

/**
 * Get error details by code.
 * @param {string} code - Error code (e.g., "CHAT_ERR_001")
 * @returns {{ status: number, message: string }}
 */
export function getError(code) {
  return ERROR_CODES[code] || ERROR_CODES.CHAT_ERR_500;
}

/**
 * Create an Error object with a Chatify error code.
 * @param {string} code - Error code
 * @param {string} [customMessage] - Override default message
 * @returns {Error} Error with code and status properties
 */
export function createError(code, customMessage) {
  const errorDef = getError(code);
  const err = new Error(customMessage || errorDef.message);
  err.code = code;
  err.status = errorDef.status;
  return err;
}

export { ERROR_CODES };
export default ERROR_CODES;
