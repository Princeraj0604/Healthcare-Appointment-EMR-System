import { Role } from '@prisma/client';

// ============================================================
// Global TypeScript type extensions & shared interfaces
// ============================================================

// ──────────────────────────────────────────────────────────
// Express Request augmentation — adds `user` after auth middleware
// ──────────────────────────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  name: string;
}

// ──────────────────────────────────────────────────────────
// JWT Payloads
// ──────────────────────────────────────────────────────────
export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: Role;
  name: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string; // RefreshToken.id in DB (for revocation)
}

// ──────────────────────────────────────────────────────────
// Pagination
// ──────────────────────────────────────────────────────────
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

export function parsePagination(query: {
  page?: string;
  limit?: string;
}): PaginationOptions {
  const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '10', 10) || 10));
  return { page, limit, skip: (page - 1) * limit };
}

// ──────────────────────────────────────────────────────────
// Doctor availability slot
// ──────────────────────────────────────────────────────────
export interface TimeSlot {
  startTime: string;  // "09:00"
  endTime: string;    // "09:30"
  isAvailable: boolean;
}

// ──────────────────────────────────────────────────────────
// Socket.io event names (centralised to avoid typos)
// ──────────────────────────────────────────────────────────
export const SOCKET_EVENTS = {
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  NOTIFICATION: 'notification',
  APPOINTMENT_UPDATE: 'appointment_update',
  ERROR: 'error',
} as const;
