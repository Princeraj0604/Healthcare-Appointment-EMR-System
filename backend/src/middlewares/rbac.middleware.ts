import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ApiError } from '../utils/ApiError';

// ============================================================
// RBAC Middleware — Role-Based Access Control
// Must be used AFTER authenticate middleware.
//
// Usage:
//   router.get('/admin/stats', authenticate, authorize('ADMIN'), handler)
//   router.post('/records', authenticate, authorize('DOCTOR', 'ADMIN'), handler)
// ============================================================

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized('Authentication required'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        ApiError.forbidden(
          `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`
        )
      );
      return;
    }

    next();
  };
}

// ── Convenience exports ──────────────────────────────────────

/** Only PATIENT role */
export const patientOnly = authorize('PATIENT');

/** Only DOCTOR role */
export const doctorOnly = authorize('DOCTOR');

/** Only ADMIN role */
export const adminOnly = authorize('ADMIN');

/** DOCTOR or ADMIN */
export const doctorOrAdmin = authorize('DOCTOR', 'ADMIN');

/** Any authenticated user (PATIENT, DOCTOR, or ADMIN) */
export const anyRole = authorize('PATIENT', 'DOCTOR', 'ADMIN');

/**
 * Check if the requesting user owns the resource (matches param ID)
 * or is an admin
 */
export function ownerOrAdmin(userIdParam: string = 'id') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized('Authentication required'));
      return;
    }

    const targetId = req.params[userIdParam];
    const isOwner = req.user.id === targetId;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      next(ApiError.forbidden('You can only access your own resources'));
      return;
    }

    next();
  };
}
