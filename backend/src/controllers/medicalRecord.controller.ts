import { Request, Response } from 'express';
import { medicalRecordService } from '../services/medicalRecord.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

// ============================================================
// Medical Record Controller
// ============================================================

/**
 * POST /api/v1/medical-records
 * Create medical record (Doctor only)
 */
export const createMedicalRecord = asyncHandler(async (req: Request, res: Response) => {
  const record = await medicalRecordService.createMedicalRecord(req.user!.id, req.body);
  res.status(201).json(ApiResponse.created('Medical record created successfully', record));
});

/**
 * GET /api/v1/medical-records/appointment/:appointmentId
 * Get medical record for appointment
 */
export const getRecordByAppointment = asyncHandler(async (req: Request, res: Response) => {
  const record = await medicalRecordService.getRecordByAppointment(req.params.appointmentId, req.user!.id);
  res.status(200).json(ApiResponse.ok('Medical record retrieved', record));
});

/**
 * GET /api/v1/medical-records/patient/:patientUserId
 * Get medical history for patient
 */
export const getPatientHistory = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const result = await medicalRecordService.getPatientHistory(req.params.patientUserId, req.user!.id, page, limit);
  res.status(200).json(result);
});
