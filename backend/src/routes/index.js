import { Router } from 'express';
import authRoutes from './authRoutes.js';
import healthRoutes from './healthRoutes.js';
import monitoringRoutes from './monitoringRoutes.js';
import projectRoutes from './projectRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use(monitoringRoutes);

export default router;
