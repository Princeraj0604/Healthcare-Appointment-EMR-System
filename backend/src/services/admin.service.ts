import prisma from '../config/database';
import { doctorRepository } from '../repositories/doctor.repository';
import { PaginatedResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { AppointmentStatus, PaymentStatus, Role } from '@prisma/client';

export const adminService = {
  /**
   * Get overall platform dashboard stats
   */
  async getDashboardStats() {
    const [
      totalUsers,
      totalDoctors,
      totalPatients,
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      pendingApprovalDoctors,
      revenueResult,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.doctor.count(),
      prisma.patient.count(),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: AppointmentStatus.COMPLETED } }),
      prisma.appointment.count({ where: { status: AppointmentStatus.CANCELLED } }),
      prisma.doctor.count({ where: { isApproved: false } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: PaymentStatus.PAID },
      }),
    ]);

    const totalRevenue = revenueResult._sum.amount ? Number(revenueResult._sum.amount) : 0;

    return {
      totalUsers,
      totalDoctors,
      totalPatients,
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      pendingApprovalDoctors,
      totalRevenue,
    };
  },

  /**
   * List all users with pagination and role filter
   */
  async getUsers(role?: Role, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const where = role ? { role } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
          doctor: { select: { id: true, specialization: true, isApproved: true } },
          patient: { select: { id: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return PaginatedResponse.create('Users retrieved successfully', users, total, page, limit);
  },

  /**
   * Approve or revoke doctor approval
   */
  async setDoctorApproval(doctorId: string, isApproved: boolean) {
    const doctor = await doctorRepository.findById(doctorId);
    if (!doctor) throw ApiError.notFound('Doctor not found');

    const updated = await doctorRepository.setApprovalStatus(doctorId, isApproved);
    return {
      message: `Doctor ${doctor.user.name} has been ${isApproved ? 'approved' : 'unapproved'}`,
      doctor: updated,
    };
  },
};
