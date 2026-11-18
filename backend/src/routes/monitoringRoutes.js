import { Router } from 'express';
import { getRecentLogs, triggerCronPingAll } from '../controllers/pingController.js';
import { attachOptionalUser, verifyCronOrUser } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/logs', attachOptionalUser, getRecentLogs);
router.post('/cron/ping-all', verifyCronOrUser, triggerCronPingAll);

export default router;
