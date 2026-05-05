import { Router } from 'express';
import * as ctrl from '../controllers/admin.controller.js';
import * as newsletter from '../controllers/newsletter.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import isAdmin from '../middlewares/isAdmin.middleware.js';
import requireFeature from '../middlewares/featureFlag.middleware.js';

const router = Router();
router.use(requireAuth, isAdmin, requireFeature('FEATURE_ADMIN_DASHBOARD'));
router.get('/stats', ctrl.getStats);
router.get('/users', ctrl.getUsers);
router.patch('/users/:userId/ban', ctrl.banUser);
router.get('/features', ctrl.getFeatureFlags);
router.patch('/features', ctrl.updateFeatureFlag);
router.get('/reports', ctrl.getReports);
router.post('/notifications/send', ctrl.sendNotification);
router.get('/logs', ctrl.getLogs);
router.get('/newsletter/subscribers', newsletter.getSubscribers);
router.get('/email/queue', ctrl.getEmailQueue);
router.post('/email/send-manual', ctrl.sendManualEmail);
router.post('/email/queue/resend', ctrl.resendQueueJob);

export default router;
