import { Router } from 'express';
import * as ctrl from '../controllers/friend.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { friendLimiter } from '../middlewares/rateLimiter.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { friendRequestSchema } from '../utils/validators.js';

const router = Router();
router.get('/', requireAuth, ctrl.getFriends);
router.get('/requests', requireAuth, ctrl.getRequests);
router.get('/requests/unseen-count', requireAuth, ctrl.getUnseenCount);
router.patch('/requests/mark-seen', requireAuth, ctrl.markAllSeen);
router.get('/requests/sent', requireAuth, ctrl.getSentRequests);
router.post('/request/:userId', requireAuth, friendLimiter, validate(friendRequestSchema), ctrl.sendRequest);
router.delete('/request/:userId', requireAuth, ctrl.cancelRequest);
router.patch('/request/:reqId/accept', requireAuth, ctrl.acceptRequest);
router.patch('/request/:reqId/reject', requireAuth, ctrl.rejectRequest);
router.delete('/:userId', requireAuth, ctrl.removeFriend);

export default router;
