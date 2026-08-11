import prisma from '../config/database';
import { Prisma, DayOfWeek } from '@prisma/client';
import { GetDoctorsQuery } from '../validations/doctor.validation';
import { parsePagination } from '../types/index';

// ============================================================
// Doctor Repository — DB layer for Doctor & Availability
// ============================================================

export const doctorRepository = {
  /**
   * Find doctor by Doctor entity ID
   */
  async findById(id: string) {
    return prisma.doctor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        availability: true,
      },
    });
  },

  /**
   * Find doctor profile by User ID
   */
  async findByUserId(userId: string) {
    return prisma.doctor.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        availability: true,
      },
    });
  },

  /**
   * Find all doctors with filters, search, sorting, and pagination
   */
  async findAll(query: GetDoctorsQuery) {
    const { page, limit, skip } = parsePagination({
      page: query.page,
      limit: query.limit,
    });

    const where: Prisma.DoctorWhereInput = {
      isApproved: true, // Only show approved doctors publicly
      user: {
        isActive: true,
      },
    };

    // Filter by Specialization
    if (query.specialization) {
      where.specialization = {
        equals: query.specialization,
        mode: 'insensitive',
      };
    }

    // Filter by Minimum Experience
    if (query.minExperience !== undefined) {
      where.experience = { gte: query.minExperience };
    }

    // Filter by Maximum Consultation Fee
    if (query.maxFee !== undefined) {
      where.consultationFee = { lte: query.maxFee };
    }

    // Filter by Minimum Rating
    if (query.minRating !== undefined) {
      where.avgRating = { gte: query.minRating };
    }

    // Search by name or clinic address
    if (query.search) {
      where.OR = [
        {
          user: {
            name: { contains: query.search, mode: 'insensitive' },
          },
        },
        {
          specialization: { contains: query.search, mode: 'insensitive' },
        },
        {
          clinicAddress: { contains: query.search, mode: 'insensitive' },
        },
      ];
    }

    // Sorting
    const sortBy = query.sortBy ?? 'avgRating';
    const sortOrder = query.sortOrder ?? 'desc';
    const orderBy = { [sortBy]: sortOrder };

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.doctor.count({ where }),
    ]);

    return { doctors, total, page, limit };
  },

  /**
   * Update doctor profile
   */
  async updateProfile(id: string, data: Prisma.DoctorUpdateInput) {
    return prisma.doctor.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
    });
  },

  /**
   * Upsert doctor's weekly availability schedule
   */
  async setAvailability(
    doctorId: string,
    schedules: Array<{
      dayOfWeek: DayOfWeek;
      startTime: string;
      endTime: string;
      slotDuration: number;
      breakStart?: string | null;
      breakEnd?: string | null;
      isActive: boolean;
    }>
  ) {
    return prisma.$transaction(
      schedules.map((schedule) =>
        prisma.doctorAvailability.upsert({
          where: {
            doctorId_dayOfWeek: {
              doctorId,
              dayOfWeek: schedule.dayOfWeek,
            },
          },
          update: {
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            slotDuration: schedule.slotDuration,
            breakStart: schedule.breakStart,
            breakEnd: schedule.breakEnd,
            isActive: schedule.isActive,
          },
          create: {
            doctorId,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            slotDuration: schedule.slotDuration,
            breakStart: schedule.breakStart,
            breakEnd: schedule.breakEnd,
            isActive: schedule.isActive,
          },
        })
      )
    );
  },

  /**
   * Get availability template for a doctor
   */
  async getAvailability(doctorId: string) {
    return prisma.doctorAvailability.findMany({
      where: { doctorId, isActive: true },
    });
  },

  /**
   * Get availability for a specific day of week
   */
  async getAvailabilityByDay(doctorId: string, dayOfWeek: DayOfWeek) {
    return prisma.doctorAvailability.findUnique({
      where: {
        doctorId_dayOfWeek: {
          doctorId,
          dayOfWeek,
        },
      },
    });
  },

  /**
   * Get doctor reviews with pagination
   */
  async getReviews(doctorId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { doctorId, isPublic: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  name: true,
                  avatar: true,
                },
              },
            },
          },
        },
      }),
      prisma.review.count({ where: { doctorId, isPublic: true } }),
    ]);

    return { reviews, total, page, limit };
  },

  /**
   * Admin: Approve or revoke doctor approval
   */
  async setApprovalStatus(doctorId: string, isApproved: boolean) {
    return prisma.doctor.update({
      where: { id: doctorId },
      data: { isApproved },
    });
  },
};
