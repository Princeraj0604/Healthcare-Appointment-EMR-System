import Redis from 'ioredis';
import { env } from './env';

// ============================================================
// Redis Client — IORedis
// Used for:
//   - Slot locking (double booking prevention)
//   - Rate limiting
//   - OTP storage (fast lookup)
//   - Session caching
// ============================================================

const redisConfig = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  retryStrategy(times: number): number | null {
    if (times > 5) {
      console.error('❌  Redis: Max retry attempts reached');
      return null; // Stop retrying
    }
    return Math.min(times * 200, 2000); // Exponential backoff
  },
};

const redis = new Redis(redisConfig);

redis.on('connect', () => console.log('✅  Redis connected'));
redis.on('error', (err) => console.error('❌  Redis error:', err.message));
redis.on('close', () => console.warn('⚠️   Redis connection closed'));

export default redis;

// ============================================================
// Connect Redis — call in server startup
// ============================================================
export async function connectRedis(): Promise<void> {
  try {
    await redis.connect();
  } catch (error) {
    console.error('❌  Failed to connect to Redis:', error);
    // Redis failure is non-fatal in development; fatal in production
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
  console.log('🔌  Redis disconnected');
}

// ============================================================
// Redis Utility Helpers
// ============================================================

/**
 * Set a key-value pair with TTL (in seconds)
 */
export async function setWithTTL(
  key: string,
  value: string,
  ttlSeconds: number
): Promise<void> {
  await redis.setex(key, ttlSeconds, value);
}

/**
 * Acquire a distributed lock (for slot booking)
 * Returns true if lock acquired, false if already locked
 */
export async function acquireLock(
  key: string,
  ttlSeconds: number = 30
): Promise<boolean> {
  // NX = only set if NOT exists; EX = expiry in seconds
  const result = await redis.set(key, '1', 'EX', ttlSeconds, 'NX');
  return result === 'OK';
}

/**
 * Release a distributed lock
 */
export async function releaseLock(key: string): Promise<void> {
  await redis.del(key);
}

/**
 * Generate Redis key for appointment slot locking
 * e.g. lock:appointment:doctorId:2026-08-15:1030
 */
export function appointmentSlotKey(
  doctorId: string,
  date: string, // YYYY-MM-DD
  time: string  // HH:MM
): string {
  return `lock:appointment:${doctorId}:${date}:${time.replace(':', '')}`;
}
