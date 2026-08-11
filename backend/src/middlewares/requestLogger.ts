import morgan, { StreamOptions } from 'morgan';
import logger from '../utils/logger';
import { env } from '../config/env';

// ============================================================
// HTTP Request Logger — Morgan piped into Winston
// Dev: compact colorized format
// Prod: structured JSON format
// ============================================================

const stream: StreamOptions = {
  write: (message: string) => logger.http(message.trim()),
};

const skip = (): boolean => {
  // Skip logging in test environment
  return env.NODE_ENV === 'test';
};

// Combined format for production log files (includes IP, method, URL, status, time)
const format =
  env.NODE_ENV === 'development'
    ? ':method :url :status :res[content-length] - :response-time ms'
    : ':remote-addr :method :url :status :res[content-length] :response-time ms ":user-agent"';

export const requestLogger = morgan(format, { stream, skip });
