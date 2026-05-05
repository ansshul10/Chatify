import { Router } from 'express';
import * as ctrl from '../controllers/conversation.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { disappearingSchema, muteSchema } from '../utils/validators.js';

const router = Router();
router.get('/', requireAuth, ctrl.getConversations);
router.post('/', requireAuth, ctrl.createConversation);
router.get('/:convId', requireAuth, ctrl.getConversation);
router.patch('/:convId/archive', requireAuth, ctrl.archiveConversation);
router.patch('/:convId/unarchive', requireAuth, ctrl.unarchiveConversation);
router.patch('/:convId/disappearing', requireAuth, validate(disappearingSchema), ctrl.setDisappearing);
router.patch('/:convId/mute', requireAuth, validate(muteSchema), ctrl.muteConversation);
router.delete('/:convId', requireAuth, ctrl.deleteConversation);

export default router;
