import { Router } from 'express';
import * as ctrl from '../controllers/message.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { messageLimiter, searchLimiter } from '../middlewares/rateLimiter.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { sendMessageSchema, editMessageSchema, reactionSchema } from '../utils/validators.js';

const router = Router();
router.get('/search', requireAuth, searchLimiter, ctrl.searchMessages);
router.get('/bookmarked', requireAuth, ctrl.getBookmarked);
router.get('/conversation/:convId', requireAuth, ctrl.getMessages);
router.post('/conversation/:convId', requireAuth, messageLimiter, validate(sendMessageSchema), ctrl.sendMessage);
router.patch('/:msgId', requireAuth, validate(editMessageSchema), ctrl.editMessage);
router.delete('/:msgId', requireAuth, ctrl.deleteMessage);
router.post('/:msgId/react', requireAuth, validate(reactionSchema), ctrl.reactToMessage);
router.post('/:msgId/bookmark', requireAuth, ctrl.bookmarkMessage);
router.post('/:msgId/pin', requireAuth, ctrl.pinMessage);

export default router;
