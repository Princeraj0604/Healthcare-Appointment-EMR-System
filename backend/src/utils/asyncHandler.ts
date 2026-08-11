import { Request, Response, NextFunction } from 'express';

// ============================================================
// asyncHandler — Wraps async route handlers to catch errors
// Without this, unhandled promise rejections in async routes
// crash the server. This passes errors to Express error handler.
// ============================================================

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

export const asyncHandler =
  (fn: AsyncRouteHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
