import { Router } from 'express';
import {
  forgotPassword,
  getCurrentUser,
  login,
  register,
  resetPassword,
} from '../controllers/authController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', requireAuth, getCurrentUser);

export default router;
