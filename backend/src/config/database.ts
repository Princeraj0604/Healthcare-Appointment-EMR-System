import { PrismaClient } from '@prisma/client';
import { env } from './env';

// ============================================================
// Prisma Client Singleton
// In development: reuse the same instance across hot reloads
// In production:  single global instance
// ============================================================

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const prisma =
  global.__prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
    errorFormat: 'colorless',
  });

if (env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export default prisma;

// ============================================================
// Connection helper — call in server startup
// ============================================================
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅  PostgreSQL connected via Prisma');
  } catch (error: any) {
    console.error('❌  Failed to connect to PostgreSQL:', error.message ?? error);
    console.warn('💡  Tip: Make sure PostgreSQL is running on localhost:5432, or run `docker compose up -d` in the root folder.');
    
    // In production, exit fast. In dev, keep process running so health checks report degraded.
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('🔌  PostgreSQL disconnected');
  } catch {
    // Ignore disconnect errors on shutdown
  }
}
