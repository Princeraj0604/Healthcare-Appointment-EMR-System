import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { env } from '../config/env';

// ============================================================
// Winston Logger — Structured, production-grade logging
// Formats: JSON in production, colorized in development
// Transports: Console + daily rotating log files
// ============================================================

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

// Dev-friendly format
const devFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
  return `${ts} [${level}]: ${stack ?? message}${metaStr}`;
});

const logDir = path.join(process.cwd(), 'logs');

// Daily rotating file transports
const fileRotateTransport = new DailyRotateFile({
  filename: path.join(logDir, 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: combine(timestamp(), errors({ stack: true }), json()),
});

const errorFileTransport = new DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error',
  format: combine(timestamp(), errors({ stack: true }), json()),
});

const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  defaultMeta: { service: 'healthcare-api' },
  transports: [
    // Always log to files
    fileRotateTransport,
    errorFileTransport,
  ],
  // Prevent crash on unhandled exceptions
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
    }),
  ],
});

// Add colorized console output in development
if (env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'HH:mm:ss' }),
        errors({ stack: true }),
        devFormat
      ),
    })
  );
}

export default logger;
