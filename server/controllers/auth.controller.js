/**
 * @fileoverview Auth controller — handles all 14 auth endpoints.
 * @module controllers/auth.controller
 */

import User from '../models/User.model.js';
import { getEnv } from '../config/validateEnv.js';
import { isEnabled } from '../utils/featureFlags.js';
import * as authService from '../services/auth.service.js';
import { queueEmail } from '../services/emailQueue.service.js';
import { generateAnonymousName, generateAnonymousId } from '../utils/anonymousName.js';
import * as api from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

/**
 * POST /api/auth/anonymous — Create anonymous user + JWT.
 */
export async function anonymous(req, res) {
  if (!isEnabled('FEATURE_ANONYMOUS_CHAT')) return api.featureDisabled(res, 'FEATURE_ANONYMOUS_CHAT');

  try {
    const anonId = generateAnonymousId();
    const username = anonId.replace('anon_', '');
    const displayName = username;

    const user = await User.create({
      username,
      displayName,
      isAnonymous: true,
      anonymousId: anonId,
      isEmailVerified: false,
      isActive: true,
    });

    const payload = { id: user._id, username: user.username, role: 'user', isAnonymous: true };
    const accessToken = authService.generateAccessToken(payload);
    const refreshToken = await authService.generateRefreshToken(user._id.toString());
    authService.setAuthCookies(res, accessToken, refreshToken);

    logger.info(`[AUTH] Anonymous user created: ${user.username} (${user._id})`);
    api.created(res, { user: user.toSafeObject(), accessToken });
  } catch (err) {
    logger.error(`[AUTH] Anonymous login failed: ${err.message}`, { stack: err.stack });
    return api.error(res, 'CHAT_ERR_500', err.message, 500);
  }
}

/**
 * POST /api/auth/register — Register with email + username + password.
 */
export async function register(req, res) {
  const { username, email, password, displayName } = req.body;

  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    if (existing.email === email) return api.conflict(res, 'Email already registered');
    return api.conflict(res, 'Username already taken');
  }

  const user = await User.create({
    username,
    email,
    passwordHash: password,
    displayName: displayName || username,
    isAnonymous: false,
  });

  // Send verification email
  if (isEnabled('FEATURE_EMAIL_VERIFICATION')) {
    const token = await authService.generateVerificationToken(user._id.toString());
    const env = getEnv();
    await queueEmail({
      to: email,
      subject: 'Verify your Chatify account',
      templateName: 'verify-email',
      vars: { USERNAME: user.username, VERIFY_URL: `${env.CLIENT_URL}/verify?token=${token}`, CODE: token.substring(0, 6).toUpperCase() },
    });
  }

  // Send welcome email
  await queueEmail({
    to: email,
    subject: 'Welcome to Chatify!',
    templateName: 'welcome',
    vars: { USERNAME: user.username, APP_URL: getEnv().CLIENT_URL },
  });

  const payload = { id: user._id, username: user.username, role: 'user', isAnonymous: false };
  const accessToken = authService.generateAccessToken(payload);
  const refreshToken = await authService.generateRefreshToken(user._id.toString());
  authService.setAuthCookies(res, accessToken, refreshToken);

  logger.info(`[AUTH] User registered: ${user.username} (${user._id})`);
  api.created(res, { user: user.toSafeObject(), accessToken });
}

/**
 * POST /api/auth/login — Login with credentials → httpOnly cookies.
 */
export async function login(req, res) {
  const { identifier, password } = req.body;
  const env = getEnv();

  // Brute force check
  if (isEnabled('FEATURE_BRUTE_FORCE_LOCK')) {
    const attempts = await authService.trackLoginAttempt(req.ip, identifier);
    if (attempts > 5) return api.rateLimited(res, 'Too many login attempts. Try again in 15 minutes.');
  }

  const user = await User.findByEmailOrUsername(identifier);
  if (!user) return api.error(res, 'CHAT_ERR_011', 'Invalid credentials', 401);
  if (user.isBanned) return api.error(res, 'CHAT_ERR_017', `Account banned: ${user.banReason}`, 403);
  if (user.isLocked()) return api.error(res, 'CHAT_ERR_012', 'Account locked. Try again in 30 minutes.', 423);

  const valid = await user.comparePassword(password);
  if (!valid) {
    await user.incrementLoginAttempts();
    return api.error(res, 'CHAT_ERR_011', 'Invalid credentials', 401);
  }

  // Check if 2FA is enabled
  if (user.twoFactorEnabled && isEnabled('FEATURE_2FA')) {
    const { totpCode } = req.body;

    if (!totpCode) {
      const tempToken = authService.generateAccessToken({ id: user._id, require2FA: true });
      
      // Send Email 2FA Code
      try {
        const emailCode = await authService.generateEmail2FACode(user._id.toString());
        await queueEmail({
          to: user.email,
          subject: 'Your 2FA Code - Chatify',
          templateName: '2fa-code',
          vars: { USERNAME: user.username, CODE: emailCode }
        });
      } catch (err) {
        logger.error(`[AUTH] Failed to send 2FA email: ${err.message}`);
      }

      return api.success(res, { require2FA: true, tempToken });
    }

    // Verify code (try TOTP then Email)
    const userWithSecret = await User.findById(user._id).select('+twoFactorSecret');
    let valid2FA = authService.verify2FACode(totpCode, userWithSecret.twoFactorSecret);
    
    if (!valid2FA) {
      valid2FA = await authService.verifyEmail2FACode(user._id.toString(), totpCode);
    }

    if (!valid2FA) return api.error(res, 'CHAT_ERR_022', 'Invalid 2FA code', 401);
  }

  await user.resetLoginAttempts();
  user.lastLoginAt = new Date();
  user.lastLoginIP = req.ip;

  // Track Session
  const ua = req.headers['user-agent'] || 'Unknown';
  let deviceName = 'Web Browser';
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone')) os = 'iOS';

  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';

  deviceName = `${browser} on ${os}`;

  // Keep only last 5 sessions
  user.sessions.unshift({
    deviceId: req.headers['sec-ch-ua-platform'] || os,
    deviceName,
    browser,
    os,
    ip: req.ip,
    lastActive: new Date()
  });
  if (user.sessions.length > 5) user.sessions.pop();

  await user.save();

  const payload = { id: user._id, username: user.username, role: user.role, isAnonymous: false };
  const accessToken = authService.generateAccessToken(payload);
  const refreshToken = await authService.generateRefreshToken(user._id.toString());
  authService.setAuthCookies(res, accessToken, refreshToken);

  // New login alert
  if (isEnabled('FEATURE_LOGIN_ALERT')) {
    await queueEmail({
      to: user.email,
      subject: 'New login to your Chatify account',
      templateName: 'new-login',
      vars: { USERNAME: user.username, IP: req.ip, TIME: new Date().toISOString(), USER_AGENT: req.headers['user-agent'] || 'Unknown' },
    });
  }

  logger.info(`[AUTH] Login: ${user.username} (${user._id}) from ${req.ip}`);
  api.success(res, { user: user.toSafeObject(), accessToken });
}

/**
 * POST /api/auth/refresh — Rotate refresh token.
 */
export async function refresh(req, res) {
  const token = req.cookies?.refreshToken;
  if (!token) return api.unauthorized(res, 'No refresh token provided');

  try {
    const decoded = await authService.verifyRefreshToken(token);
    await authService.blacklistRefreshToken(decoded.id);

    const user = await User.findById(decoded.id);
    if (!user) return api.unauthorized(res, 'User not found');

    const payload = { id: user._id, username: user.username, role: user.role, isAnonymous: user.isAnonymous };
    const accessToken = authService.generateAccessToken(payload);
    const refreshToken = await authService.generateRefreshToken(user._id.toString());
    authService.setAuthCookies(res, accessToken, refreshToken);

    api.success(res, { accessToken });
  } catch (err) {
    logger.warn(`[AUTH] Refresh failed: ${err.message}`);
    return api.unauthorized(res, 'Invalid or expired refresh token');
  }
}

/**
 * POST /api/auth/logout — Blacklist refresh token.
 */
export async function logout(req, res) {
  if (req.user) {
    const user = await User.findById(req.user.id);
    if (user && user.isAnonymous) {
      await User.findByIdAndDelete(req.user.id);
      logger.info(`[AUTH] Anonymous user deleted on logout: user:${req.user.id}`);
    } else {
      await authService.blacklistRefreshToken(req.user.id);
      logger.info(`[AUTH] Logout: user:${req.user.id}`);
    }
  }
  authService.clearAuthCookies(res);
  api.success(res, { message: 'Logged out' });
}

/**
 * GET /api/auth/me — Return current user.
 */
export async function me(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return api.notFound(res, 'User not found');
  api.success(res, { user: user.toSafeObject() });
}

/**
 * POST /api/auth/forgot-password
 */
export async function forgotPassword(req, res) {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always return success to prevent email enumeration
  if (!user) return api.success(res, { message: 'If an account exists, a reset link has been sent.' });

  const token = await authService.generateResetToken(user._id.toString());
  const env = getEnv();
  await queueEmail({
    to: email,
    subject: 'Reset your Chatify password',
    templateName: 'reset-password',
    vars: { USERNAME: user.username, RESET_URL: `${env.CLIENT_URL}/reset-password?token=${token}` },
  });

  api.success(res, { message: 'If an account exists, a reset link has been sent.' });
}

/**
 * POST /api/auth/reset-password/:token
 */
export async function resetPassword(req, res) {
  const userId = await authService.verifyResetToken(req.params.token);
  if (!userId) return api.error(res, 'CHAT_ERR_018', 'Invalid or expired reset token', 400);

  const user = await User.findById(userId).select('+passwordHash');
  if (!user) return api.notFound(res, 'User not found');

  user.passwordHash = req.body.password;
  await user.save();
  await authService.blacklistRefreshToken(userId);

  logger.info(`[AUTH] Password reset: ${user.username} (${user._id})`);
  api.success(res, { message: 'Password has been reset. Please log in.' });
}

/**
 * POST /api/auth/verify-email
 */
export async function verifyEmail(req, res) {
  const { token } = req.body;
  const userId = await authService.verifyVerificationToken(token);
  if (!userId) return api.error(res, 'CHAT_ERR_014', 'Invalid verification token', 400);

  const user = await User.findById(userId);
  if (!user) return api.notFound(res);
  if (user.isEmailVerified) return api.error(res, 'CHAT_ERR_016', 'Email already verified', 400);

  user.isEmailVerified = true;
  await user.save();

  logger.info(`[AUTH] Email verified: ${user.username} (${user._id})`);
  api.success(res, { message: 'Email verified successfully' });
}

/**
 * POST /api/auth/resend-verification
 */
export async function resendVerification(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return api.notFound(res);
  if (user.isEmailVerified) return api.error(res, 'CHAT_ERR_016', 'Email already verified', 400);
  if (!user.email) return api.error(res, 'CHAT_ERR_030', 'No email on account', 400);

  const token = await authService.generateVerificationToken(user._id.toString());
  const env = getEnv();
  await queueEmail({
    to: user.email,
    subject: 'Verify your Chatify account',
    templateName: 'verify-email',
    vars: { USERNAME: user.username, VERIFY_URL: `${env.CLIENT_URL}/verify?token=${token}`, CODE: token.substring(0, 6).toUpperCase() },
  });

  api.success(res, { message: 'Verification email sent' });
}

/**
 * POST /api/auth/upgrade — Anon → registered.
 */
export async function upgrade(req, res) {
  if (!isEnabled('FEATURE_UPGRADE_ANON')) return api.featureDisabled(res, 'FEATURE_UPGRADE_ANON');

  const user = await User.findById(req.user.id).select('+passwordHash');
  if (!user) return api.notFound(res);
  if (!user.isAnonymous) return api.error(res, 'CHAT_ERR_037', 'Account is not anonymous', 400);

  const { username, email, password } = req.body;
  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) return api.conflict(res, 'Email or username already taken');

  user.username = username;
  user.email = email;
  user.passwordHash = password;
  user.isAnonymous = false;
  user.displayName = username;
  await user.save();

  const payload = { id: user._id, username, role: 'user', isAnonymous: false };
  const accessToken = authService.generateAccessToken(payload);
  const refreshToken = await authService.generateRefreshToken(user._id.toString());
  authService.setAuthCookies(res, accessToken, refreshToken);

  logger.info(`[AUTH] Upgraded anon → registered: ${username} (${user._id})`);
  api.success(res, { user: user.toSafeObject(), accessToken });
}

/**
 * POST /api/auth/2fa/setup
 */
export async function setup2FA(req, res) {
  if (!isEnabled('FEATURE_2FA')) return api.featureDisabled(res, 'FEATURE_2FA');

  const user = await User.findById(req.user.id);
  if (!user) return api.notFound(res);
  if (user.twoFactorEnabled) return api.error(res, 'CHAT_ERR_021', '2FA already enabled', 400);

  const result = await authService.setup2FA(user.username);

  // Temporarily store the secret — not yet enabled
  user.twoFactorSecret = result.secret;
  await user.save();

  api.success(res, { qrCode: result.qrCode, otpauthUrl: result.otpauthUrl });
}

/**
 * POST /api/auth/2fa/enable
 */
export async function enable2FA(req, res) {
  const user = await User.findById(req.user.id).select('+twoFactorSecret');
  if (!user) return api.notFound(res);
  if (!user.twoFactorSecret) return api.error(res, 'CHAT_ERR_023', 'Run 2FA setup first', 400);

  const { code } = req.body;
  const valid = authService.verify2FACode(code, user.twoFactorSecret);
  if (!valid) return api.error(res, 'CHAT_ERR_022', 'Invalid 2FA code', 400);

  user.twoFactorEnabled = true;
  await user.save();

  logger.info(`[AUTH] 2FA enabled: ${user.username} (${user._id})`);
  api.success(res, { message: '2FA enabled successfully' });
}

/**
 * POST /api/auth/2fa/disable
 */
export async function disable2FA(req, res) {
  const user = await User.findById(req.user.id).select('+passwordHash');
  if (!user) return api.notFound(res);

  const { password } = req.body;
  const valid = await user.comparePassword(password);
  if (!valid) return api.error(res, 'CHAT_ERR_011', 'Invalid password', 401);

  user.twoFactorEnabled = false;
  user.twoFactorSecret = null;
  await user.save();

  logger.info(`[AUTH] 2FA disabled: ${user.username} (${user._id})`);
  api.success(res, { message: '2FA disabled' });
}

/**
 * POST /api/auth/change-password
 */
export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return api.error(res, 'CHAT_ERR_040', 'Both current and new passwords are required', 400);

  const user = await User.findById(req.user.id).select('+passwordHash');
  if (!user) return api.notFound(res);

  const valid = await user.comparePassword(currentPassword);
  if (!valid) return api.error(res, 'CHAT_ERR_011', 'Invalid current password', 401);

  user.passwordHash = newPassword;
  await user.save();

  logger.info(`[AUTH] Password changed for user: ${user.username} (${user._id})`);
  api.success(res, { message: 'Password changed successfully' });
}

export default {
  anonymous, register, login, refresh, logout, me,
  forgotPassword, resetPassword, verifyEmail, resendVerification,
  upgrade, setup2FA, enable2FA, disable2FA, changePassword
};
