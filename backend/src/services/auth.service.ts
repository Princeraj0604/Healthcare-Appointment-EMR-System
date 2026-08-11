import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { userRepository } from '../repositories/user.repository';
import { generateAccessToken, createRefreshToken } from './token.service';
import { sendOTP, verifyOTP } from './otp.service';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';
import type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '../validations/auth.validation';

const BCRYPT_ROUNDS = 12;

// ============================================================
// Auth Service — Core authentication business logic
// ============================================================

export const authService = {
  /**
   * Register a new patient or doctor
   * Flow: validate → check duplicate → hash password → create user → create profile → send OTP
   */
  async register(
    input: RegisterInput,
    meta: { userAgent?: string; ipAddress?: string }
  ) {
    // Check for duplicate email
    if (await userRepository.emailExists(input.email)) {
      throw ApiError.conflict('An account with this email already exists');
    }

    // Check for duplicate phone
    if (input.phone && (await userRepository.phoneExists(input.phone))) {
      throw ApiError.conflict('An account with this phone number already exists');
    }

    // Doctor-specific validation
    if (input.role === 'DOCTOR') {
      if (!input.specialization || !input.qualification || !input.experience || !input.consultationFee || !input.registrationNumber) {
        throw ApiError.badRequest('Doctor registration requires: specialization, qualification, experience, consultationFee, and registrationNumber');
      }
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    // Use a transaction to create user + profile atomically
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the base user
      const user = await tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone,
          passwordHash,
          role: input.role,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          avatar: true,
          isVerified: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // 2. Create role-specific profile
      if (input.role === 'DOCTOR') {
        await tx.doctor.create({
          data: {
            userId: user.id,
            specialization: input.specialization!,
            qualification: input.qualification!,
            experience: input.experience!,
            consultationFee: input.consultationFee!,
            registrationNumber: input.registrationNumber!,
          },
        });
      } else {
        await tx.patient.create({
          data: { userId: user.id },
        });
      }

      return user;
    });

    // Send OTP for email verification (outside transaction)
    await sendOTP(result.id, 'EMAIL_VERIFICATION', result.email, result.name);

    logger.info(`New ${input.role} registered: ${result.email}`);

    return {
      user: result,
      message: 'Registration successful. Please check your email for OTP verification.',
    };
  },

  /**
   * Login — returns access + refresh tokens
   */
  async login(
    input: LoginInput,
    meta: { userAgent?: string; ipAddress?: string }
  ) {
    // Get user with password hash
    const user = await userRepository.findByEmailWithPassword(input.email);

    if (!user) {
      // Generic message to prevent user enumeration
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been deactivated. Contact support.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Warn if not verified (but still allow login)
    const warningMessage = !user.isVerified
      ? 'Warning: Your email is not verified. Some features may be restricted.'
      : undefined;

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const refreshToken = await createRefreshToken(user.id, meta);

    // Update last login
    await userRepository.updateLastLogin(user.id);

    logger.info(`User logged in: ${user.email}`);

    const { passwordHash: _, ...safeUser } = user;

    return {
      user: safeUser,
      accessToken,
      refreshToken,
      ...(warningMessage && { warning: warningMessage }),
    };
  },

  /**
   * Verify OTP for email verification
   */
  async verifyEmail(userId: string, otp: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    if (user.isVerified) {
      throw ApiError.conflict('Email is already verified');
    }

    await verifyOTP(userId, otp, 'EMAIL_VERIFICATION');
    await userRepository.markAsVerified(userId);

    logger.info(`Email verified for user: ${userId}`);

    return { message: 'Email verified successfully' };
  },

  /**
   * Resend OTP
   */
  async resendOTP(
    email: string,
    purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'PHONE_VERIFICATION'
  ) {
    const user = await userRepository.findByEmailWithPassword(email);
    if (!user) {
      // Don't reveal if user exists
      return { message: 'If an account with this email exists, an OTP has been sent.' };
    }

    await sendOTP(user.id, purpose, user.email, user.name);
    return { message: 'OTP sent successfully. Please check your email.' };
  },

  /**
   * Forgot password — sends reset OTP
   */
  async forgotPassword(input: ForgotPasswordInput) {
    const user = await userRepository.findByEmailWithPassword(input.email);
    if (user) {
      await sendOTP(user.id, 'PASSWORD_RESET', user.email, user.name);
    }
    // Always return same message (prevent user enumeration)
    return { message: 'If an account with this email exists, a password reset OTP has been sent.' };
  },

  /**
   * Reset password with OTP verification
   */
  async resetPassword(input: ResetPasswordInput) {
    const user = await userRepository.findByEmailWithPassword(input.email);
    if (!user) {
      throw ApiError.badRequest('Invalid request');
    }

    await verifyOTP(user.id, input.otp, 'PASSWORD_RESET');

    const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
    await userRepository.updatePassword(user.id, passwordHash);

    logger.info(`Password reset for user: ${user.id}`);

    return { message: 'Password reset successful. Please login with your new password.' };
  },

  /**
   * Change password (authenticated)
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    const user = await userRepository.findByEmailWithPassword(
      (await userRepository.findById(userId))!.email
    );

    if (!user) throw ApiError.notFound('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw ApiError.badRequest('Current password is incorrect');
    }

    if (await bcrypt.compare(newPassword, user.passwordHash)) {
      throw ApiError.badRequest('New password must be different from the current password');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await userRepository.updatePassword(userId, passwordHash);

    return { message: 'Password changed successfully' };
  },

  /**
   * Get authenticated user profile
   */
  async getProfile(userId: string) {
    const user = await userRepository.findWithProfile(userId);
    if (!user) throw ApiError.notFound('User not found');
    return user;
  },
};
