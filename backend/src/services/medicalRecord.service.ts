import { medicalRecordRepository } from '../repositories/medicalRecord.repository';
import { appointmentRepository } from '../repositories/appointment.repository';
import prisma from '../config/database';
import { ApiError } from '../utils/ApiError';
import { PaginatedResponse } from '../utils/ApiResponse';
import { CreateMedicalRecordInput } from '../validations/medicalRecord.validation';
import { AppointmentStatus } from '@prisma/client';

export const medicalRecordService = {
  /**
   * Doctor uploads medical record for a completed/confirmed appointment
   */
  async createMedicalRecord(doctorUserId: string, input: CreateMedicalRecordInput) {
    const appointment = await appointmentRepository.findById(input.appointmentId);
    if (!appointment) throw ApiError.notFound('Appointment not found');

    if (appointment.doctor.userId !== doctorUserId) {
      throw ApiError.forbidden('Only the treating doctor can add a medical record for this appointment');
    }

    // Check if record already exists for this appointment
    const existing = await medicalRecordRepository.findByAppointmentId(input.appointmentId);
    if (existing) {
      throw ApiError.conflict('A medical record already exists for this appointment');
    }

    const record = await medicalRecordRepository.create({
      appointmentId: input.appointmentId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      diagnosis: input.diagnosis,
      prescription: input.prescription,
      labReports: input.labReports,
      notes: input.notes,
      followUpDate: input.followUpDate ? new Date(input.followUpDate) : undefined,
    });

    // Mark appointment status as COMPLETED if it wasn't already
    if (appointment.status !== AppointmentStatus.COMPLETED) {
      await appointmentRepository.updateStatus(input.appointmentId, AppointmentStatus.COMPLETED);
    }

    return record;
  },

  /**
   * Get record by appointment ID
   */
  async getRecordByAppointment(appointmentId: string, userId: string) {
    const appointment = await appointmentRepository.findById(appointmentId);
    if (!appointment) throw ApiError.notFound('Appointment not found');

    const isPatient = appointment.patient.userId === userId;
    const isDoctor = appointment.doctor.userId === userId;

    if (!isPatient && !isDoctor) {
      throw ApiError.forbidden('You are not authorized to view this record');
    }

    const record = await medicalRecordRepository.findByAppointmentId(appointmentId);
    if (!record) throw ApiError.notFound('No medical record found for this appointment');

    return record;
  },

  /**
   * Get patient medical history
   */
  async getPatientHistory(patientUserId: string, requestingUserId: string, page: number = 1, limit: number = 10) {
    const patient = await prisma.patient.findUnique({ where: { userId: patientUserId } });
    if (!patient) throw ApiError.notFound('Patient profile not found');

    // Ownership or Doctor access check
    const isOwner = patientUserId === requestingUserId;
    const requestingUser = await prisma.user.findUnique({ where: { id: requestingUserId } });
    const isDoctorOrAdmin = requestingUser?.role === 'DOCTOR' || requestingUser?.role === 'ADMIN';

    if (!isOwner && !isDoctorOrAdmin) {
      throw ApiError.forbidden('You are not authorized to view this patient\'s medical history');
    }

    const { records, total } = await medicalRecordRepository.findByPatientId(patient.id, page, limit);
    return PaginatedResponse.create('Medical history retrieved', records, total, page, limit);
  },
};
