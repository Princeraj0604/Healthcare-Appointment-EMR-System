import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/token.service';
import { ApiError } from '../utils/ApiError';
import { userRepository } from '../repositories/user.repository';

// ============================================================
// Auth Middleware — Verifies JWT access token
// Attaches decoded user to req.user for downstream use
// ============================================================

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided. Include "Authorization: Bearer <token>" header.');
    }

    const token = authHeader.split(' ')[1];

    // Verify and decode the token
    const payload = verifyAccessToken(token);

    // Optional: verify user still exists and is active (adds DB call)
    // Comment out if you prefer pure stateless JWT
    const user = await userRepository.findById(payload.userId);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Account not found or has been deactivated');
    }

    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional auth — attaches user if token present, but doesn't block
 * Used for public endpoints that behave differently when authenticated
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = verifyAccessToken(token);
      req.user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        name: payload.name,
      };
    }
  } catch {
    // Silently ignore invalid tokens in optional auth
  }
  next();
}
