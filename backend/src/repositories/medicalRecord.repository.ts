import prisma from '../config/database';

// ============================================================
// Medical Record Repository
// ============================================================

export const medicalRecordRepository = {
  async create(data: {
    appointmentId: string;
    patientId: string;
    doctorId: string;
    diagnosis: string;
    prescription?: string;
    labReports?: string[];
    notes?: string;
    followUpDate?: Date;
  }) {
    return prisma.medicalRecord.create({
      data,
      include: {
        doctor: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
        patient: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    });
  },

  async findByAppointmentId(appointmentId: string) {
    return prisma.medicalRecord.findUnique({
      where: { appointmentId },
      include: {
        doctor: {
          select: {
            specialization: true,
            user: {
              select: { name: true },
            },
          },
        },
      },
    });
  },

  async findByPatientId(patientId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      prisma.medicalRecord.findMany({
        where: { patientId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          doctor: {
            include: {
              user: {
                select: { name: true },
              },
            },
          },
        },
      }),
      prisma.medicalRecord.count({ where: { patientId } }),
    ]);

    return { records, total, page, limit };
  },
};
