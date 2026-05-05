/**
 * @fileoverview Auth service — JWT, refresh tokens, 2FA, blacklisting.
 * @module services/auth.service
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { getEnv } from '../config/validateEnv.js';
import { getRedis } from '../config/redis.js';
import logger from '../utils/logger.js';

/**
 * Generate an access token.
 * @param {Object} payload - { id, username, role, isAnonymous }
 * @returns {string} JWT access token
 */
export function generateAccessToken(payload) {
  const env = getEnv();
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRY });
}

/**
 * Generate a refresh token and store its hash in Redis.
 * @param {string} userId - User ID
 * @returns {Promise<string>} Raw refresh token
 */
export async function generateRefreshToken(userId) {
  const env = getEnv();
  const redis = getRedis();
  const token = jwt.sign({ id: userId, type: 'refresh' }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY,
  });

  // Store SHA-256 hash in Redis (raw token never stored)
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const ttlSeconds = parseDuration(env.JWT_REFRESH_EXPIRY);
  await redis.setex(`refresh:${userId}`, ttlSeconds, hash);

  logger.debug(`[AUTH] Refresh token generated for user:${userId}`);
  return token;
}

/**
 * Verify a refresh token against its stored hash.
 * @param {string} token - Raw refresh token
 * @returns {Promise<Object>} Decoded token payload
 */
export async function verifyRefreshToken(token) {
  const env = getEnv();
  const redis = getRedis();

  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const storedHash = await redis.get(`refresh:${decoded.id}`);

  if (!storedHash || storedHash !== hash) {
    throw new Error('Refresh token has been invalidated');
  }

  return decoded;
}

/**
 * Blacklist a refresh token by deleting its hash from Redis.
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function blacklistRefreshToken(userId) {
  const redis = getRedis();
  await redis.del(`refresh:${userId}`);
  logger.debug(`[AUTH] Refresh token blacklisted for user:${userId}`);
}

/**
 * Generate an email verification token and store in Redis.
 * @param {string} userId - User ID
 * @returns {Promise<string>} Verification token
 */
export async function generateVerificationToken(userId) {
  const redis = getRedis();
  const token = crypto.randomBytes(32).toString('hex');
  await redis.setex(`verify:${token}`, 86400, userId); // 24h TTL
  return token;
}

/**
 * Verify an email verification token.
 * @param {string} token - Verification token
 * @returns {Promise<string|null>} User ID or null
 */
export async function verifyVerificationToken(token) {
  const redis = getRedis();
  const userId = await redis.get(`verify:${token}`);
  if (userId) await redis.del(`verify:${token}`);
  return userId;
}

/**
 * Generate a password reset token and store in Redis.
 * @param {string} userId - User ID
 * @returns {Promise<string>} Reset token
 */
export async function generateResetToken(userId) {
  const redis = getRedis();
  const token = crypto.randomBytes(32).toString('hex');
  await redis.setex(`reset:${token}`, 3600, userId); // 1h TTL
  return token;
}

/**
 * Verify a password reset token.
 * @param {string} token - Reset token
 * @returns {Promise<string|null>} User ID or null
 */
export async function verifyResetToken(token) {
  const redis = getRedis();
  const userId = await redis.get(`reset:${token}`);
  if (userId) await redis.del(`reset:${token}`);
  return userId;
}

/**
 * Setup 2FA for a user — generate TOTP secret and QR code URI.
 * @param {string} username - User's username
 * @returns {{ secret: string, otpauthUrl: string, qrCode: string }}
 */
export async function setup2FA(username) {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(username, 'Chatify', secret);
  const qrCode = await QRCode.toDataURL(otpauthUrl);
  return { secret, otpauthUrl, qrCode };
}

/**
 * Verify a TOTP code against a secret.
 * @param {string} code - 6-digit TOTP code
 * @param {string} secret - TOTP secret
 * @returns {boolean}
 */
export function verify2FACode(code, secret) {
  return authenticator.check(code, secret);
}

/**
 * Generate a 6-digit numeric 2FA code and store in Redis.
 * @param {string} userId - User ID
 * @returns {Promise<string>} 6-digit code
 */
export async function generateEmail2FACode(userId) {
  const redis = getRedis();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  await redis.setex(`2fa_email:${userId}`, 300, code); // 5 min TTL
  return code;
}

/**
 * Verify an email 2FA code.
 * @param {string} userId - User ID
 * @param {string} code - 6-digit code
 * @returns {Promise<boolean>} True if valid
 */
export async function verifyEmail2FACode(userId, code) {
  const redis = getRedis();
  const storedCode = await redis.get(`2fa_email:${userId}`);
  if (storedCode && storedCode === code) {
    await redis.del(`2fa_email:${userId}`);
    return true;
  }
  return false;
}

/**
 * Set httpOnly cookies for access and refresh tokens.
 * @param {import('express').Response} res
 * @param {string} accessToken
 * @param {string} refreshToken
 */
export function setAuthCookies(res, accessToken, refreshToken) {
  const env = getEnv();
  const isProduction = env.NODE_ENV === 'production';

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: parseDuration(env.JWT_ACCESS_EXPIRY) * 1000,
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: parseDuration(env.JWT_REFRESH_EXPIRY) * 1000,
    path: '/api/auth',
  });
}

/**
 * Clear auth cookies.
 * @param {import('express').Response} res
 */
export function clearAuthCookies(res) {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken', { path: '/api/auth' });
}

/**
 * Track login attempt in Redis for brute force detection.
 * @param {string} ip - Client IP
 * @param {string} email - Email used
 * @returns {Promise<number>} Current attempt count
 */
export async function trackLoginAttempt(ip, email) {
  const redis = getRedis();
  const key = `login_attempt:${ip}:${email}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 900); // 15 min window
  return count;
}

/**
 * Parse a duration string to seconds (e.g., "15m" → 900).
 * @param {string} dur - Duration string
 * @returns {number} Duration in seconds
 */
function parseDuration(dur) {
  const match = dur.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 900;
  const [, val, unit] = match;
  const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
  return parseInt(val) * (multipliers[unit] || 60);
}

export default {
  generateAccessToken, generateRefreshToken, verifyRefreshToken,
  blacklistRefreshToken, generateVerificationToken, verifyVerificationToken,
  generateResetToken, verifyResetToken, setup2FA, verify2FACode,
  generateEmail2FACode, verifyEmail2FACode,
  setAuthCookies, clearAuthCookies, trackLoginAttempt,
};
