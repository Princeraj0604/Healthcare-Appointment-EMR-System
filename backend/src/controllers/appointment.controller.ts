import { Request, Response } from 'express';
import { appointmentService } from '../services/appointment.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

// ============================================================
// Appointment Controller — HTTP interface for Appointment Engine
// ============================================================

/**
 * POST /api/v1/appointments
 * Book an appointment (Patient only)
 */
export const bookAppointment = asyncHandler(async (req: Request, res: Response) => {
  const appointment = await appointmentService.bookAppointment(req.user!.id, req.body);
  res.status(201).json(ApiResponse.created('Appointment booked successfully', appointment));
});

/**
 * GET /api/v1/appointments
 * List user's appointments (Patient or Doctor)
 */
export const getMyAppointments = asyncHandler(async (req: Request, res: Response) => {
  const result = await appointmentService.getUserAppointments(req.user!.id, req.user!.role, req.query as any);
  res.status(200).json(result);
});

/**
 * GET /api/v1/appointments/:id
 * Get single appointment details
 */
export const getAppointmentById = asyncHandler(async (req: Request, res: Response) => {
  const appointment = await appointmentService.getAppointmentById(req.params.id, req.user!.id, req.user!.role);
  res.status(200).json(ApiResponse.ok('Appointment details retrieved', appointment));
});

/**
 * PUT /api/v1/appointments/:id/cancel
 * Cancel an appointment (Patient or Doctor)
 */
export const cancelAppointment = asyncHandler(async (req: Request, res: Response) => {
  const { cancelReason } = req.body;
  const updated = await appointmentService.cancelAppointment(req.params.id, req.user!.id, cancelReason);
  res.status(200).json(ApiResponse.ok('Appointment cancelled successfully', updated));
});

/**
 * PUT /api/v1/appointments/:id/status
 * Doctor updates appointment status (e.g. CONFIRMED, COMPLETED)
 */
export const updateAppointmentStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, notes } = req.body;
  const updated = await appointmentService.updateStatus(req.params.id, req.user!.id, status, notes);
  res.status(200).json(ApiResponse.ok(`Appointment marked as ${status}`, updated));
});
