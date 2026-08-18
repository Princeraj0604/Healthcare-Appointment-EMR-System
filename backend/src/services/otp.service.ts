import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/database';
import { env } from '../config/env';
import { sendOTPEmail } from '../utils/mailer';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';

// ============================================================
// OTP Service
//
// Design decisions:
//   - OTP is hashed (bcrypt) before storing — not plain text
//   - Redis is NOT used for OTP; stored in DB for persistence
//   - Old OTPs invalidated when new one is requested
//   - 10 minute expiry by default
//   - Dev mode support: '123456' master testing OTP + console log
// ============================================================

const OTP_LENGTH = env.OTP_LENGTH;
const OTP_EXPIRY_MS = env.OTP_EXPIRY_MINUTES * 60 * 1000;
const BCRYPT_ROUNDS = 10;

/**
 * Generate a numeric OTP of specified length
 */
function generateOTP(length: number): string {
  const buffer = crypto.randomBytes(length);
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += (buffer[i] % 10).toString();
  }
  return otp;
}

/**
 * Send OTP to user email and store hashed version in DB
 */
export async function sendOTP(
  userId: string,
  purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'PHONE_VERIFICATION',
  userEmail: string,
  userName: string
): Promise<void> {
  // Invalidate any existing unused OTPs for this purpose
  await prisma.oTPVerification.updateMany({
    where: { userId, purpose, isUsed: false },
    data: { isUsed: true },
  });

  const otp = generateOTP(OTP_LENGTH);
  const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  await prisma.oTPVerification.create({
    data: {
      userId,
      otp: otpHash,
      purpose,
      expiresAt,
    },
  });

  // Send email (non-blocking in development)
  sendOTPEmail({
    to: userEmail,
    name: userName,
    otp, // Send plain OTP to user
    purpose,
  }).catch((err) => {
    logger.warn('Failed to send OTP email via SMTP:', err?.message || err);
  });

  logger.info(`OTP sent to user ${userId} for purpose: ${purpose}`);

  // In development, always print OTP directly to console
  if (env.NODE_ENV === 'development') {
    console.log(`\n==============================================`);
    console.log(`🔑 [DEV OTP] Code for ${userEmail}: ${otp}`);
    console.log(`💡 [DEV OTP] You can also enter: 123456`);
    console.log(`==============================================\n`);
  }
}

/**
 * Verify OTP — returns true if valid, throws ApiError if not
 */
export async function verifyOTP(
  userId: string,
  plainOTP: string,
  purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'PHONE_VERIFICATION'
): Promise<void> {
  // Find the most recent unused OTP for this user+purpose
  const record = await prisma.oTPVerification.findFirst({
    where: {
      userId,
      purpose,
      isUsed: false,
      expiresAt: { gt: new Date() }, // Not expired
    },
    orderBy: { createdAt: 'desc' },
  });

  // In development mode, allow 123456 for fast testing
  const isMasterDevOTP = env.NODE_ENV === 'development' && plainOTP === '123456';

  if (!record && !isMasterDevOTP) {
    throw ApiError.badRequest('OTP is invalid or has expired. Please request a new one.');
  }

  let isValid = isMasterDevOTP;
  if (!isValid && record) {
    isValid = await bcrypt.compare(plainOTP, record.otp);
  }

  if (!isValid) {
    throw ApiError.badRequest('Incorrect OTP. Please check and try again.');
  }

  // Mark OTP as used if record exists
  if (record) {
    await prisma.oTPVerification.update({
      where: { id: record.id },
      data: { isUsed: true },
    });
  }

  logger.info(`OTP verified for user ${userId} [${purpose}]`);
}
