/**
 * @fileoverview Auth routes — 14 authentication endpoints.
 * @module routes/auth.routes
 */

import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/rateLimiter.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  registerSchema, loginSchema, forgotPasswordSchema,
  resetPasswordSchema, twoFactorSchema, upgradeSchema,
} from '../utils/validators.js';

const router = Router();

// Public routes (rate-limited)
router.post('/anonymous', authLimiter, auth.anonymous);
router.post('/register', authLimiter, validate(registerSchema), auth.register);
router.post('/login', authLimiter, validate(loginSchema), auth.login);
router.post('/refresh', auth.refresh);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), auth.forgotPassword);
router.post('/reset-password/:token', authLimiter, validate(resetPasswordSchema), auth.resetPassword);
router.post('/verify-email', auth.verifyEmail);

// Protected routes
router.get('/me', requireAuth, auth.me);
router.post('/logout', requireAuth, auth.logout);
router.post('/resend-verification', requireAuth, auth.resendVerification);
router.post('/upgrade', requireAuth, validate(upgradeSchema), auth.upgrade);
router.post('/2fa/setup', requireAuth, auth.setup2FA);
router.post('/2fa/enable', requireAuth, validate(twoFactorSchema), auth.enable2FA);
router.post('/2fa/disable', requireAuth, auth.disable2FA);
router.post('/change-password', requireAuth, authLimiter, auth.changePassword);

export default router;
