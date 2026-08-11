import { Request, Response } from 'express';
import { doctorService } from '../services/doctor.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

// ============================================================
// Doctor Controller — HTTP handling for Doctor module
// ============================================================

/**
 * GET /api/v1/doctors
 * List doctors with search, filters, pagination
 */
export const getDoctors = asyncHandler(async (req: Request, res: Response) => {
  const result = await doctorService.getDoctors(req.query as any);
  res.status(200).json(result);
});

/**
 * GET /api/v1/doctors/:id
 * Get doctor details by ID
 */
export const getDoctorById = asyncHandler(async (req: Request, res: Response) => {
  const doctor = await doctorService.getDoctorById(req.params.id);
  res.status(200).json(ApiResponse.ok('Doctor details retrieved', doctor));
});

/**
 * PUT /api/v1/doctors/profile
 * Update doctor profile (Doctor only)
 */
export const updateDoctorProfile = asyncHandler(async (req: Request, res: Response) => {
  const updatedDoctor = await doctorService.updateProfile(req.user!.id, req.body);
  res.status(200).json(ApiResponse.ok('Doctor profile updated successfully', updatedDoctor));
});

/**
 * PUT /api/v1/doctors/availability
 * Update doctor weekly availability schedule (Doctor only)
 */
export const setDoctorAvailability = asyncHandler(async (req: Request, res: Response) => {
  const result = await doctorService.setAvailability(req.user!.id, req.body);
  res.status(200).json(ApiResponse.ok(result.message, null));
});

/**
 * GET /api/v1/doctors/:id/availability
 * Get available time slots for a doctor on a specific date (YYYY-MM-DD)
 */
export const getDoctorAvailability = asyncHandler(async (req: Request, res: Response) => {
  const doctorId = req.params.id;
  const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];

  const slots = await doctorService.getSlotsForDate(doctorId, dateStr);
  res.status(200).json(ApiResponse.ok(`Available slots for ${dateStr}`, { date: dateStr, slots }));
});

/**
 * GET /api/v1/doctors/:id/reviews
 * Get public reviews for a doctor
 */
export const getDoctorReviews = asyncHandler(async (req: Request, res: Response) => {
  const doctorId = req.params.id;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;

  const result = await doctorService.getDoctorReviews(doctorId, page, limit);
  res.status(200).json(result);
});
