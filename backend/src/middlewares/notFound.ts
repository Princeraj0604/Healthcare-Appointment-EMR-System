import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

// ============================================================
// 404 Not Found — Catches any request that didn't match routes
// ============================================================

export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
