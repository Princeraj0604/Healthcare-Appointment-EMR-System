import Redis from 'ioredis';
import { env } from './env';

// ============================================================
// Redis Client — IORedis
// In production: Distributed locks, session storage, rate limits
// In development: Gracefully disables if local Redis is offline
// ============================================================

const redisConfig = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: env.NODE_ENV === 'development' ? 1 : 3,
  lazyConnect: true,
  enableOfflineQueue: env.NODE_ENV !== 'development',
  retryStrategy(times: number): number | null {
    if (env.NODE_ENV === 'development') {
      return null; // Stop retrying immediately in development if Redis server is offline
    }
    if (times > 5) {
      return null;
    }
    return Math.min(times * 200, 2000);
  },
};

const redis = new Redis(redisConfig);

let isRedisConnected = false;

redis.on('connect', () => {
  isRedisConnected = true;
  console.log('✅  Redis connected');
});

redis.on('error', (err) => {
  if (isRedisConnected || env.NODE_ENV === 'production') {
    console.error('❌  Redis error:', err.message);
  }
});

redis.on('close', () => {
  if (isRedisConnected) {
    console.warn('⚠️   Redis connection closed');
    isRedisConnected = false;
  }
});

export default redis;

// ============================================================
// Connect Redis — call in server startup
// ============================================================
export async function connectRedis(): Promise<void> {
  try {
    await redis.connect();
  } catch (error: any) {
    if (env.NODE_ENV === 'development') {
      console.warn('ℹ️   Redis offline (Development mode: Memory fallback active for locks)');
    } else {
      console.error('❌  Failed to connect to Redis:', error);
      process.exit(1);
    }
  }
}

export async function disconnectRedis(): Promise<void> {
  try {
    if (isRedisConnected) {
      await redis.quit();
      console.log('🔌  Redis disconnected');
    }
  } catch {
    // Ignore disconnect errors
  }
}

// ============================================================
// Redis Utility Helpers (with in-memory fallback for local dev)
// ============================================================

const memoryCache = new Map<string, { value: string; expiresAt: number }>();

/**
 * Set a key-value pair with TTL (in seconds)
 */
export async function setWithTTL(
  key: string,
  value: string,
  ttlSeconds: number
): Promise<void> {
  if (isRedisConnected) {
    await redis.setex(key, ttlSeconds, value);
  } else {
    memoryCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }
}

/**
 * Acquire a distributed lock (for slot booking)
 */
export async function acquireLock(
  key: string,
  ttlSeconds: number = 30
): Promise<boolean> {
  if (isRedisConnected) {
    const result = await redis.set(key, '1', 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  } else {
    // In-memory lock fallback for development mode when Redis is not running
    const now = Date.now();
    const existing = memoryCache.get(key);
    if (existing && existing.expiresAt > now) {
      return false; // Locked
    }
    memoryCache.set(key, { value: '1', expiresAt: now + ttlSeconds * 1000 });
    return true;
  }
}

/**
 * Release a distributed lock
 */
export async function releaseLock(key: string): Promise<void> {
  if (isRedisConnected) {
    await redis.del(key);
  } else {
    memoryCache.delete(key);
  }
}

/**
 * Generate Redis key for appointment slot locking
 */
export function appointmentSlotKey(
  doctorId: string,
  date: string,
  time: string
): string {
  return `lock:appointment:${doctorId}:${date}:${time.replace(':', '')}`;
}
