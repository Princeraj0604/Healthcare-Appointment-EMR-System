import { z } from 'zod';

// ============================================================
// Medical Record Validation Schemas (Zod)
// ============================================================

export const createMedicalRecordSchema = z.object({
  body: z.object({
    appointmentId: z.string().min(1, 'Appointment ID is required'),
    diagnosis: z.string().min(3, 'Diagnosis is required'),
    prescription: z.string().optional(),
    labReports: z.array(z.string().url('Lab report must be a valid URL')).default([]),
    notes: z.string().optional(),
    followUpDate: z.string().datetime().optional(),
  }),
});

export type CreateMedicalRecordInput = z.infer<typeof createMedicalRecordSchema>['body'];
