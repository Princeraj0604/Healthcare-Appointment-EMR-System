import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { env } from '../config/env';
import { AccessTokenPayload, RefreshTokenPayload } from '../types/index';
import { Role } from '@prisma/client';

// ============================================================
// Token Service — JWT Access + Refresh Token lifecycle
//
// Access Token:  Short-lived (15min), in Authorization header
// Refresh Token: Long-lived (7 days), stored in DB + sent to client
//                Rotation: old token revoked on each refresh
// ============================================================

// ── Access Token ─────────────────────────────────────────────

export function generateAccessToken(payload: {
  userId: string;
  email: string;
  role: Role;
  name: string;
}): string {
  const tokenPayload: AccessTokenPayload = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    name: payload.name,
  };

  return jwt.sign(tokenPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn'],
    issuer: 'healthcare-api',
    audience: 'healthcare-client',
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: 'healthcare-api',
    audience: 'healthcare-client',
  }) as AccessTokenPayload;
}

// ── Refresh Token ─────────────────────────────────────────────

export function generateRefreshTokenString(): string {
  return uuidv4() + '-' + uuidv4(); // Opaque token, not a JWT
}

/**
 * Create and persist a refresh token in the DB
 */
export async function createRefreshToken(
  userId: string,
  meta: { userAgent?: string; ipAddress?: string }
): Promise<string> {
  const token = generateRefreshTokenString();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    },
  });

  return token;
}

/**
 * Validate refresh token and rotate it (revoke old, create new)
 * Returns new token pair or throws if invalid/expired
 */
export async function rotateRefreshToken(
  oldToken: string,
  meta: { userAgent?: string; ipAddress?: string }
): Promise<{
  accessToken: string;
  refreshToken: string;
  userId: string;
}> {
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { token: oldToken },
    include: { user: true },
  });

  if (!tokenRecord) {
    throw new Error('Invalid refresh token');
  }

  if (tokenRecord.isRevoked) {
    // Possible token reuse attack — revoke ALL tokens for this user
    await prisma.refreshToken.updateMany({
      where: { userId: tokenRecord.userId },
      data: { isRevoked: true },
    });
    throw new Error('Refresh token reuse detected');
  }

  if (tokenRecord.expiresAt < new Date()) {
    throw new Error('Refresh token has expired');
  }

  // Revoke the old token
  await prisma.refreshToken.update({
    where: { id: tokenRecord.id },
    data: { isRevoked: true },
  });

  // Issue new tokens
  const accessToken = generateAccessToken({
    userId: tokenRecord.user.id,
    email: tokenRecord.user.email,
    role: tokenRecord.user.role,
    name: tokenRecord.user.name,
  });

  const refreshToken = await createRefreshToken(tokenRecord.userId, meta);

  return { accessToken, refreshToken, userId: tokenRecord.userId };
}

/**
 * Revoke a single refresh token (logout)
 */
export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { token },
    data: { isRevoked: true },
  });
}

/**
 * Revoke ALL refresh tokens for a user (logout from all devices)
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, isRevoked: false },
    data: { isRevoked: true },
  });
}

/**
 * Clean up expired tokens (call from a cron job)
 */
export async function deleteExpiredTokens(): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}
