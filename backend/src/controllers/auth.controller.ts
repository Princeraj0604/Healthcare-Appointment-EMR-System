import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { rotateRefreshToken, revokeRefreshToken } from '../services/token.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

// ============================================================
// Auth Controller — thin layer, only handles HTTP concerns
// All business logic lives in authService
// ============================================================

/**
 * POST /api/v1/auth/register
 * Register as patient or doctor
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body, {
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  });

  res.status(201).json(
    new ApiResponse(201, result.message, { user: result.user })
  );
});

/**
 * POST /api/v1/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body, {
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  });

  res.status(200).json(
    new ApiResponse(200, 'Login successful', {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      ...(result.warning && { warning: result.warning }),
    })
  );
});

/**
 * POST /api/v1/auth/logout
 * Revoke the refresh token
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw ApiError.badRequest('Refresh token is required');
  }

  await revokeRefreshToken(refreshToken);

  res.status(200).json(
    ApiResponse.ok('Logged out successfully', null)
  );
});

/**
 * POST /api/v1/auth/refresh-token
 * Rotate access + refresh tokens
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: oldToken } = req.body;

  if (!oldToken) {
    throw ApiError.badRequest('Refresh token is required');
  }

  const tokens = await rotateRefreshToken(oldToken, {
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  });

  res.status(200).json(
    ApiResponse.ok('Token refreshed successfully', {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    })
  );
});

/**
 * POST /api/v1/auth/send-otp
 */
export const sendOTP = asyncHandler(async (req: Request, res: Response) => {
  const { email, purpose } = req.body;
  const result = await authService.resendOTP(email, purpose);

  res.status(200).json(ApiResponse.ok(result.message, null));
});

/**
 * POST /api/v1/auth/verify-otp
 * Verify email via OTP
 */
export const verifyOTP = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp, purpose } = req.body;

  if (purpose === 'EMAIL_VERIFICATION') {
    // Find user by email to get userId
    const { userRepository } = await import('../repositories/user.repository');
    const user = await userRepository.findByEmail(email);
    if (!user) throw ApiError.notFound('User not found');

    const result = await authService.verifyEmail(user.id, otp);
    res.status(200).json(ApiResponse.ok(result.message, null));
  } else {
    // For other purposes (password reset handled separately)
    throw ApiError.badRequest('Use the appropriate endpoint for this OTP purpose');
  }
});

/**
 * POST /api/v1/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.forgotPassword(req.body);
  res.status(200).json(ApiResponse.ok(result.message, null));
});

/**
 * POST /api/v1/auth/reset-password
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.resetPassword(req.body);
  res.status(200).json(ApiResponse.ok(result.message, null));
});

/**
 * GET /api/v1/auth/me
 * Get current user profile (authenticated)
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getProfile(req.user!.id);
  res.status(200).json(ApiResponse.ok('Profile fetched', user));
});

/**
 * POST /api/v1/auth/change-password
 * Change password (authenticated)
 */
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const result = await authService.changePassword(req.user!.id, currentPassword, newPassword);
  res.status(200).json(ApiResponse.ok(result.message, null));
});
