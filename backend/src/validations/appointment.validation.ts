import { z } from 'zod';
import { AppointmentStatus, AppointmentType } from '@prisma/client';

// ============================================================
// Appointment Validation Schemas (Zod)
// ============================================================

export const bookAppointmentSchema = z.object({
  body: z.object({
    doctorId: z.string().min(1, 'Doctor ID is required'),
    scheduledAt: z.string().datetime({ message: 'Invalid ISO date string for scheduledAt' }),
    type: z.nativeEnum(AppointmentType).default('IN_PERSON'),
    symptoms: z.string().max(1000).optional(),
  }),
});

export const getAppointmentsQuerySchema = z.object({
  query: z.object({
    status: z.nativeEnum(AppointmentStatus).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const cancelAppointmentSchema = z.object({
  body: z.object({
    cancelReason: z.string().min(3, 'Cancel reason must be at least 3 characters').max(500),
  }),
});

export const updateAppointmentStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(AppointmentStatus),
    notes: z.string().optional(),
  }),
});

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>['body'];
export type GetAppointmentsQuery = z.infer<typeof getAppointmentsQuerySchema>['query'];
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>['body'];
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>['body'];
