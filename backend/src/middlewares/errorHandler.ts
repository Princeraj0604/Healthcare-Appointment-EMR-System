import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';
import { env } from '../config/env';

// ============================================================
// Global Error Handler Middleware
// Must be registered LAST in Express middleware chain (4 params).
//
// Handles:
//   - ApiError (our custom operational errors)
//   - ZodError (validation failures)
//   - Prisma errors (DB constraint violations, not found, etc.)
//   - JWT errors
//   - Generic errors (unexpected bugs)
// ============================================================

interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors?: unknown[];
  stack?: string;
  timestamp: string;
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: unknown[] | undefined;

  // ── 1. Our own ApiError ─────────────────────────────────
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;

    if (err.isOperational) {
      logger.warn(`[ApiError] ${req.method} ${req.path} — ${message}`, {
        statusCode,
        errors,
      });
    } else {
      logger.error(`[ApiError:Internal] ${req.method} ${req.path}`, {
        message,
        stack: err.stack,
      });
    }
  }

  // ── 2. Zod validation errors ─────────────────────────────
  else if (err instanceof ZodError) {
    statusCode = 422;
    message = 'Validation failed';
    errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    logger.warn(`[ZodError] ${req.method} ${req.path}`, { errors });
  }

  // ── 3. Prisma errors ─────────────────────────────────────
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        // Unique constraint violation
        const field = (err.meta?.target as string[])?.join(', ') ?? 'field';
        statusCode = 409;
        message = `A record with this ${field} already exists`;
        break;
      }
      case 'P2025':
        // Record not found
        statusCode = 404;
        message = 'Record not found';
        break;
      case 'P2003':
        // Foreign key constraint
        statusCode = 400;
        message = 'Related record not found';
        break;
      default:
        statusCode = 400;
        message = 'Database operation failed';
    }
    logger.warn(`[PrismaError:${err.code}] ${req.method} ${req.path}`, {
      message,
    });
  }

  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided';
    logger.warn(`[PrismaValidation] ${req.method} ${req.path}`);
  }

  // ── 4. JWT errors ─────────────────────────────────────────
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
  }

  // ── 5. Generic / unexpected errors ───────────────────────
  else {
    logger.error(`[UnhandledError] ${req.method} ${req.path}`, {
      message: err.message,
      stack: err.stack,
    });
  }

  const response: ErrorResponse = {
    success: false,
    statusCode,
    message,
    errors,
    timestamp: new Date().toISOString(),
    // Only include stack trace in development
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
}
