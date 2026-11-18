import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'monitoramento-keep-alive',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

export default router;
