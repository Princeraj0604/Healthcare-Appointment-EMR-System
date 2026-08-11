import 'express-async-errors'; // Must be first import!
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { requestLogger } from './middlewares/requestLogger';
import { notFound } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';
import apiRouter from './routes/index';

// ============================================================
// Express Application Factory
// ============================================================

export function createApp(): Application {
  const app = express();

  // ── Security Middleware ────────────────────────────────────
  app.use(helmet()); // Sets secure HTTP headers

  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Refresh-Token'],
    })
  );

  // ── Rate Limiting ──────────────────────────────────────────
  const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      statusCode: 429,
      message: 'Too many requests. Please try again later.',
      timestamp: new Date().toISOString(),
    },
    skip: (req) => req.path === `${env.API_PREFIX}/health`, // Don't rate-limit health checks
  });

  app.use(limiter);

  // ── Body Parsing ───────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ── Request Logging ────────────────────────────────────────
  app.use(requestLogger);

  // ── Trust Proxy (for rate limiting behind nginx/load balancer) ──
  app.set('trust proxy', 1);

  // ── Swagger API Documentation ──────────────────────────────
  try {
    const swaggerUi = require('swagger-ui-express');
    const YAML = require('yamljs');
    const path = require('path');
    const swaggerDocument = YAML.load(path.join(process.cwd(), 'swagger.yaml'));
    app.use(`${env.API_PREFIX}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  } catch (e) {
    // Ignore if swagger spec file is missing
  }

  // ── API Routes ─────────────────────────────────────────────
  app.use(env.API_PREFIX, apiRouter);

  // ── Root endpoint ──────────────────────────────────────────
  app.get('/', (_req, res) => {
    res.json({
      name: 'Healthcare Appointment System API',
      version: '1.0.0',
      docs: `${env.API_PREFIX}/docs`,
      health: `${env.API_PREFIX}/health`,
      status: 'running',
    });
  });

  // ── 404 Handler ────────────────────────────────────────────
  app.use(notFound);

  // ── Global Error Handler (must be last!) ───────────────────
  app.use(errorHandler);

  return app;
}
