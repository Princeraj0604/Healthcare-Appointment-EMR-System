import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import logger from './utils/logger';
import { SOCKET_EVENTS } from './types/index';

// ============================================================
// Server Entry Point
// Startup order:
//   1. Connect PostgreSQL
//   2. Connect Redis
//   3. Start HTTP server
//   4. Attach Socket.io
//   5. Register graceful shutdown handlers
// ============================================================

async function bootstrap(): Promise<void> {
  try {
    logger.info('🚀  Starting Healthcare Appointment API...');

    // 1. Connect to PostgreSQL via Prisma
    await connectDatabase();

    // 2. Connect to Redis
    await connectRedis();

    // 3. Create Express app
    const app = createApp();

    // 4. Create HTTP server
    const httpServer = http.createServer(app);

    // 5. Attach Socket.io for real-time notifications
    const io = new SocketServer(httpServer, {
      cors: {
        origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
        credentials: true,
      },
      pingTimeout: 60000,
    });

    // Store io instance globally for use in services
    (global as Record<string, unknown>).io = io;

    io.on('connection', (socket) => {
      logger.debug(`Socket connected: ${socket.id}`);

      // Client joins their personal room (using userId)
      socket.on(SOCKET_EVENTS.JOIN_ROOM, (userId: string) => {
        socket.join(`user:${userId}`);
        logger.debug(`Socket ${socket.id} joined room: user:${userId}`);
      });

      socket.on(SOCKET_EVENTS.LEAVE_ROOM, (userId: string) => {
        socket.leave(`user:${userId}`);
      });

      socket.on('disconnect', () => {
        logger.debug(`Socket disconnected: ${socket.id}`);
      });
    });

    // 6. Start listening
    httpServer.listen(env.PORT, () => {
      logger.info(`✅  Server running on port ${env.PORT}`);
      logger.info(`📖  Environment: ${env.NODE_ENV}`);
      logger.info(`🔗  API: http://localhost:${env.PORT}${env.API_PREFIX}`);
      logger.info(`❤️   Health: http://localhost:${env.PORT}${env.API_PREFIX}/health`);
    });

    // ── Graceful Shutdown ────────────────────────────────────
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`\n⚠️   ${signal} received. Graceful shutdown initiated...`);

      httpServer.close(async () => {
        logger.info('🛑  HTTP server closed');

        await disconnectDatabase();
        await disconnectRedis();

        logger.info('✅  Graceful shutdown complete');
        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        logger.error('❌  Force exit after 10s timeout');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('uncaughtException', (error) => {
      logger.error('💥  Uncaught Exception:', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('💥  Unhandled Rejection:', { reason });
      process.exit(1);
    });
  } catch (error) {
    logger.error('❌  Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
