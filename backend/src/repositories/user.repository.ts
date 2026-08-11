import { User, Role } from '@prisma/client';
import prisma from '../config/database';

// ============================================================
// User Repository — All DB operations related to users
// ============================================================

export type SafeUser = Omit<User, 'passwordHash'>;

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  avatar: true,
  isVerified: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
};

export const userRepository = {
  /**
   * Find user by ID (without password)
   */
  async findById(id: string): Promise<SafeUser | null> {
    return prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    });
  },

  /**
   * Find user by email (with password — for auth only)
   */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },

  /**
   * Find user by email (without password)
   */
  async findByEmail(email: string): Promise<SafeUser | null> {
    return prisma.user.findUnique({
      where: { email },
      select: safeUserSelect,
    });
  },

  /**
   * Find user by phone
   */
  async findByPhone(phone: string): Promise<SafeUser | null> {
    return prisma.user.findUnique({
      where: { phone },
      select: safeUserSelect,
    });
  },

  /**
   * Create a new user
   */
  async create(data: {
    name: string;
    email: string;
    phone?: string;
    passwordHash: string;
    role: Role;
  }): Promise<SafeUser> {
    return prisma.user.create({
      data,
      select: safeUserSelect,
    });
  },

  /**
   * Update user verification status
   */
  async markAsVerified(id: string): Promise<SafeUser> {
    return prisma.user.update({
      where: { id },
      data: { isVerified: true },
      select: safeUserSelect,
    });
  },

  /**
   * Update password hash (for password reset)
   */
  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  },

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  },

  /**
   * Check if email already exists
   */
  async emailExists(email: string): Promise<boolean> {
    const count = await prisma.user.count({ where: { email } });
    return count > 0;
  },

  /**
   * Check if phone already exists
   */
  async phoneExists(phone: string): Promise<boolean> {
    const count = await prisma.user.count({ where: { phone } });
    return count > 0;
  },

  /**
   * Get user with their doctor/patient profile
   */
  async findWithProfile(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        ...safeUserSelect,
        doctor: true,
        patient: true,
      },
    });
  },
};
