import { Request, Response } from 'express';
import prisma from '../config/database';
import redis from '../config/redis';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { env } from '../config/env';

// Fast timeout helper for health check pings (300ms in test, 1500ms in dev/prod)
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export const healthCheck = asyncHandler(async (_req: Request, res: Response) => {
  const startTime = Date.now();
  const pingTimeoutMs = env.NODE_ENV === 'test' ? 300 : 1500;

  // Check PostgreSQL
  let dbStatus: 'healthy' | 'unhealthy' = 'unhealthy';
  let dbLatency = 0;
  try {
    const dbStart = Date.now();
    await withTimeout(prisma.$queryRaw`SELECT 1`, pingTimeoutMs);
    dbLatency = Date.now() - dbStart;
    dbStatus = 'healthy';
  } catch {
    dbStatus = 'unhealthy';
  }

  // Check Redis
  let redisStatus: 'healthy' | 'unhealthy' = 'unhealthy';
  let redisLatency = 0;
  try {
    const redisStart = Date.now();
    await withTimeout(redis.ping(), pingTimeoutMs);
    redisLatency = Date.now() - redisStart;
    redisStatus = 'healthy';
  } catch {
    redisStatus = 'unhealthy';
  }

  const overallHealthy = dbStatus === 'healthy' && redisStatus === 'healthy';
  const statusCode = overallHealthy ? 200 : 503;
  const totalLatency = Date.now() - startTime;

  const healthData = {
    status: overallHealthy ? 'healthy' : 'degraded',
    environment: env.NODE_ENV,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    latency: `${totalLatency}ms`,
    services: {
      database: {
        status: dbStatus,
        latency: `${dbLatency}ms`,
      },
      redis: {
        status: redisStatus,
        latency: `${redisLatency}ms`,
      },
    },
    version: process.env.npm_package_version ?? '1.0.0',
  };

  res
    .status(statusCode)
    .json(new ApiResponse(statusCode, overallHealthy ? 'All systems healthy' : 'Service degraded', healthData));
});
