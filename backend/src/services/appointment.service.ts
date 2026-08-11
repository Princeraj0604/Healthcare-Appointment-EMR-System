import { appointmentRepository } from '../repositories/appointment.repository';
import { doctorRepository } from '../repositories/doctor.repository';
import prisma from '../config/database';
import { acquireLock, releaseLock, appointmentSlotKey } from '../config/redis';
import { ApiError } from '../utils/ApiError';
import { PaginatedResponse } from '../utils/ApiResponse';
import { sendAppointmentConfirmation } from '../utils/mailer';
import logger from '../utils/logger';
import { BookAppointmentInput, GetAppointmentsQuery } from '../validations/appointment.validation';
import { AppointmentStatus, DayOfWeek, Role } from '@prisma/client';
import { SOCKET_EVENTS } from '../types/index';

const JS_DAY_TO_ENUM: Record<number, DayOfWeek> = {
  0: 'SUNDAY',
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
};

export const appointmentService = {
  /**
   * Book appointment with REDIS DISTRIBUTED LOCK for double-booking protection
   */
  async bookAppointment(userId: string, input: BookAppointmentInput) {
    // 1. Get Patient profile for logged in user
    const patient = await prisma.patient.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!patient) {
      throw ApiError.notFound('Patient profile not found. Complete profile first.');
    }

    const doctor = await doctorRepository.findById(input.doctorId);
    if (!doctor || !doctor.isApproved) {
      throw ApiError.notFound('Doctor not found or not approved for booking');
    }

    // Parse date and time
    const scheduledAt = new Date(input.scheduledAt);
    if (isNaN(scheduledAt.getTime()) || scheduledAt < new Date()) {
      throw ApiError.badRequest('Scheduled time must be a valid future date and time');
    }

    const dateStr = scheduledAt.toISOString().substring(0, 10);
    const timeStr = scheduledAt.toISOString().substring(11, 16);

    // 2. REDIS LOCK KEY for double-booking prevention
    const lockKey = appointmentSlotKey(doctor.id, dateStr, timeStr);
    const lockAcquired = await acquireLock(lockKey, 30); // 30 second lock TTL

    if (!lockAcquired) {
      throw ApiError.conflict(
        'This slot is currently being processed by another patient. Please select a different time slot or try again shortly.'
      );
    }

    try {
      // 3. Verify Doctor is working on this day of week
      const dayOfWeek = JS_DAY_TO_ENUM[scheduledAt.getDay()];
      const availability = await doctorRepository.getAvailabilityByDay(doctor.id, dayOfWeek);

      if (!availability || !availability.isActive) {
        throw ApiError.badRequest(`Dr. ${doctor.user.name} is not available on ${dayOfWeek}s`);
      }

      // 4. Check DB for slot conflict
      const isBooked = await appointmentRepository.isSlotBooked(doctor.id, scheduledAt);
      if (isBooked) {
        throw ApiError.conflict('This appointment slot has already been booked.');
      }

      // 5. Create Appointment in DB
      const appointment = await appointmentRepository.create({
        patientId: patient.id,
        doctorId: doctor.id,
        scheduledAt,
        duration: availability.slotDuration,
        type: input.type,
        symptoms: input.symptoms,
      });

      // 6. Send async confirmation email (non-blocking)
      sendAppointmentConfirmation(patient.user.email, {
        patientName: patient.user.name,
        doctorName: doctor.user.name,
        specialization: doctor.specialization,
        dateTime: scheduledAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        type: input.type,
        appointmentId: appointment.id,
      }).catch((err) => logger.error('Failed to send confirmation email:', err));

      // 7. Trigger Socket.io real-time notification to Doctor
      const io = (global as any).io;
      if (io) {
        io.to(`user:${doctor.userId}`).emit(SOCKET_EVENTS.APPOINTMENT_UPDATE, {
          type: 'NEW_APPOINTMENT',
          appointmentId: appointment.id,
          patientName: patient.user.name,
          scheduledAt: appointment.scheduledAt,
        });
      }

      logger.info(`Appointment ${appointment.id} booked for patient ${patient.id} with doctor ${doctor.id}`);

      return appointment;
    } finally {
      // ALWAYS release Redis lock in finally block
      await releaseLock(lockKey);
    }
  },

  /**
   * Get user's appointments (Patient sees own, Doctor sees own)
   */
  async getUserAppointments(userId: string, role: Role, query: GetAppointmentsQuery) {
    if (role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId } });
      if (!patient) throw ApiError.notFound('Patient profile not found');

      const { appointments, total, page, limit } = await appointmentRepository.findByPatient(patient.id, query);
      return PaginatedResponse.create('Patient appointments retrieved', appointments, total, page, limit);
    } else if (role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({ where: { userId } });
      if (!doctor) throw ApiError.notFound('Doctor profile not found');

      const { appointments, total, page, limit } = await appointmentRepository.findByDoctor(doctor.id, query);
      return PaginatedResponse.create('Doctor appointments retrieved', appointments, total, page, limit);
    } else {
      throw ApiError.forbidden('Invalid role for viewing appointments');
    }
  },

  /**
   * Get appointment by ID with security ownership check
   */
  async getAppointmentById(appointmentId: string, userId: string, role: Role) {
    const appointment = await appointmentRepository.findById(appointmentId);
    if (!appointment) throw ApiError.notFound('Appointment not found');

    if (role === 'PATIENT' && appointment.patient.userId !== userId) {
      throw ApiError.forbidden('You are not authorized to view this appointment');
    }

    if (role === 'DOCTOR' && appointment.doctor.userId !== userId) {
      throw ApiError.forbidden('You are not authorized to view this appointment');
    }

    return appointment;
  },

  /**
   * Cancel appointment
   */
  async cancelAppointment(appointmentId: string, userId: string, cancelReason: string) {
    const appointment = await appointmentRepository.findById(appointmentId);
    if (!appointment) throw ApiError.notFound('Appointment not found');

    const isPatient = appointment.patient.userId === userId;
    const isDoctor = appointment.doctor.userId === userId;

    if (!isPatient && !isDoctor) {
      throw ApiError.forbidden('You can only cancel your own appointments');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw ApiError.badRequest('Appointment is already cancelled');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw ApiError.badRequest('Completed appointments cannot be cancelled');
    }

    const updated = await appointmentRepository.updateStatus(appointmentId, AppointmentStatus.CANCELLED, {
      cancelReason,
      cancelledBy: userId,
    });

    logger.info(`Appointment ${appointmentId} cancelled by user ${userId}`);
    return updated;
  },

  /**
   * Doctor updates appointment status (e.g. CONFIRMED, COMPLETED)
   */
  async updateStatus(appointmentId: string, doctorUserId: string, status: AppointmentStatus, notes?: string) {
    const appointment = await appointmentRepository.findById(appointmentId);
    if (!appointment) throw ApiError.notFound('Appointment not found');

    if (appointment.doctor.userId !== doctorUserId) {
      throw ApiError.forbidden('Only the assigned doctor can update appointment status');
    }

    const updated = await appointmentRepository.updateStatus(appointmentId, status, { notes });
    return updated;
  },
};
