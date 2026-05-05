import { Router } from 'express';
import * as ctrl from '../controllers/system.controller.js';
import * as newsletter from '../controllers/newsletter.controller.js';

const router = Router();

router.get('/config', ctrl.getConfig);
router.post('/newsletter/subscribe', newsletter.subscribe);

export default router;
