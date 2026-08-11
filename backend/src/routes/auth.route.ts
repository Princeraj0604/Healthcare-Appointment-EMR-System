import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  sendOTP,
  verifyOTP,
  forgotPassword,
  resetPassword,
  getMe,
  changePassword,
} from '../controllers/auth.controller';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  sendOTPSchema,
  verifyOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../validations/auth.validation';

const router = Router();

// ── Public routes ────────────────────────────────────────────

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new patient or doctor
 * @access  Public
 */
router.post('/register', validate(registerSchema), register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login and get tokens
 * @access  Public
 */
router.post('/login', validate(loginSchema), login);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Revoke refresh token
 * @access  Public (with refresh token)
 */
router.post('/logout', logout);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Get new access+refresh tokens using refresh token
 * @access  Public (with refresh token)
 */
router.post('/refresh-token', validate(refreshTokenSchema), refreshToken);

/**
 * @route   POST /api/v1/auth/send-otp
 * @desc    Send OTP for email verification or password reset
 * @access  Public
 */
router.post('/send-otp', validate(sendOTPSchema), sendOTP);

/**
 * @route   POST /api/v1/auth/verify-otp
 * @desc    Verify OTP for email verification
 * @access  Public
 */
router.post('/verify-otp', validate(verifyOTPSchema), verifyOTP);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Send password reset OTP
 * @access  Public
 */
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password using OTP
 * @access  Public
 */
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

// ── Protected routes (require JWT) ──────────────────────────

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get authenticated user profile
 * @access  Private
 */
router.get('/me', authenticate, getMe);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password (when logged in)
 * @access  Private
 */
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);

export default router;
