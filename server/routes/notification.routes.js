import { Router } from 'express';
import * as ctrl from '../controllers/notification.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();
router.get('/', requireAuth, ctrl.getNotifications);
router.patch('/:notifId/read', requireAuth, ctrl.markRead);
router.patch('/read-all', requireAuth, ctrl.markAllRead);
router.patch('/mark-seen', requireAuth, ctrl.markAllSeen);
router.post('/push/subscribe', requireAuth, ctrl.subscribePush);
router.delete('/push/unsubscribe', requireAuth, ctrl.unsubscribePush);
router.get('/unread-count', requireAuth, ctrl.getUnreadCount);

export default router;
