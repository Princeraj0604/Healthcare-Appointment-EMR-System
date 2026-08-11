import prisma from '../config/database';
import { AppointmentStatus, AppointmentType, Prisma } from '@prisma/client';
import { parsePagination } from '../types/index';

// ============================================================
// Appointment Repository — Database layer for Appointments
// ============================================================

export const appointmentRepository = {
  /**
   * Find appointment by ID with full patient, doctor, payment, and record relations
   */
  async findById(id: string) {
    return prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
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
        },
        doctor: {
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
        },
        payment: true,
        medicalRecord: true,
      },
    });
  },

  /**
   * Check if doctor already has an active appointment at exact scheduledAt
   */
  async isSlotBooked(doctorId: string, scheduledAt: Date): Promise<boolean> {
    const existing = await prisma.appointment.findFirst({
      where: {
        doctorId,
        scheduledAt,
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        },
      },
    });

    return !!existing;
  },

  /**
   * Create a new appointment
   */
  async create(data: {
    patientId: string;
    doctorId: string;
    scheduledAt: Date;
    duration?: number;
    type?: AppointmentType;
    symptoms?: string;
  }) {
    return prisma.appointment.create({
      data: {
        patientId: data.patientId,
        doctorId: data.doctorId,
        scheduledAt: data.scheduledAt,
        duration: data.duration ?? 30,
        type: data.type ?? 'IN_PERSON',
        symptoms: data.symptoms,
        status: AppointmentStatus.PENDING,
      },
      include: {
        doctor: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
        patient: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });
  },

  /**
   * Find appointments for a patient (paginated)
   */
  async findByPatient(
    patientId: string,
    query: { status?: AppointmentStatus; page?: string; limit?: string }
  ) {
    const { page, limit, skip } = parsePagination({
      page: query.page,
      limit: query.limit,
    });

    const where: Prisma.AppointmentWhereInput = { patientId };
    if (query.status) {
      where.status = query.status;
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
        include: {
          doctor: {
            include: {
              user: {
                select: { name: true, avatar: true },
              },
            },
          },
          payment: true,
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    return { appointments, total, page, limit };
  },

  /**
   * Find appointments for a doctor (paginated)
   */
  async findByDoctor(
    doctorId: string,
    query: { status?: AppointmentStatus; startDate?: string; endDate?: string; page?: string; limit?: string }
  ) {
    const { page, limit, skip } = parsePagination({
      page: query.page,
      limit: query.limit,
    });

    const where: Prisma.AppointmentWhereInput = { doctorId };
    if (query.status) {
      where.status = query.status;
    }

    if (query.startDate && query.endDate) {
      where.scheduledAt = {
        gte: new Date(query.startDate),
        lte: new Date(query.endDate),
      };
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'asc' },
        include: {
          patient: {
            include: {
              user: {
                select: { name: true, phone: true, avatar: true },
              },
            },
          },
          payment: true,
          medicalRecord: true,
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    return { appointments, total, page, limit };
  },

  /**
   * Update appointment status & notes
   */
  async updateStatus(
    id: string,
    status: AppointmentStatus,
    extra?: { notes?: string; cancelReason?: string; cancelledBy?: string }
  ) {
    return prisma.appointment.update({
      where: { id },
      data: {
        status,
        ...(extra?.notes && { notes: extra.notes }),
        ...(extra?.cancelReason && { cancelReason: extra.cancelReason }),
        ...(extra?.cancelledBy && { cancelledBy: extra.cancelledBy }),
        ...(status === AppointmentStatus.CANCELLED && { cancelledAt: new Date() }),
      },
    });
  },

  /**
   * Reschedule appointment
   */
  async reschedule(id: string, newScheduledAt: Date) {
    return prisma.appointment.update({
      where: { id },
      data: {
        scheduledAt: newScheduledAt,
        status: AppointmentStatus.PENDING,
      },
    });
  },
};
