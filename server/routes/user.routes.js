import { Router } from 'express';
import * as ctrl from '../controllers/user.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { profileLimiter, searchLimiter } from '../middlewares/rateLimiter.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { updateProfileSchema, updatePreferencesSchema } from '../utils/validators.js';

const router = Router();
router.get('/search', requireAuth, searchLimiter, ctrl.searchUsers);
router.get('/online', requireAuth, ctrl.getOnlineUsers);
router.get('/me/blocked', requireAuth, ctrl.getBlocked);
router.get('/:userId', requireAuth, ctrl.getUser);
router.patch('/me', requireAuth, profileLimiter, validate(updateProfileSchema), ctrl.updateProfile);
router.post('/me/avatar', requireAuth, profileLimiter, ctrl.uploadAvatar);
router.patch('/me/preferences', requireAuth, validate(updatePreferencesSchema), ctrl.updatePreferences);
router.patch('/me/privacy', requireAuth, ctrl.togglePrivacy);
router.post('/me/close-friends/:userId', requireAuth, ctrl.addCloseFriend);
router.delete('/me/close-friends/:userId', requireAuth, ctrl.removeCloseFriend);
router.get('/me/sessions', requireAuth, ctrl.getSessions);
router.delete('/me/sessions/:sessionId', requireAuth, ctrl.terminateSession);
router.delete('/me/account', requireAuth, ctrl.deleteAccount);
router.post('/me/block/:userId', requireAuth, ctrl.blockUser);
router.delete('/me/block/:userId', requireAuth, ctrl.unblockUser);
router.post('/:userId/report', requireAuth, ctrl.reportUser);

export default router;
