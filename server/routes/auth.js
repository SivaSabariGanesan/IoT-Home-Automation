import express from 'express';
import { 
  register, 
  verifyOTP, 
  login, 
  forgotPassword, 
  resetPassword, 
  resendOTP,
  getCurrentUser
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/resend-otp', resendOTP);

// Protected routes
router.get('/me', authenticate, getCurrentUser);

export default router;