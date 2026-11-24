import { Router } from 'express';
import {
  forgotPassword,
  getCurrentUser,
  login,
  register,
  resetPassword,
} from '../controllers/authController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { authRateLimiter } from '../middlewares/rateLimitMiddleware.js';

const router = Router();

router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPassword);
router.get('/me', requireAuth, getCurrentUser);

export default router;
