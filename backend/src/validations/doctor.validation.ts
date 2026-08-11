import { z } from 'zod';
import { DayOfWeek } from '@prisma/client';

// ============================================================
// Doctor Validation Schemas (Zod)
// ============================================================

export const getDoctorsQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    specialization: z.string().optional(),
    minExperience: z.string().transform((v) => Number(v)).optional(),
    maxFee: z.string().transform((v) => Number(v)).optional(),
    minRating: z.string().transform((v) => Number(v)).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.enum(['avgRating', 'experience', 'consultationFee', 'createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export const updateDoctorProfileSchema = z.object({
  body: z.object({
    specialization: z.string().min(2).optional(),
    qualification: z.string().min(2).optional(),
    experience: z.number().int().min(0).max(60).optional(),
    bio: z.string().max(1000).optional(),
    consultationFee: z.number().positive().optional(),
    clinicAddress: z.string().optional(),
    clinicLat: z.number().optional(),
    clinicLng: z.number().optional(),
  }),
});

export const setAvailabilitySchema = z.object({
  body: z.object({
    schedules: z.array(
      z.object({
        dayOfWeek: z.nativeEnum(DayOfWeek),
        startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:MM (24-hour)'),
        endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:MM (24-hour)'),
        slotDuration: z.number().int().min(10).max(120).default(30),
        breakStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
        breakEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
        isActive: z.boolean().default(true),
      })
    ).min(1, 'At least one day schedule is required'),
  }),
});

export const getAvailabilityQuerySchema = z.object({
  query: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD').optional(),
  }),
});

export type GetDoctorsQuery = z.infer<typeof getDoctorsQuerySchema>['query'];
export type UpdateDoctorProfileInput = z.infer<typeof updateDoctorProfileSchema>['body'];
export type SetAvailabilityInput = z.infer<typeof setAvailabilitySchema>['body'];
