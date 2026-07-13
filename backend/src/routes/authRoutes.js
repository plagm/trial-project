import express from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  verifyEmail,
  forgotPassword,
  resetPassword,
  googleLogin
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.post('/logout', logoutUser);
router.get('/me', protect, getUserProfile);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;
