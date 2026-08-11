import { PrismaClient } from '@prisma/client';
import { env } from './env';

// ============================================================
// Prisma Client Singleton
// In development: reuse the same instance across hot reloads
// In production:  single global instance
// ============================================================

declare global {
  // Allow global var in TS without error
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
  } catch (error) {
    console.error('❌  Failed to connect to PostgreSQL:', error);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('🔌  PostgreSQL disconnected');
}
