import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

// ============================================================
// Validation Middleware — validates req.body, req.params, req.query
// against a Zod schema. On failure → 422 with field-level errors.
// ============================================================

export const validate =
  (schema: AnyZodObject) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(error); // Passed to global errorHandler which formats ZodError
      } else {
        next(error);
      }
    }
  };
