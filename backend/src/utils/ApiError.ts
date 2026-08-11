// ============================================================
// ApiError — Custom error class for HTTP errors
// Extends Error so it works naturally with Express error handler.
// ============================================================

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean; // true = known error, false = bug
  public readonly errors?: unknown[];

  constructor(
    statusCode: number,
    message: string,
    errors?: unknown[],
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    // Captures proper stack trace (V8 only)
    Error.captureStackTrace(this, this.constructor);
  }

  // ──────────────────────────────────────────────────────────
  // 4xx Client Errors — Factory methods for common cases
  // ──────────────────────────────────────────────────────────

  static badRequest(message: string, errors?: unknown[]): ApiError {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message: string = 'Resource not found'): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, message);
  }

  static unprocessable(message: string, errors?: unknown[]): ApiError {
    return new ApiError(422, message, errors);
  }

  static tooManyRequests(message: string = 'Too many requests'): ApiError {
    return new ApiError(429, message);
  }

  // ──────────────────────────────────────────────────────────
  // 5xx Server Errors
  // ──────────────────────────────────────────────────────────

  static internal(message: string = 'Internal server error'): ApiError {
    return new ApiError(500, message, undefined, false);
  }

  static serviceUnavailable(message: string = 'Service unavailable'): ApiError {
    return new ApiError(503, message, undefined, false);
  }
}
