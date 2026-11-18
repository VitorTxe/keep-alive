import { Router } from 'express';
import { getRecentLogs, triggerCronPingAll } from '../controllers/pingController.js';
import { attachOptionalUser, verifyCronSecret } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/logs', attachOptionalUser, getRecentLogs);
router.post('/cron/ping-all', verifyCronSecret, triggerCronPingAll);

export default router;
