import { Router } from 'express';
import { triggerSinglePing } from '../controllers/pingController.js';
import {
  createProject,
  deleteProject,
  getAllProjects,
  getProjectById,
  updateProject,
} from '../controllers/projectController.js';
import { attachOptionalUser, requireAuth } from '../middlewares/authMiddleware.js';
import { pingRateLimiter } from '../middlewares/rateLimitMiddleware.js';

const router = Router();

router.get('/', attachOptionalUser, getAllProjects);
router.get('/:id', attachOptionalUser, getProjectById);
router.post('/', requireAuth, createProject);
router.patch('/:id', requireAuth, updateProject);
router.delete('/:id', requireAuth, deleteProject);
router.post('/:id/ping', requireAuth, pingRateLimiter, triggerSinglePing);

export default router;
